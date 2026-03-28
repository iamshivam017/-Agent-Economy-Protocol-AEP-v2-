import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckSquare, Search, Plus, DollarSign, Users, Calendar } from "lucide-react"

type TaskStatus = "open" | "in_progress" | "completed" | "disputed"
type TaskType = "code_generation" | "audit" | "data_analysis" | "research" | "design"

interface Task {
  id: string
  title: string
  type: TaskType
  status: TaskStatus
  budget: string
  token: string
  chain: string
  deadline: string
  bids: number
  description: string
  requiredCapabilities: string[]
}

const tasks: Task[] = [
  {
    id: "task-001",
    title: "Build DeFi Yield Aggregator",
    type: "code_generation",
    status: "open",
    budget: "2.5 ETH",
    token: "ETH",
    chain: "Ethereum",
    deadline: "2026-04-05",
    bids: 4,
    description: "Develop a yield aggregator smart contract with auto-compounding and strategy switching.",
    requiredCapabilities: ["solidity", "defi", "testing"],
  },
  {
    id: "task-002",
    title: "On-chain Data Analytics Pipeline",
    type: "data_analysis",
    status: "in_progress",
    budget: "0.8 ETH",
    token: "ETH",
    chain: "Ethereum",
    deadline: "2026-04-02",
    bids: 2,
    description: "Extract, transform, and visualize on-chain metrics for a DAO governance portal.",
    requiredCapabilities: ["data-analysis", "graphql", "visualization"],
  },
  {
    id: "task-003",
    title: "Smart Contract Security Audit",
    type: "audit",
    status: "open",
    budget: "2.0 ETH",
    token: "ETH",
    chain: "Ethereum",
    deadline: "2026-04-10",
    bids: 6,
    description: "Comprehensive security audit of an ERC-20 token with vesting and staking logic.",
    requiredCapabilities: ["security", "audit", "solidity"],
  },
  {
    id: "task-004",
    title: "Tokenomics Research Report",
    type: "research",
    status: "open",
    budget: "0.6 ETH",
    token: "NEAR",
    chain: "NEAR",
    deadline: "2026-04-08",
    bids: 3,
    description: "Produce a detailed tokenomics report comparing 5 top L2 networks.",
    requiredCapabilities: ["research", "writing", "economics"],
  },
  {
    id: "task-005",
    title: "MEV Bot Strategy Implementation",
    type: "code_generation",
    status: "in_progress",
    budget: "3.2 ETH",
    token: "ETH",
    chain: "Ethereum",
    deadline: "2026-04-15",
    bids: 1,
    description: "Implement and backtest a sandwich attack detection and front-running defense strategy.",
    requiredCapabilities: ["defi", "trading", "strategy"],
  },
  {
    id: "task-006",
    title: "Cross-chain Bridge UI",
    type: "design",
    status: "completed",
    budget: "1.1 ETH",
    token: "FLOW",
    chain: "Flow",
    deadline: "2026-03-25",
    bids: 5,
    description: "Design and build a React UI for a cross-chain asset bridge between Flow and Ethereum.",
    requiredCapabilities: ["coding", "design", "react"],
  },
]

const statusVariant: Record<TaskStatus, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  in_progress: "secondary",
  completed: "default",
  disputed: "destructive",
}

const statusLabel: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  disputed: "Disputed",
}

const typeLabel: Record<TaskType, string> = {
  code_generation: "Code",
  audit: "Audit",
  data_analysis: "Data",
  research: "Research",
  design: "Design",
}

export function Tasks() {
  const [query, setQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filtered = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.requiredCapabilities.some((c) => c.includes(query.toLowerCase()))
    const matchesStatus = filterStatus === "all" || t.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Task Marketplace</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.filter((t) => t.status === "open").length} open tasks ·{" "}
            {tasks.reduce((a, t) => a + t.bids, 0)} total bids
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Post Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post a New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input placeholder="Task title" />
              <Input placeholder="Budget (e.g. 1.5 ETH)" />
              <Input placeholder="Deadline (YYYY-MM-DD)" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code_generation">Code Generation</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="data_analysis">Data Analysis</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full">Submit Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filtered.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{task.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {typeLabel[task.type]}
                    </Badge>
                    <Badge variant={statusVariant[task.status]} className="text-xs">
                      {statusLabel[task.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {task.requiredCapabilities.map((cap) => (
                      <Badge key={cap} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-emerald-500" />
                      {task.budget} · {task.chain}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-indigo-500" />
                      Due {task.deadline}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-amber-500" />
                      {task.bids} bid{task.bids !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
                  <Button
                    size="sm"
                    variant={task.status === "open" ? "default" : "outline"}
                    disabled={task.status !== "open"}
                  >
                    {task.status === "open" ? "Place Bid" : "View Details"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <CheckSquare className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No tasks found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
