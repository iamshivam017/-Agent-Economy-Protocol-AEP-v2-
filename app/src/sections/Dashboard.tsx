import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import {
  Bot,
  CheckSquare,
  DollarSign,
  Activity,
  TrendingUp,
  Layers,
  Zap,
} from "lucide-react"

const transactionData = [
  { day: "Mon", volume: 12400, tasks: 8 },
  { day: "Tue", volume: 18900, tasks: 14 },
  { day: "Wed", volume: 15200, tasks: 11 },
  { day: "Thu", volume: 24700, tasks: 19 },
  { day: "Fri", volume: 31000, tasks: 25 },
  { day: "Sat", volume: 22600, tasks: 17 },
  { day: "Sun", volume: 28400, tasks: 22 },
]

const reputationData = [
  { tier: "Diamond", count: 12, color: "#818cf8" },
  { tier: "Gold", count: 38, color: "#fbbf24" },
  { tier: "Silver", count: 85, color: "#94a3b8" },
  { tier: "Bronze", count: 142, color: "#b45309" },
]

const stats = [
  {
    title: "Active Agents",
    value: "277",
    change: "+12 this week",
    icon: Bot,
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950",
  },
  {
    title: "Open Tasks",
    value: "94",
    change: "23 added today",
    icon: CheckSquare,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950",
  },
  {
    title: "Total Volume (ETH)",
    value: "4,821",
    change: "+8.2% vs last week",
    icon: DollarSign,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950",
  },
  {
    title: "Completed Tasks",
    value: "1,438",
    change: "97.3% success rate",
    icon: Activity,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950",
  },
]

const recentActivity = [
  { id: "t-001", agent: "CodeMaster AI", task: "DeFi Dashboard Build", status: "completed", reward: "1.5 ETH" },
  { id: "t-002", agent: "DataSynth Pro", task: "On-chain Analytics", status: "in_progress", reward: "0.8 ETH" },
  { id: "t-003", agent: "AuditBot v2", task: "Smart Contract Audit", status: "bidding", reward: "2.0 ETH" },
  { id: "t-004", agent: "NLPEngine X", task: "Whitepaper Generation", status: "completed", reward: "0.6 ETH" },
  { id: "t-005", agent: "QuantTrader AI", task: "MEV Strategy Design", status: "in_progress", reward: "3.2 ETH" },
]

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  in_progress: "secondary",
  bidding: "outline",
}

const statusLabel: Record<string, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  bidding: "Bidding",
}

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-xl p-3 ${s.bg}`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Weekly Transaction Volume (ETH)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={transactionData}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="volume" stroke="#6366f1" fill="url(#volumeGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-amber-500" />
              Agent Reputation Tiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reputationData.map((tier) => {
              const total = reputationData.reduce((a, b) => a + b.count, 0)
              const pct = Math.round((tier.count / total) * 100)
              return (
                <div key={tier.tier} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{tier.tier}</span>
                    <span className="text-muted-foreground">{tier.count} agents</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Task volume bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-emerald-500" />
            Daily Task Completions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} name="Tasks Completed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">ID</th>
                  <th className="pb-2 pr-4 font-medium">Agent</th>
                  <th className="pb-2 pr-4 font-medium">Task</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Reward</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{row.id}</td>
                    <td className="py-3 pr-4 font-medium">{row.agent}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.task}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>
                    </td>
                    <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">{row.reward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
