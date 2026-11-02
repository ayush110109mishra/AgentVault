import React, { useState, useEffect } from 'react';
import {
  WorkflowRun,
  ExecutionEvent,
  AppSettings,
  Agent
} from './domain/types';
import {
  loadStoredRuns,
  saveStoredRuns,
  loadStoredEvents,
  saveStoredEvents,
  loadStoredSettings,
  saveStoredSettings,
  clearAllHistory,
  exportHistoryAsJson
} from './services/persistence';
import { checkServerHealth, ServerHealthResponse } from './services/api';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { AgentMarketplace } from './components/agents/AgentMarketplace';
import { WorkflowRunsView } from './components/workflows/WorkflowRunsView';
import { TrustDashboard } from './components/trust/TrustDashboard';
import { ExecutionLogsView } from './components/logs/ExecutionLogsView';
import { CsvAnalysisModal } from './components/dashboard/CsvAnalysisModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { FileSpreadsheet, Settings, Sun, Moon } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('command');
  const [runs, setRuns] = useState<WorkflowRun[]>(() => loadStoredRuns());
  const [events, setEvents] = useState<ExecutionEvent[]>(() => loadStoredEvents());
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());
  const [activeRun, setActiveRun] = useState<WorkflowRun | null>(null);

  // Theme Management (Light with previous color combinations / Dark mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('agentvault_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('agentvault_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [serverHealth, setServerHealth] = useState<ServerHealthResponse | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [initialPromptForCommand, setInitialPromptForCommand] = useState('');

  // Initial Health Check
  useEffect(() => {
    checkServerHealth().then(res => {
      setServerHealth(res);
      setHasGeminiKey(res.hasGeminiKey);
    });
  }, []);

  // Sync state to local persistence
  useEffect(() => {
    saveStoredRuns(runs);
  }, [runs]);

  useEffect(() => {
    saveStoredEvents(events);
  }, [events]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAddEvent = (eventData: Omit<ExecutionEvent, 'id' | 'timestamp'>) => {
    const newEvent: ExecutionEvent = {
      ...eventData,
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleAddOrUpdateRun = (run: WorkflowRun) => {
    setRuns(prev => {
      const existsIndex = prev.findIndex(r => r.id === run.id);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex] = run;
        return next;
      }
      return [run, ...prev];
    });
  };

  const handleSelectAgentForTask = (agent: Agent, customPrompt?: string) => {
    const prompt = customPrompt || `Run a specialized task with ${agent.name}: `;
    setInitialPromptForCommand(prompt);
    setCurrentTab('command');
    showToast({
      type: 'info',
      title: `${agent.name} Selected`,
      message: 'Command composer pre-filled with agent context.'
    });
  };

  const handleTransferCsvToPlanner = (prompt: string, analysisSummary: string) => {
    setInitialPromptForCommand(prompt);
    setCurrentTab('command');
    showToast({
      type: 'success',
      title: 'Dataset Transferred',
      message: 'Statistical summary ready for multi-agent synthesis.'
    });
  };

  const handleExportAllData = () => {
    const jsonStr = exportHistoryAsJson(runs, events);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentvault_audit_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({
      type: 'success',
      title: 'Audit Log Exported',
      message: 'Complete execution history downloaded as JSON.'
    });
  };

  const handleClearAllData = () => {
    clearAllHistory();
    setRuns([]);
    setEvents([]);
    setActiveRun(null);
    showToast({
      type: 'info',
      title: 'History Cleared',
      message: 'All local execution logs and runs have been wiped.'
    });
  };

  const activeRunsCount = runs.filter(r => r.status === 'running').length;
  const pendingApprovalsCount = runs.filter(r => r.status === 'awaiting_approval').length;

  const tabLabels: Record<NavTab, string> = {
    command: 'Command Center',
    marketplace: 'Agent Catalog',
    runs: 'Workflow Runs',
    trust: 'Trust & Guardrails',
    logs: 'Execution Logs'
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] dark:bg-[#090D16] text-[#153B75] dark:text-[#F1F5F9] flex flex-col md:flex-row relative overflow-x-hidden transition-colors duration-150">
      {/* Side Navigation Bar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        activeRunsCount={activeRunsCount}
        pendingApprovalsCount={pendingApprovalsCount}
        hasGeminiKey={hasGeminiKey}
        serverHealth={serverHealth}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F0F4FA] dark:bg-[#090D16] transition-colors duration-150">
        {/* Top Control Bar */}
        <header className="h-13 bg-white dark:bg-[#0B0F19] border-b border-[#E2E8F0] dark:border-[#1E293B] px-4 sm:px-6 flex items-center justify-between shrink-0 transition-colors">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#53657E] dark:text-[#64748B]">
            <span className="text-[#175CD3] dark:text-[#94A3B8] font-medium">AgentVault X</span>
            <span>/</span>
            <span className="text-[#153B75] dark:text-[#F8FAFC] font-semibold">{tabLabels[currentTab]}</span>
          </div>

          {/* Right Status & Quick Utilities */}
          <div className="flex items-center gap-2.5">
            {/* Active Model Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#F8FAFC] dark:bg-[#090D16] border border-[#E2E8F0] dark:border-[#1E293B] text-[11px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${serverHealth?.providerStatus === 'connected' ? 'bg-[#059669] dark:bg-[#10B981]' : 'bg-[#D97706] dark:bg-[#F59E0B]'}`} />
              <span className="text-[#153B75] dark:text-[#F8FAFC] font-semibold">{serverHealth?.model || 'Gemma 2 Safe Engine'}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#EFF8FF] text-[#175CD3] dark:bg-[#1E293B] dark:text-[#38BDF8] border border-[#B2DDFF] dark:border-[#334155] uppercase">
                {serverHealth?.isOpenWeight ? 'Open-Weight' : 'Proprietary'}
              </span>
            </div>

            {/* Quick CSV Tool */}
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="px-2.5 py-1 rounded bg-[#F8FAFC] dark:bg-[#131E33] hover:bg-[#F1F5F9] dark:hover:bg-[#182642] border border-[#CBD5E1] dark:border-[#1E293B] text-[11px] font-medium text-[#153B75] dark:text-[#F8FAFC] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Analyze CSV Data"
            >
              <FileSpreadsheet size={13} className="text-[#F07828] dark:text-[#F97316]" />
              <span className="hidden sm:inline">CSV Studio</span>
            </button>

            {/* Theme Toggle Button in Top Bar */}
            <button
              onClick={handleToggleTheme}
              className="p-1.5 text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#131E33] border border-[#CBD5E1] dark:border-[#1E293B] rounded transition-colors cursor-pointer flex items-center justify-center bg-white dark:bg-[#0F172A]"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={15} className="text-[#F97316]" />
              ) : (
                <Moon size={15} className="text-[#175CD3]" />
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#131E33] rounded transition-colors cursor-pointer"
              aria-label="Platform Settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'command' && (
            <CommandCenter
              onAddEvent={handleAddEvent}
              onAddOrUpdateRun={handleAddOrUpdateRun}
              activeRun={activeRun}
              onSetActiveRun={setActiveRun}
              settings={settings}
              hasGeminiKey={hasGeminiKey}
              onShowToast={showToast}
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onNavigateToTab={(tab: string) => setCurrentTab(tab as NavTab)}
              initialPrompt={initialPromptForCommand}
              runs={runs}
            />
          )}

          {currentTab === 'marketplace' && (
            <AgentMarketplace onSelectAgentForTask={handleSelectAgentForTask} />
          )}

          {currentTab === 'runs' && (
            <WorkflowRunsView
              runs={runs}
              onSelectRun={(runId) => {
                const matched = runs.find(r => r.id === runId);
                if (matched) {
                  setActiveRun(matched);
                  setCurrentTab('command');
                }
              }}
              onResumeRun={(runId) => {
                const matched = runs.find(r => r.id === runId);
                if (matched) {
                  setActiveRun(matched);
                  setCurrentTab('command');
                }
              }}
              onPauseRun={() => {}}
              onCancelRun={() => {}}
              onRetryStep={(runId, stepId) => {
                const matched = runs.find(r => r.id === runId);
                if (matched) {
                  setActiveRun(matched);
                  setCurrentTab('command');
                }
              }}
              onExportRuns={handleExportAllData}
            />
          )}

          {currentTab === 'trust' && <TrustDashboard />}

          {currentTab === 'logs' && (
            <ExecutionLogsView
              events={events}
              onClearLogs={handleClearAllData}
              onExportLogs={handleExportAllData}
            />
          )}
        </main>
      </div>

      {/* Modals & Toasts */}
      <CsvAnalysisModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onTransferToPlanner={handleTransferCsvToPlanner}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onClearAllData={handleClearAllData}
        onExportAllData={handleExportAllData}
        hasGeminiKey={hasGeminiKey}
        serverHealth={serverHealth}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
