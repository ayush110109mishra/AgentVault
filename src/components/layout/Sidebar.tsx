import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileSpreadsheet,
  Settings,
  Terminal,
  Bot,
  GitBranch,
  ShieldCheck,
  FileText,
  Menu,
  X,
  Zap,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon
} from 'lucide-react';

import { ServerHealthResponse } from '../../services/api';

export type NavTab = 'command' | 'marketplace' | 'runs' | 'trust' | 'logs';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCsvModal: () => void;
  onOpenSettings: () => void;
  activeRunsCount: number;
  pendingApprovalsCount: number;
  hasGeminiKey?: boolean;
  serverHealth?: ServerHealthResponse | null;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | null;
  badgeType?: 'info' | 'warning';
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCsvModal,
  onOpenSettings,
  activeRunsCount,
  pendingApprovalsCount,
  hasGeminiKey = true,
  serverHealth,
  theme = 'dark',
  onToggleTheme
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('agentvault_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agentvault_sidebar_collapsed', String(isCollapsed));
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const navGroups: NavGroup[] = [
    {
      group: 'Workspace',
      items: [
        {
          id: 'command',
          label: 'Command Center',
          icon: Terminal,
          badge: null
        },
        {
          id: 'runs',
          label: 'Workflow Runs',
          icon: GitBranch,
          badge: activeRunsCount > 0 ? `${activeRunsCount} Active` : pendingApprovalsCount > 0 ? 'Action Req.' : null,
          badgeType: activeRunsCount > 0 ? 'info' : 'warning'
        }
      ]
    },
    {
      group: 'Agents',
      items: [
        {
          id: 'marketplace',
          label: 'Agent Catalog',
          icon: Bot,
          badge: '6'
        }
      ]
    },
    {
      group: 'Governance',
      items: [
        {
          id: 'trust',
          label: 'Trust & Guardrails',
          icon: ShieldCheck,
          badge: 'RBAC'
        }
      ]
    },
    {
      group: 'Observability',
      items: [
        {
          id: 'logs',
          label: 'Execution Logs',
          icon: FileText,
          badge: null
        }
      ]
    }
  ];

  const handleSelectTab = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="md:hidden sticky top-0 z-40 h-14 bg-white dark:bg-[#090D16] border-b border-[#E2E8F0] dark:border-[#1E293B] px-4 flex items-center justify-between transition-colors">
        <button
          onClick={() => handleSelectTab('command')}
          className="flex items-center gap-2.5 text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#175CD3] to-[#06B6D4] dark:bg-[#1E293B] dark:from-transparent dark:to-transparent border border-white/60 dark:border-[#334155] flex items-center justify-center text-white dark:text-[#F8FAFC] shadow-xs">
            <Layers size={15} />
          </div>
          <span className="font-display text-sm font-bold text-[#153B75] dark:text-[#F8FAFC] tracking-tight">
            AgentVault <span className="text-[#F07828] dark:text-[#F97316]">X</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-md cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={15} className="text-[#F97316]" /> : <Moon size={15} className="text-[#175CD3]" />}
            </button>
          )}
          <button
            onClick={onOpenCsvModal}
            className="p-1.5 text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-md cursor-pointer"
            title="Analyze CSV"
          >
            <FileSpreadsheet size={15} />
          </button>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-md cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#0B0F19] border-r border-[#E2E8F0] dark:border-[#1E293B] z-50 shadow-2xl transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col justify-between p-4 overflow-y-auto">
          <div className="space-y-5">
            {/* Mobile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#175CD3] to-[#06B6D4] dark:bg-[#131E33] dark:from-transparent dark:to-transparent border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-center text-white dark:text-[#F8FAFC]">
                  <Layers size={15} />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-sm font-bold text-[#153B75] dark:text-[#F8FAFC] tracking-tight">
                    AgentVault <span className="text-[#F07828] dark:text-[#F97316]">X</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#53657E] dark:text-[#64748B]">Default Cluster · prod</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-[#53657E] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] rounded-md hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick CSV Action */}
            <button
              onClick={() => {
                onOpenCsvModal();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-[#153B75] dark:text-[#F8FAFC] bg-[#F0F4FA] dark:bg-[#131E33] hover:bg-[#E2E8F0] dark:hover:bg-[#182642] border border-[#CBD5E1] dark:border-[#1E293B] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={14} className="text-[#F07828] dark:text-[#F97316]" />
                <span>Analyze CSV Data</span>
              </div>
              <ChevronRight size={13} className="text-[#53657E] dark:text-[#64748B]" />
            </button>

            {/* Nav Groups */}
            <div className="space-y-4">
              {navGroups.map(group => (
                <div key={group.group} className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#53657E] dark:text-[#64748B] px-2 block">
                    {group.group}
                  </span>
                  <div className="space-y-0.5">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                            isActive
                              ? 'bg-[#EAF1FB] text-[#175CD3] dark:bg-[#1E293B] dark:text-[#F8FAFC] font-semibold border-l-2 border-[#175CD3] dark:border-[#3B82F6]'
                              : 'text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon size={15} className={isActive ? 'text-[#175CD3] dark:text-[#3B82F6]' : 'text-[#8092A8] dark:text-[#64748B]'} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F1F5F9] dark:bg-[#090D16] border border-[#E2E8F0] dark:border-[#1E293B] text-[#53657E] dark:text-[#94A3B8] rounded">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B] space-y-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Sun size={14} className="text-[#F97316]" /> : <Moon size={14} className="text-[#175CD3]" />}
                  <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                </div>
                <span className="text-[10px] font-mono uppercase">{theme}</span>
              </button>
            )}
            <button
              onClick={() => {
                onOpenSettings();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-[#8092A8] dark:text-[#64748B]" />
                <span>Settings & Engine</span>
              </div>
              <span className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B]">v1.4</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Persistent Left Sidebar */}
      <aside
        className={`hidden md:flex shrink-0 h-screen sticky top-0 bg-white dark:bg-[#0B0F19] border-r border-[#E2E8F0] dark:border-[#1E293B] z-30 flex-col transition-all duration-200 ease-in-out relative ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Border Collapse Toggle Arrow Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-5 z-40 w-6 h-6 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] hover:border-[#175CD3] dark:hover:border-[#3B82F6] rounded-full flex items-center justify-center text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer shadow-sm hover:shadow-md"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={13} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={13} strokeWidth={2.5} />
          )}
        </button>

        <div className={`h-full flex flex-col justify-between ${isCollapsed ? 'p-2.5 items-center' : 'p-3.5'} overflow-y-auto overflow-x-hidden`}>
          {/* Top Section */}
          <div className="space-y-5 w-full">
            {/* Header Brand */}
            <div className={`flex items-center pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              <button
                onClick={() => handleSelectTab('command')}
                className={`flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group ${
                  isCollapsed ? 'justify-center w-full' : ''
                }`}
                title="AgentVault X"
              >
                <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#175CD3] via-[#0E47AB] to-[#06B6D4] dark:bg-[#131E33] dark:from-transparent dark:to-transparent border border-white/60 dark:border-[#1E293B] flex items-center justify-center text-white dark:text-[#F8FAFC] shrink-0 shadow-xs shadow-[#175CD3]/20">
                  <Layers size={15} />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="font-display text-sm font-bold text-[#153B75] dark:text-[#F8FAFC] tracking-tight whitespace-nowrap leading-tight">
                      AgentVault <span className="text-[#F07828] dark:text-[#F97316]">X</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#53657E] dark:text-[#64748B] truncate mt-0.5">
                      Cluster · prod
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Quick CSV Action */}
            {isCollapsed ? (
              <div className="flex justify-center w-full relative group">
                <button
                  onClick={onOpenCsvModal}
                  className="w-9 h-9 rounded-md bg-[#F0F4FA] dark:bg-[#131E33] hover:bg-[#E2E8F0] dark:hover:bg-[#182642] border border-[#CBD5E1] dark:border-[#1E293B] flex items-center justify-center text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
                  title="Analyze CSV Data"
                >
                  <FileSpreadsheet size={15} className="text-[#F07828] dark:text-[#F97316]" />
                </button>
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] text-[#153B75] dark:text-[#F8FAFC] text-[11px] font-medium rounded shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  Analyze CSV Data
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenCsvModal}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-[#153B75] dark:text-[#F8FAFC] bg-[#F0F4FA] dark:bg-[#131E33] hover:bg-[#E2E8F0] dark:hover:bg-[#182642] border border-[#CBD5E1] dark:border-[#1E293B] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileSpreadsheet size={13} className="text-[#F07828] dark:text-[#F97316] shrink-0" />
                  <span className="truncate">Analyze CSV</span>
                </div>
                <ChevronRight size={12} className="text-[#53657E] dark:text-[#64748B] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            )}

            {/* Nav Groups */}
            <div className="space-y-4 w-full">
              {navGroups.map(group => (
                <div key={group.group} className="space-y-1 w-full">
                  {!isCollapsed && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B] px-2 block font-medium">
                      {group.group}
                    </span>
                  )}
                  <div className="space-y-0.5 w-full">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;

                      if (isCollapsed) {
                        return (
                          <div key={item.id} className="relative group flex justify-center w-full">
                            <button
                              onClick={() => handleSelectTab(item.id)}
                              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer relative ${
                                isActive
                                  ? 'bg-[#EAF1FB] text-[#175CD3] dark:bg-[#1E293B] dark:text-[#F8FAFC] border border-[#D0E2FF] dark:border-[#334155] shadow-xs'
                                  : 'text-[#53657E] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33]'
                              }`}
                              aria-label={item.label}
                            >
                              <Icon size={16} className={isActive ? 'text-[#175CD3] dark:text-[#3B82F6]' : ''} />
                              {item.badge && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#F07828] dark:bg-[#F97316]" />
                              )}
                            </button>
                            <div className="absolute left-full ml-2 px-2.5 py-1 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] text-[#153B75] dark:text-[#F8FAFC] text-[11px] font-medium rounded shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center gap-1.5">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="text-[10px] font-mono text-[#F07828] dark:text-[#F97316]">
                                  ({item.badge})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                            isActive
                              ? 'bg-[#EAF1FB] text-[#175CD3] dark:bg-[#1E293B] dark:text-[#F8FAFC] font-bold border-l-2 border-[#175CD3] dark:border-[#3B82F6] shadow-xs'
                              : 'text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon size={14} className={isActive ? 'text-[#175CD3] dark:text-[#3B82F6]' : 'text-[#8092A8] dark:text-[#64748B]'} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                item.badgeType === 'warning'
                                  ? 'bg-[#FEF3EB] text-[#F07828] border-[#FCD8BE] dark:bg-[#78350F]/40 dark:text-[#F59E0B] dark:border-[#B45309]/50'
                                  : 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF] dark:bg-[#090D16] dark:text-[#94A3B8] dark:border-[#1E293B]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className={`pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B] space-y-1.5 w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {/* Theme Toggle Button in Sidebar */}
            {onToggleTheme && (
              isCollapsed ? (
                <div className="relative group">
                  <button
                    onClick={onToggleTheme}
                    className="w-9 h-9 rounded-md flex items-center justify-center text-[#53657E] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33] transition-colors cursor-pointer"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? <Sun size={15} className="text-[#F97316]" /> : <Moon size={15} className="text-[#175CD3]" />}
                  </button>
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] text-[#153B75] dark:text-[#F8FAFC] text-[11px] font-medium rounded shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </div>
                </div>
              ) : (
                <button
                  onClick={onToggleTheme}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun size={14} className="text-[#F97316]" /> : <Moon size={14} className="text-[#175CD3]" />}
                    <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-[#8092A8] dark:text-[#64748B]">{theme}</span>
                </button>
              )
            )}

            {/* Settings Button */}
            {isCollapsed ? (
              <div className="relative group">
                <button
                  onClick={onOpenSettings}
                  className="w-9 h-9 rounded-md flex items-center justify-center text-[#53657E] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33] transition-colors cursor-pointer"
                  aria-label="Settings"
                >
                  <Settings size={15} />
                </button>
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] text-[#153B75] dark:text-[#F8FAFC] text-[11px] font-medium rounded shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  Settings
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-[#8092A8] dark:text-[#64748B]" />
                  <span>Settings</span>
                </div>
                <span className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B]">v1.4</span>
              </button>
            )}

            {!isCollapsed && (
              <div className="px-2.5 py-2 rounded-md bg-[#F8FAFC] dark:bg-[#090D16] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      serverHealth?.providerStatus === 'connected'
                        ? 'bg-[#059669] dark:bg-[#10B981]'
                        : 'bg-[#D97706] dark:bg-[#F59E0B]'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-[#153B75] dark:text-[#F8FAFC] truncate text-[10px] font-semibold">
                      {serverHealth?.model || (hasGeminiKey ? 'Gemini 3.8 Flash' : 'Gemma 2 Guarded Engine')}
                    </span>
                    <span className="text-[9px] text-[#8092A8] dark:text-[#64748B] uppercase tracking-wider font-mono">
                      {serverHealth?.isOpenWeight ? 'Open-Weight AI' : hasGeminiKey ? 'Proprietary' : 'Air-Gapped Safe'}
                    </span>
                  </div>
                </div>
                <Zap size={11} className="text-[#F07828] dark:text-[#F97316] shrink-0" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
