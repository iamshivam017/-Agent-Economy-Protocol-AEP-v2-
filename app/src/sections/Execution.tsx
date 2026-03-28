import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, CheckCircle, Clock, AlertTriangle, Terminal } from "lucide-react"

type LogLevel = "info" | "success" | "warning" | "error"

interface LogEntry {
  time: string
  level: LogLevel
  message: string
}

interface Execution {
  id: string
  task: string
  agent: string
  status: "running" | "completed" | "failed"
  progress: number
  startedAt: string
  logs: LogEntry[]
}

const executions: Execution[] = [
  {
    id: "exec-001",
    task: "Build DeFi Yield Aggregator",
    agent: "CodeMaster AI",
    status: "running",
    progress: 68,
    startedAt: "2026-03-28 10:12:00",
    logs: [
      { time: "10:12:00", level: "info", message: "Execution context initialized" },
      { time: "10:12:02", level: "info", message: "Loading task requirements..." },
      { time: "10:12:05", level: "success", message: "Requirements parsed: 4 smart contract functions identified" },
      { time: "10:14:30", level: "info", message: "Generating Solidity code for YieldAggregator.sol" },
      { time: "10:18:45", level: "info", message: "Running unit tests (12/18 passed)" },
      { time: "10:21:10", level: "warning", message: "Gas optimization: consider using unchecked blocks" },
      { time: "10:24:00", level: "info", message: "Refactoring for gas efficiency..." },
    ],
  },
  {
    id: "exec-002",
    task: "MEV Bot Strategy Implementation",
    agent: "QuantTrader AI",
    status: "running",
    progress: 45,
    startedAt: "2026-03-28 09:55:00",
    logs: [
      { time: "09:55:00", level: "info", message: "Fetching historical block data from Ethereum mainnet" },
      { time: "09:57:12", level: "info", message: "Loaded 50,000 transactions for analysis" },
      { time: "10:03:44", level: "success", message: "Sandwich opportunity pattern identified: 1,247 occurrences" },
      { time: "10:08:22", level: "info", message: "Backtesting strategy on historical data..." },
      { time: "10:15:01", level: "warning", message: "Slippage threshold may reduce profitability" },
    ],
  },
  {
    id: "exec-003",
    task: "Cross-chain Bridge UI",
    agent: "CodeMaster AI",
    status: "completed",
    progress: 100,
    startedAt: "2026-03-25 14:00:00",
    logs: [
      { time: "14:00:00", level: "info", message: "Scaffolding React application" },
      { time: "14:05:30", level: "info", message: "Integrating Flow + Ethereum wallet connectors" },
      { time: "14:22:15", level: "success", message: "Bridge UI components built and tested" },
      { time: "14:35:00", level: "success", message: "Deployed to IPFS: QmXyz... " },
      { time: "14:36:00", level: "success", message: "Task completed. Result submitted to escrow." },
    ],
  },
]

const levelColor: Record<LogLevel, string> = {
  info: "text-blue-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-rose-500",
}

const levelIcon: Record<LogLevel, React.ReactNode> = {
  info: <Activity className="h-3 w-3" />,
  success: <CheckCircle className="h-3 w-3" />,
  warning: <AlertTriangle className="h-3 w-3" />,
  error: <AlertTriangle className="h-3 w-3" />,
}

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  running: { label: "Running", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
}

export function Execution() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Execution Monitor</h2>
        <p className="text-sm text-muted-foreground">
          Real-time AI agent execution logs and progress
        </p>
      </div>

      <div className="space-y-4">
        {executions.map((exec) => (
          <Card key={exec.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm">{exec.task}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Agent: <span className="font-medium">{exec.agent}</span> · Started {exec.startedAt}
                  </p>
                </div>
                <Badge variant={statusBadge[exec.status].variant}>
                  {statusBadge[exec.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Progress
                  </span>
                  <span>{exec.progress}%</span>
                </div>
                <Progress value={exec.progress} className="h-1.5" />
              </div>

              {/* Logs */}
              <div className="rounded-lg border bg-slate-950 dark:bg-black">
                <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-1.5">
                  <Terminal className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400 font-mono">execution log</span>
                  <span className="ml-auto font-mono text-xs text-slate-500">{exec.id}</span>
                </div>
                <ScrollArea className="h-40">
                  <div className="p-3 space-y-1">
                    {exec.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 font-mono text-xs">
                        <span className="text-slate-500 shrink-0">{log.time}</span>
                        <span className={`shrink-0 flex items-center gap-0.5 ${levelColor[log.level]}`}>
                          {levelIcon[log.level]}
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    ))}
                    {exec.status === "running" && (
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-500 animate-pulse">
                        <span className="text-slate-600">now</span>
                        <span className="text-blue-400">INFO</span>
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
