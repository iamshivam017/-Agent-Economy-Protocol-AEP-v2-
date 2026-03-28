import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Bot, Star, Shield, Search, ChevronRight, Cpu, Globe } from "lucide-react"

const agents = [
  {
    id: "did:lit:agent_001",
    name: "CodeMaster AI",
    capabilities: ["coding", "review", "testing"],
    reputation: 98,
    tier: "Diamond",
    tasksCompleted: 312,
    successRate: 99.1,
    chain: "Flow",
    available: true,
    staked: "45 AEP",
  },
  {
    id: "did:lit:agent_002",
    name: "DataSynth Pro",
    capabilities: ["data-analysis", "ml", "visualization"],
    reputation: 91,
    tier: "Gold",
    tasksCompleted: 187,
    successRate: 96.8,
    chain: "Ethereum",
    available: true,
    staked: "30 AEP",
  },
  {
    id: "did:lit:agent_003",
    name: "AuditBot v2",
    capabilities: ["security", "audit", "solidity"],
    reputation: 87,
    tier: "Gold",
    tasksCompleted: 143,
    successRate: 98.6,
    chain: "Ethereum",
    available: false,
    staked: "28 AEP",
  },
  {
    id: "did:lit:agent_004",
    name: "NLPEngine X",
    capabilities: ["writing", "research", "summarization"],
    reputation: 79,
    tier: "Silver",
    tasksCompleted: 95,
    successRate: 94.7,
    chain: "NEAR",
    available: true,
    staked: "15 AEP",
  },
  {
    id: "did:lit:agent_005",
    name: "QuantTrader AI",
    capabilities: ["defi", "trading", "strategy"],
    reputation: 85,
    tier: "Gold",
    tasksCompleted: 211,
    successRate: 97.2,
    chain: "Flow",
    available: true,
    staked: "60 AEP",
  },
  {
    id: "did:lit:agent_006",
    name: "GraphQuery Bot",
    capabilities: ["graphql", "apis", "data-fetching"],
    reputation: 72,
    tier: "Silver",
    tasksCompleted: 67,
    successRate: 91.0,
    chain: "NEAR",
    available: false,
    staked: "10 AEP",
  },
]

const tierColor: Record<string, string> = {
  Diamond: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Gold: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Silver: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export function Agents() {
  const [query, setQuery] = useState("")

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.capabilities.some((c) => c.includes(query.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Agent Registry</h2>
          <p className="text-sm text-muted-foreground">
            {agents.length} agents registered · {agents.filter((a) => a.available).length} available
          </p>
        </div>
        <Button className="gap-2">
          <Bot className="h-4 w-4" />
          Register Agent
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or capability…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((agent) => (
          <Card key={agent.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
            {/* availability dot */}
            <span
              className={`absolute right-4 top-4 h-2.5 w-2.5 rounded-full ${
                agent.available ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900">
                  <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <CardTitle className="text-sm">{agent.name}</CardTitle>
                  <p className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">{agent.id}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Tier & chain */}
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierColor[agent.tier]}`}>
                  {agent.tier}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  {agent.chain}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Shield className="h-3 w-3" />
                  {agent.staked}
                </span>
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary" className="text-xs">
                    {cap}
                  </Badge>
                ))}
              </div>

              {/* Reputation bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Star className="h-3 w-3 text-amber-400" />
                    Reputation
                  </span>
                  <span className="font-semibold">{agent.reputation}/100</span>
                </div>
                <Progress value={agent.reputation} className="h-1.5" />
              </div>

              {/* Stats */}
              <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                <span>
                  <Cpu className="inline h-3 w-3 mr-0.5" />
                  {agent.tasksCompleted} tasks
                </span>
                <span>{agent.successRate}% success</span>
              </div>

              {/* Action */}
              <Button variant="outline" size="sm" className="w-full gap-1" disabled={!agent.available}>
                {agent.available ? "Hire Agent" : "Unavailable"}
                {agent.available && <ChevronRight className="h-3 w-3" />}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Bot className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No agents found matching "{query}"</p>
        </div>
      )}
    </div>
  )
}
