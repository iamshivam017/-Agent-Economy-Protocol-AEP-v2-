// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AEPReputation
 * @notice Reputation and staking contract for Agent Economy Protocol
 * @dev Manages agent reputation scores and staking
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AEPReputation is ReentrancyGuard, Ownable {
    
    // ============ Structs ============
    
    struct AgentProfile {
        address agent;
        uint256 reputationScore;      // 0-10000 (100.00)
        uint256 totalStaked;
        uint256 stakedAt;
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 totalEarnings;
        bool isRegistered;
        uint256 registeredAt;
        string metadataCid;
    }
    
    struct ReputationUpdate {
        uint256 timestamp;
        int256 scoreChange;
        string reason;
        bytes32 taskId;
    }
    
    // ============ State Variables ============
    
    // Staking token
    IERC20 public stakingToken;
    
    // Minimum stake to participate
    uint256 public minStake = 100e18; // 100 tokens
    
    // Reputation parameters
    uint256 public constant MAX_REPUTATION = 10000; // 100.00
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public reputationDecayRate = 1; // Daily decay in basis points
    
    // Slashing parameters
    uint256 public slashPercentage = 1000; // 10% in basis points
    uint256 public constant SLASH_DENOMINATOR = 10000;
    
    // Agent data
    mapping(address => AgentProfile) public agents;
    mapping(address => ReputationUpdate[]) public reputationHistory;
    address[] public registeredAgents;
    
    // Authorized contracts that can update reputation
    mapping(address => bool) public authorizedUpdaters;
    
    // ============ Events ============
    
    event AgentRegistered(address indexed agent, uint256 stake, string metadataCid);
    event StakeIncreased(address indexed agent, uint256 amount, uint256 total);
    event StakeDecreased(address indexed agent, uint256 amount, uint256 total);
    event ReputationUpdated(
        address indexed agent,
        int256 change,
        uint256 newScore,
        string reason
    );
    event AgentSlashed(address indexed agent, uint256 amount, string reason);
    event MinStakeUpdated(uint256 newMinStake);
    event UpdaterAuthorized(address updater, bool authorized);
    
    // ============ Modifiers ============
    
    modifier onlyRegistered() {
        require(agents[msg.sender].isRegistered, "Agent not registered");
        _;
    }
    
    modifier onlyUpdater() {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _stakingToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Register as an agent with initial stake
     * @param _metadataCid IPFS CID of agent metadata
     * @param _initialStake Amount to stake
     */
    function register(string calldata _metadataCid, uint256 _initialStake)
        external
        nonReentrant
    {
        require(!agents[msg.sender].isRegistered, "Already registered");
        require(_initialStake >= minStake, "Stake below minimum");
        require(bytes(_metadataCid).length > 0, "Metadata required");
        
        // Transfer stake
        require(
            stakingToken.transferFrom(msg.sender, address(this), _initialStake),
            "Stake transfer failed"
        );
        
        // Create profile
        agents[msg.sender] = AgentProfile({
            agent: msg.sender,
            reputationScore: 5000, // Start at 50.00
            totalStaked: _initialStake,
            stakedAt: block.timestamp,
            tasksCompleted: 0,
            tasksFailed: 0,
            totalEarnings: 0,
            isRegistered: true,
            registeredAt: block.timestamp,
            metadataCid: _metadataCid
        });
        
        registeredAgents.push(msg.sender);
        
        emit AgentRegistered(msg.sender, _initialStake, _metadataCid);
    }
    
    /**
     * @notice Increase stake
     * @param _amount Additional amount to stake
     */
    function increaseStake(uint256 _amount) external onlyRegistered nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        
        AgentProfile storage agent = agents[msg.sender];
        
        require(
            stakingToken.transferFrom(msg.sender, address(this), _amount),
            "Stake transfer failed"
        );
        
        agent.totalStaked += _amount;
        
        // Boost reputation slightly for additional stake
        uint256 boost = (_amount * 10) / 1e18; // 0.01 per token
        if (boost > 0) {
            _updateReputation(msg.sender, int256(boost), "Stake increase");
        }
        
        emit StakeIncreased(msg.sender, _amount, agent.totalStaked);
    }
    
    /**
     * @notice Decrease stake (with cooldown)
     * @param _amount Amount to unstake
     */
    function decreaseStake(uint256 _amount) external onlyRegistered nonReentrant {
        AgentProfile storage agent = agents[msg.sender];
        
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= agent.totalStaked, "Insufficient stake");
        require(
            agent.totalStaked - _amount >= minStake || agent.totalStaked - _amount == 0,
            "Cannot go below minimum"
        );
        
        // 7-day cooldown check
        require(
            block.timestamp >= agent.stakedAt + 7 days,
            "Stake still locked"
        );
        
        agent.totalStaked -= _amount;
        
        require(stakingToken.transfer(msg.sender, _amount), "Unstake failed");
        
        // Penalty for unstaking
        if (agent.totalStaked > 0) {
            _updateReputation(msg.sender, -50, "Stake decrease");
        }
        
        emit StakeDecreased(msg.sender, _amount, agent.totalStaked);
    }
    
    /**
     * @notice Update agent reputation (authorized only)
     * @param _agent Agent address
     * @param _scoreChange Reputation change (+/-)
     * @param _reason Reason for update
     * @param _taskId Related task ID
     */
    function updateReputation(
        address _agent,
        int256 _scoreChange,
        string calldata _reason,
        bytes32 _taskId
    ) external onlyUpdater {
        require(agents[_agent].isRegistered, "Agent not registered");
        
        _updateReputation(_agent, _scoreChange, _reason);
        
        reputationHistory[_agent].push(ReputationUpdate({
            timestamp: block.timestamp,
            scoreChange: _scoreChange,
            reason: _reason,
            taskId: _taskId
        }));
        
        // Update task counters
        if (_scoreChange > 0) {
            agents[_agent].tasksCompleted++;
        } else if (_scoreChange < -100) {
            agents[_agent].tasksFailed++;
        }
    }
    
    /**
     * @notice Slash agent stake for misconduct
     * @param _agent Agent to slash
     * @param _reason Reason for slashing
     */
    function slashAgent(address _agent, string calldata _reason)
        external
        onlyUpdater
        nonReentrant
    {
        AgentProfile storage agent = agents[_agent];
        require(agent.isRegistered, "Agent not registered");
        
        uint256 slashAmount = (agent.totalStaked * slashPercentage) / SLASH_DENOMINATOR;
        require(slashAmount > 0, "Nothing to slash");
        
        agent.totalStaked -= slashAmount;
        
        // Significant reputation hit
        _updateReputation(_agent, -2000, "Slashed: misconduct");
        
        // Transfer slashed amount to treasury (owner)
        require(stakingToken.transfer(owner(), slashAmount), "Slash transfer failed");
        
        emit AgentSlashed(_agent, slashAmount, _reason);
    }
    
    /**
     * @notice Record earnings for an agent
     * @param _agent Agent address
     * @param _amount Amount earned
     */
    function recordEarnings(address _agent, uint256 _amount) external onlyUpdater {
        AgentProfile storage agent = agents[_agent];
        require(agent.isRegistered, "Agent not registered");
        
        agent.totalEarnings += _amount;
        
        // Small reputation boost for earnings
        int256 boost = int256(_amount / 1e18); // 1 point per token earned
        if (boost > 0) {
            _updateReputation(_agent, boost > 100 ? 100 : boost, "Earnings recorded");
        }
    }
    
    /**
     * @notice Update agent metadata
     * @param _metadataCid New metadata CID
     */
    function updateMetadata(string calldata _metadataCid) external onlyRegistered {
        require(bytes(_metadataCid).length > 0, "Invalid metadata");
        agents[msg.sender].metadataCid = _metadataCid;
    }
    
    // ============ Internal Functions ============
    
    function _updateReputation(
        address _agent,
        int256 _change,
        string memory _reason
    ) internal {
        AgentProfile storage agent = agents[_agent];
        
        int256 currentScore = int256(agent.reputationScore);
        int256 newScore = currentScore + _change;
        
        // Clamp to valid range
        if (newScore > int256(MAX_REPUTATION)) {
            newScore = int256(MAX_REPUTATION);
        } else if (newScore < int256(MIN_REPUTATION)) {
            newScore = int256(MIN_REPUTATION);
        }
        
        agent.reputationScore = uint256(newScore);
        
        emit ReputationUpdated(_agent, _change, uint256(newScore), _reason);
    }
    
    // ============ Admin Functions ============
    
    function setMinStake(uint256 _newMinStake) external onlyOwner {
        minStake = _newMinStake;
        emit MinStakeUpdated(_newMinStake);
    }
    
    function setAuthorizedUpdater(address _updater, bool _authorized) external onlyOwner {
        authorizedUpdaters[_updater] = _authorized;
        emit UpdaterAuthorized(_updater, _authorized);
    }
    
    function setSlashPercentage(uint256 _newPercentage) external onlyOwner {
        require(_newPercentage <= 5000, "Max 50%");
        slashPercentage = _newPercentage;
    }
    
    function setStakingToken(address _newToken) external onlyOwner {
        stakingToken = IERC20(_newToken);
    }
    
    // ============ View Functions ============
    
    function getAgentProfile(address _agent)
        external
        view
        returns (AgentProfile memory)
    {
        return agents[_agent];
    }
    
    function getReputation(address _agent) external view returns (uint256) {
        return agents[_agent].reputationScore;
    }
    
    function getReputationHistory(address _agent)
        external
        view
        returns (ReputationUpdate[] memory)
    {
        return reputationHistory[_agent];
    }
    
    function getLeaderboard(uint256 _count)
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        uint256 count = _count > registeredAgents.length ? registeredAgents.length : _count;
        
        address[] memory topAgents = new address[](count);
        uint256[] memory scores = new uint256[](count);
        
        // Simple bubble sort (for small datasets)
        for (uint i = 0; i < registeredAgents.length; i++) {
            uint256 score = agents[registeredAgents[i]].reputationScore;
            
            for (uint j = 0; j < count; j++) {
                if (score > scores[j]) {
                    // Shift and insert
                    for (uint k = count - 1; k > j; k--) {
                        scores[k] = scores[k - 1];
                        topAgents[k] = topAgents[k - 1];
                    }
                    scores[j] = score;
                    topAgents[j] = registeredAgents[i];
                    break;
                }
            }
        }
        
        return (topAgents, scores);
    }
    
    function isRegistered(address _agent) external view returns (bool) {
        return agents[_agent].isRegistered;
    }
    
    function getRegisteredAgents() external view returns (address[] memory) {
        return registeredAgents;
    }
    
    function getRegisteredAgentsCount() external view returns (uint256) {
        return registeredAgents.length;
    }
}
