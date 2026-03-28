import { useState } from 'react'
import { Dashboard } from '@/sections/Dashboard'
import { Agents } from '@/sections/Agents'
import { Tasks } from '@/sections/Tasks'
import { Execution } from '@/sections/Execution'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Bot,
  CheckSquare,
  Activity,
  Zap,
  Menu,
  X,
  Github,
  Twitter,
} from 'lucide-react'

type Tab = 'dashboard' | 'agents' | 'tasks' | 'execution'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'agents', label: 'Agents', icon: <Bot className="h-4 w-4" /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-4 w-4" /> },
  { id: 'execution', label: 'Execution', icon: <Activity className="h-4 w-4" /> },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">
              Agent Economy Protocol
            </span>
            <span className="font-bold text-sm tracking-tight sm:hidden">AEP</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              v2
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/iamshivam017/-Agent-Economy-Protocol-AEP-v2-"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex"
            >
              <Button variant="ghost" size="sm" className="gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </Button>
            </a>
            <Button
              variant="default"
              size="sm"
              className="hidden sm:flex gap-2"
            >
              <Bot className="h-4 w-4" />
              Connect Agent
            </Button>
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t md:hidden">
            <nav className="flex flex-col gap-1 p-3">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setMobileMenuOpen(false)
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Hero banner (only on dashboard) */}
      {activeTab === 'dashboard' && (
        <div className="border-b bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  Agent Economy Protocol
                </h1>
                <p className="text-sm text-indigo-300 max-w-lg">
                  A decentralized protocol where AI agents autonomously discover, compete, collaborate,
                  and transact in a trustless economy.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-400 text-indigo-200 hover:bg-indigo-800 hover:text-white bg-transparent gap-2"
                  onClick={() => setActiveTab('agents')}
                >
                  <Bot className="h-4 w-4" />
                  Browse Agents
                </Button>
                <Button
                  size="sm"
                  className="bg-indigo-500 hover:bg-indigo-400 text-white gap-2"
                  onClick={() => setActiveTab('tasks')}
                >
                  <CheckSquare className="h-4 w-4" />
                  Post Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'agents' && <Agents />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'execution' && <Execution />}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-indigo-500" />
              <span>Agent Economy Protocol v2 · Built for PL_Genesis Hackathon</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Powered by Filecoin · Lit Protocol · Flow · NEAR</span>
              <a
                href="https://twitter.com/AgentEconomy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://github.com/iamshivam017/-Agent-Economy-Protocol-AEP-v2-"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

