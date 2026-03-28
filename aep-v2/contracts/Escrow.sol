// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AEPEscrow
 * @notice Escrow contract for Agent Economy Protocol
 * @dev Handles task payments with dispute resolution
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AEPEscrow is ReentrancyGuard, Pausable, Ownable {
    
    // ============ Enums ============
    
    enum EscrowStatus {
        Pending,      // Funds locked, waiting for execution
        Executing,    // Task is being executed
        Completed,    // Task completed successfully
        Disputed,     // Under dispute
        Resolved,     // Dispute resolved
        Refunded      // Funds refunded to creator
    }
    
    enum DisputeOutcome {
        Pending,
        CreatorWins,
        AgentWins,
        Split
    }
    
    // ============ Structs ============
    
    struct Escrow {
        bytes32 taskId;
        address creator;
        address agent;
        address token;
        uint256 amount;
        uint256 fee;
        uint256 createdAt;
        uint256 deadline;
        EscrowStatus status;
        DisputeOutcome outcome;
        string resultCid;  // IPFS CID of task result
    }
    
    struct Dispute {
        bytes32 escrowId;
        address initiator;
        string reason;
        uint256 createdAt;
        address[] arbitrators;
        mapping(address => DisputeOutcome) votes;
        uint256 votesCount;
    }
    
    // ============ State Variables ============
    
    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Minimum and maximum dispute resolution time
    uint256 public minDisputeTime = 1 days;
    uint256 public maxDisputeTime = 7 days;
    
    // Escrow storage
    mapping(bytes32 => Escrow) public escrows;
    mapping(bytes32 => Dispute) public disputes;
    mapping(address => bool) public authorizedTokens;
    mapping(address => bool) public arbitrators;
    
    // Counters
    bytes32[] public escrowList;
    uint256 public totalEscrows;
    uint256 public totalVolume;
    
    // ============ Events ============
    
    event EscrowCreated(
        bytes32 indexed escrowId,
        bytes32 indexed taskId,
        address indexed creator,
        address agent,
        address token,
        uint256 amount,
        uint256 deadline
    );
    
    event ExecutionStarted(bytes32 indexed escrowId, address indexed agent);
    event TaskCompleted(bytes32 indexed escrowId, string resultCid);
    event FundsReleased(bytes32 indexed escrowId, address indexed agent, uint256 amount);
    event FundsRefunded(bytes32 indexed escrowId, address indexed creator, uint256 amount);
    
    event DisputeInitiated(
        bytes32 indexed escrowId,
        address indexed initiator,
        string reason
    );
    
    event DisputeResolved(
        bytes32 indexed escrowId,
        DisputeOutcome outcome,
        address winner
    );
    
    event ArbitratorVoted(
        bytes32 indexed escrowId,
        address indexed arbitrator,
        DisputeOutcome outcome
    );
    
    event PlatformFeeUpdated(uint256 newFee);
    event TokenAuthorizationUpdated(address token, bool authorized);
    event ArbitratorUpdated(address arbitrator, bool status);
    
    // ============ Modifiers ============
    
    modifier onlyArbitrator() {
        require(arbitrators[msg.sender], "Not an arbitrator");
        _;
    }
    
    modifier escrowExists(bytes32 _escrowId) {
        require(escrows[_escrowId].creator != address(0), "Escrow does not exist");
        _;
    }
    
    modifier onlyCreator(bytes32 _escrowId) {
        require(escrows[_escrowId].creator == msg.sender, "Not the creator");
        _;
    }
    
    modifier onlyAgent(bytes32 _escrowId) {
        require(escrows[_escrowId].agent == msg.sender, "Not the agent");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        // Authorize ETH (address(0)) by default
        authorizedTokens[address(0)] = true;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Create a new escrow for a task
     * @param _taskId Unique task identifier
     * @param _agent Address of the assigned agent
     * @param _token Token address (address(0) for ETH)
     * @param _amount Amount to lock in escrow
     * @param _deadline Task deadline timestamp
     */
    function createEscrow(
        bytes32 _taskId,
        address _agent,
        address _token,
        uint256 _amount,
        uint256 _deadline
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(_agent != address(0), "Invalid agent address");
        require(authorizedTokens[_token], "Token not authorized");
        require(_amount > 0, "Amount must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_deadline <= block.timestamp + 30 days, "Deadline too far");
        
        // Calculate fee
        uint256 fee = (_amount * platformFee) / FEE_DENOMINATOR;
        uint256 escrowAmount = _amount - fee;
        
        // Handle token transfer
        if (_token == address(0)) {
            require(msg.value == _amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted for token escrows");
            require(
                IERC20(_token).transferFrom(msg.sender, address(this), _amount),
                "Token transfer failed"
            );
        }
        
        // Generate escrow ID
        bytes32 escrowId = keccak256(
            abi.encodePacked(_taskId, msg.sender, _agent, block.timestamp)
        );
        
        // Create escrow
        escrows[escrowId] = Escrow({
            taskId: _taskId,
            creator: msg.sender,
            agent: _agent,
            token: _token,
            amount: escrowAmount,
            fee: fee,
            createdAt: block.timestamp,
            deadline: _deadline,
            status: EscrowStatus.Pending,
            outcome: DisputeOutcome.Pending,
            resultCid: ""
        });
        
        escrowList.push(escrowId);
        totalEscrows++;
        totalVolume += _amount;
        
        emit EscrowCreated(
            escrowId,
            _taskId,
            msg.sender,
            _agent,
            _token,
            escrowAmount,
            _deadline
        );
        
        return escrowId;
    }
    
    /**
     * @notice Start task execution
     * @param _escrowId Escrow identifier
     */
    function startExecution(bytes32 _escrowId) 
        external 
        escrowExists(_escrowId) 
        onlyAgent(_escrowId) 
    {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Pending, "Invalid status");
        
        escrow.status = EscrowStatus.Executing;
        
        emit ExecutionStarted(_escrowId, msg.sender);
    }
    
    /**
     * @notice Complete task and submit result
     * @param _escrowId Escrow identifier
     * @param _resultCid IPFS CID of the task result
     */
    function completeTask(bytes32 _escrowId, string calldata _resultCid)
        external
        escrowExists(_escrowId)
        onlyAgent(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Executing, "Invalid status");
        require(bytes(_resultCid).length > 0, "Invalid result CID");
        
        escrow.status = EscrowStatus.Completed;
        escrow.resultCid = _resultCid;
        
        emit TaskCompleted(_escrowId, _resultCid);
    }
    
    /**
     * @notice Release funds to agent after successful completion
     * @param _escrowId Escrow identifier
     */
    function releaseFunds(bytes32 _escrowId)
        external
        nonReentrant
        escrowExists(_escrowId)
        onlyCreator(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Completed, "Task not completed");
        
        escrow.status = EscrowStatus.Resolved;
        
        // Transfer funds to agent
        _transfer(escrow.token, escrow.agent, escrow.amount);
        
        emit FundsReleased(_escrowId, escrow.agent, escrow.amount);
    }
    
    /**
     * @notice Initiate a dispute
     * @param _escrowId Escrow identifier
     * @param _reason Reason for dispute
     */
    function initiateDispute(bytes32 _escrowId, string calldata _reason)
        external
        escrowExists(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        require(
            msg.sender == escrow.creator || msg.sender == escrow.agent,
            "Not authorized"
        );
        require(
            escrow.status == EscrowStatus.Executing || 
            escrow.status == EscrowStatus.Completed,
            "Invalid status"
        );
        require(bytes(_reason).length > 0, "Reason required");
        
        escrow.status = EscrowStatus.Disputed;
        
        // Create dispute
        Dispute storage dispute = disputes[_escrowId];
        dispute.escrowId = _escrowId;
        dispute.initiator = msg.sender;
        dispute.reason = _reason;
        dispute.createdAt = block.timestamp;
        
        emit DisputeInitiated(_escrowId, msg.sender, _reason);
    }
    
    /**
     * @notice Arbitrator votes on dispute
     * @param _escrowId Escrow identifier
     * @param _outcome Proposed outcome
     */
    function voteOnDispute(bytes32 _escrowId, DisputeOutcome _outcome)
        external
        onlyArbitrator
        escrowExists(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        Dispute storage dispute = disputes[_escrowId];
        
        require(escrow.status == EscrowStatus.Disputed, "Not disputed");
        require(_outcome != DisputeOutcome.Pending, "Invalid outcome");
        require(dispute.votes[msg.sender] == DisputeOutcome.Pending, "Already voted");
        
        dispute.votes[msg.sender] = _outcome;
        dispute.votesCount++;
        
        emit ArbitratorVoted(_escrowId, msg.sender, _outcome);
        
        // Auto-resolve if enough votes (simplified: 3 votes)
        if (dispute.votesCount >= 3) {
            _resolveDispute(_escrowId);
        }
    }
    
    /**
     * @notice Resolve dispute and distribute funds
     * @param _escrowId Escrow identifier
     */
    function resolveDispute(bytes32 _escrowId)
        external
        onlyOwner
        escrowExists(_escrowId)
    {
        _resolveDispute(_escrowId);
    }
    
    /**
     * @notice Refund creator if deadline passed without execution
     * @param _escrowId Escrow identifier
     */
    function refundExpired(bytes32 _escrowId)
        external
        nonReentrant
        escrowExists(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.Pending || 
            escrow.status == EscrowStatus.Executing,
            "Invalid status"
        );
        require(block.timestamp > escrow.deadline + 1 days, "Deadline not passed");
        
        escrow.status = EscrowStatus.Refunded;
        
        // Return funds to creator (minus fee)
        _transfer(escrow.token, escrow.creator, escrow.amount);
        
        emit FundsRefunded(_escrowId, escrow.creator, escrow.amount);
    }
    
    // ============ Internal Functions ============
    
    function _resolveDispute(bytes32 _escrowId) internal {
        Escrow storage escrow = escrows[_escrowId];
        Dispute storage dispute = disputes[_escrowId];
        
        // Count votes (simplified majority)
        uint256 creatorVotes = 0;
        uint256 agentVotes = 0;
        uint256 splitVotes = 0;
        
        // In a real implementation, iterate through arbitrators
        // For simplicity, using a predetermined outcome based on votes
        DisputeOutcome finalOutcome = _calculateOutcome(_escrowId);
        
        escrow.outcome = finalOutcome;
        escrow.status = EscrowStatus.Resolved;
        
        address winner;
        
        if (finalOutcome == DisputeOutcome.CreatorWins) {
            _transfer(escrow.token, escrow.creator, escrow.amount);
            winner = escrow.creator;
        } else if (finalOutcome == DisputeOutcome.AgentWins) {
            _transfer(escrow.token, escrow.agent, escrow.amount);
            winner = escrow.agent;
        } else {
            // Split 50/50
            uint256 half = escrow.amount / 2;
            _transfer(escrow.token, escrow.creator, half);
            _transfer(escrow.token, escrow.agent, escrow.amount - half);
            winner = address(0);
        }
        
        emit DisputeResolved(_escrowId, finalOutcome, winner);
    }
    
    function _calculateOutcome(bytes32 _escrowId) internal view returns (DisputeOutcome) {
        // Simplified: In production, use proper voting mechanism
        return DisputeOutcome.AgentWins;
    }
    
    function _transfer(address _token, address _to, uint256 _amount) internal {
        if (_token == address(0)) {
            (bool success, ) = payable(_to).call{value: _amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(_token).transfer(_to, _amount), "Token transfer failed");
        }
    }
    
    // ============ Admin Functions ============
    
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }
    
    function setTokenAuthorization(address _token, bool _authorized) external onlyOwner {
        authorizedTokens[_token] = _authorized;
        emit TokenAuthorizationUpdated(_token, _authorized);
    }
    
    function setArbitrator(address _arbitrator, bool _status) external onlyOwner {
        arbitrators[_arbitrator] = _status;
        emit ArbitratorUpdated(_arbitrator, _status);
    }
    
    function withdrawFees(address _token) external onlyOwner {
        // Calculate accumulated fees
        uint256 balance = _token == address(0) 
            ? address(this).balance 
            : IERC20(_token).balanceOf(address(this));
        
        // Subtract locked escrow amounts
        uint256 locked = 0;
        for (uint i = 0; i < escrowList.length; i++) {
            Escrow storage escrow = escrows[escrowList[i]];
            if (escrow.token == _token && escrow.status != EscrowStatus.Resolved) {
                locked += escrow.amount + escrow.fee;
            }
        }
        
        uint256 fees = balance > locked ? balance - locked : 0;
        require(fees > 0, "No fees to withdraw");
        
        _transfer(_token, owner(), fees);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ View Functions ============
    
    function getEscrow(bytes32 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }
    
    function getEscrowsByCreator(address _creator) external view returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < escrowList.length; i++) {
            if (escrows[escrowList[i]].creator == _creator) {
                count++;
            }
        }
        
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        for (uint i = 0; i < escrowList.length; i++) {
            if (escrows[escrowList[i]].creator == _creator) {
                result[index++] = escrowList[i];
            }
        }
        
        return result;
    }
    
    function getEscrowsByAgent(address _agent) external view returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < escrowList.length; i++) {
            if (escrows[escrowList[i]].agent == _agent) {
                count++;
            }
        }
        
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        for (uint i = 0; i < escrowList.length; i++) {
            if (escrows[escrowList[i]].agent == _agent) {
                result[index++] = escrowList[i];
            }
        }
        
        return result;
    }
    
    receive() external payable {
        revert("Direct deposits not allowed");
    }
}
