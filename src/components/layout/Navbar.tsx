import React from 'react';
import { Layers, FileSpreadsheet, Settings, Sparkles } from 'lucide-react';

export type NavTab = 'command' | 'marketplace' | 'runs' | 'trust' | 'logs';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCsvModal: () => void;
  onOpenSettings: () => void;
  activeRunsCount: number;
  pendingApprovalsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCsvModal,
  onOpenSettings,
  activeRunsCount,
  pendingApprovalsCount
}) => {
  return (
    <header className="h-16 border-b border-white/80 bg-white/75 backdrop-blur-2xl sticky top-0 z-40 px-6 sm:px-8 flex items-center justify-between gap-8 shadow-[0_4px_20px_-4px_rgba(23,92,211,0.05)] transition-all">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onSelectTab('command')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#175CD3] via-[#0E47AB] to-[#06B6D4] flex items-center justify-center shadow-md shadow-[#175CD3]/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#175CD3]/40 transition-all">
            <Layers size={19} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-black tracking-tight text-[#153B75] whitespace-nowrap leading-none flex items-center gap-1">
              AgentVault <span className="text-[#F07828] text-xl font-black">X</span>
            </span>
            <span className="text-[10px] font-mono tracking-wider text-[#53657E] font-medium uppercase mt-0.5">
              Control Plane
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-[#EAF1FB]/50 border border-white/80 backdrop-blur-md">
        <button
          onClick={() => onSelectTab('command')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
            currentTab === 'command'
              ? 'bg-white text-[#175CD3] shadow-sm shadow-[#175CD3]/10 font-bold border border-white'
              : 'text-[#53657E] hover:text-[#153B75] hover:bg-white/40'
          }`}
        >
          Command Center
        </button>

        <button
          onClick={() => onSelectTab('marketplace')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
            currentTab === 'marketplace'
              ? 'bg-white text-[#175CD3] shadow-sm shadow-[#175CD3]/10 font-bold border border-white'
              : 'text-[#53657E] hover:text-[#153B75] hover:bg-white/40'
          }`}
        >
          Agent Marketplace
        </button>

        <button
          onClick={() => onSelectTab('runs')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            currentTab === 'runs'
              ? 'bg-white text-[#175CD3] shadow-sm shadow-[#175CD3]/10 font-bold border border-white'
              : 'text-[#53657E] hover:text-[#153B75] hover:bg-white/40'
          }`}
        >
          <span>Workflow Runs</span>
          {activeRunsCount > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#EFF8FF] text-[#175CD3] font-bold border border-[#B2DDFF]">
              {activeRunsCount}
            </span>
          )}
          {pendingApprovalsCount > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#FEF3EB] text-[#F07828] font-bold border border-[#FCD8BE] animate-pulse">
              !
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('trust')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
            currentTab === 'trust'
              ? 'bg-white text-[#175CD3] shadow-sm shadow-[#175CD3]/10 font-bold border border-white'
              : 'text-[#53657E] hover:text-[#153B75] hover:bg-white/40'
          }`}
        >
          Trust & Guardrails
        </button>

        <button
          onClick={() => onSelectTab('logs')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
            currentTab === 'logs'
              ? 'bg-white text-[#175CD3] shadow-sm shadow-[#175CD3]/10 font-bold border border-white'
              : 'text-[#53657E] hover:text-[#153B75] hover:bg-white/40'
          }`}
        >
          Execution Logs
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenCsvModal}
          className="gradient-cta inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all whitespace-nowrap shrink-0 cursor-pointer"
          title="Upload or analyze CSV dataset"
        >
          <FileSpreadsheet size={14} className="text-white" />
          <span>Analyze CSV</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-[#53657E] hover:text-[#153B75] hover:bg-white/80 rounded-xl border border-transparent hover:border-white shadow-xs transition-all shrink-0 cursor-pointer"
          title="Platform settings & voice engine"
          aria-label="Platform settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
