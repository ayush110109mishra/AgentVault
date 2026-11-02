import React, { useState } from 'react';
import { REGISTERED_AGENTS } from '../../domain/agent-registry';
import { Agent } from '../../domain/types';
import { RiskBadge } from '../common/RiskBadge';
import { Search, Shield, Wrench, ArrowRight, X, Bot } from 'lucide-react';

interface AgentMarketplaceProps {
  onSelectAgentForTask: (agent: Agent, suggestedGoal?: string) => void;
}

export const AgentMarketplace: React.FC<AgentMarketplaceProps> = ({ onSelectAgentForTask }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapability, setSelectedCapability] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<Agent | null>(null);

  const allCapabilities = [
    'All',
    'Source analysis',
    'CSV & JSON analysis',
    'Schema validation',
    'Executive summarization',
    'Static syntax inspection',
    'OWASP Top 10 auditing'
  ];

  const filteredAgents = REGISTERED_AGENTS.filter(agent => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCapability =
      selectedCapability === 'All' ||
      agent.capabilities.some(c => c.toLowerCase().includes(selectedCapability.toLowerCase()));

    const matchesRisk =
      selectedRisk === 'All' || agent.riskProfile.toLowerCase() === selectedRisk.toLowerCase();

    return matchesSearch && matchesCapability && matchesRisk;
  });

  return (
    <div className="space-y-5">
      {/* Title & Posture Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-[#153B75] dark:text-[#F8FAFC]">
            Agent Catalog & Sandbox Policies
          </h2>
          <p className="text-xs text-[#53657E] dark:text-[#94A3B8] mt-0.5">
            Locally registered specialized agent roles with immutable tool permission contracts.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-[#53657E] dark:text-[#94A3B8]">
            {REGISTERED_AGENTS.length} Roles Active
          </span>
          <span className="px-2.5 py-1 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] dark:bg-[#064E3B]/25 dark:border-[#059669]/40 dark:text-[#34D399]">
            Default-Deny Enforced
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="surface-panel p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8092A8] dark:text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search agents by role, name, or keywords..."
            className="surface-input w-full rounded-md pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#1E293B] text-[#153B75] dark:text-[#F8FAFC] placeholder-[#8092A8] dark:placeholder-[#64748B]"
          />
        </div>

        {/* Capability Segmented Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {allCapabilities.map(cap => (
            <button
              key={cap}
              onClick={() => setSelectedCapability(cap)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCapability === cap
                  ? 'bg-[#EAF1FB] text-[#175CD3] font-bold border border-[#D0E2FF] dark:bg-[#1E293B] dark:text-[#F8FAFC] dark:border-[#334155]'
                  : 'text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33]'
              }`}
            >
              {cap}
            </button>
          ))}
        </div>

        {/* Risk Filter */}
        <select
          value={selectedRisk}
          onChange={e => setSelectedRisk(e.target.value)}
          className="surface-input rounded-md px-3 py-1.5 text-xs text-[#153B75] dark:text-[#F8FAFC] bg-white dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#1E293B] font-medium"
        >
          <option value="All">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
      </div>

      {/* Agent Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map(agent => (
          <div
            key={agent.id}
            className="surface-card border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs rounded-xl p-4.5 flex flex-col justify-between space-y-4 hover:border-[#175CD3] dark:hover:border-[#334155] transition-colors"
          >
            {/* Top Row: Role, Icon & Risk */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#175CD3] dark:bg-[#090D16] border border-[#B2DDFF] dark:border-[#1E293B] dark:text-[#3B82F6] flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#153B75] dark:text-[#F8FAFC]">{agent.name}</h3>
                    <span className="text-[11px] font-mono text-[#8092A8] dark:text-[#64748B]">role: {agent.role}</span>
                  </div>
                </div>
                <RiskBadge risk={agent.riskProfile} showIcon={false} />
              </div>

              <p className="text-xs text-[#53657E] dark:text-[#94A3B8] leading-relaxed line-clamp-2">
                {agent.description}
              </p>

              {/* Capabilities */}
              <div className="mt-3 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B] block">
                  Declared Capabilities
                </span>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono text-[#53657E] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#090D16] border border-[#E2E8F0] dark:border-[#1E293B] px-2 py-0.5 rounded"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tool Permissions */}
              <div className="mt-3 pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B] block">
                  Configured Sandbox Tools
                </span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {agent.availableTools.map((tool, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[#153B75] dark:text-[#F8FAFC] bg-[#F0F4FA] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-transparent px-1.5 py-0.5 rounded text-[10px] font-mono"
                    >
                      <Wrench size={10} className="text-[#175CD3] dark:text-[#3B82F6]" />
                      <span>{tool.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
              <button
                onClick={() => setSelectedAgentDetail(agent)}
                className="text-xs text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Inspect Contract
              </button>

              <button
                onClick={() => onSelectAgentForTask(agent)}
                className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer text-[#153B75] dark:text-[#F8FAFC] hover:border-[#175CD3] dark:hover:border-[#3B82F6]"
              >
                <span>Orchestrate</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Contract Detail Modal */}
      {selectedAgentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface-panel rounded-xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0B0F19] text-[#153B75] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <Bot size={18} className="text-[#175CD3] dark:text-[#3B82F6]" />
                <div>
                  <h3 className="text-sm font-bold text-[#153B75] dark:text-[#F8FAFC]">{selectedAgentDetail.name}</h3>
                  <span className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B]">Contract ID: {selectedAgentDetail.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgentDetail(null)}
                className="text-[#53657E] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] p-1 rounded cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8092A8] dark:text-[#64748B] block mb-1">
                  System Directive & Contract
                </span>
                <p className="p-3 rounded bg-[#F8FAFC] dark:bg-[#090D16] border border-[#E2E8F0] dark:border-[#1E293B] text-[#53657E] dark:text-[#94A3B8] font-mono text-[11px] leading-relaxed">
                  {selectedAgentDetail.systemInstruction}
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8092A8] dark:text-[#64748B] block mb-1">
                  Expected Output Contract
                </span>
                <p className="p-3 rounded bg-[#F8FAFC] dark:bg-[#090D16] border border-[#E2E8F0] dark:border-[#1E293B] text-[#53657E] dark:text-[#94A3B8] font-mono text-[11px] leading-relaxed">
                  {selectedAgentDetail.expectedOutput}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded bg-[#F8FAFC] dark:bg-[#090D16] border border-[#E2E8F0] dark:border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-[#059669] dark:text-[#10B981]" />
                  <span className="text-[#153B75] dark:text-[#F8FAFC] font-medium">Side-effect Boundary:</span>
                </div>
                <span className="font-mono text-[#53657E] dark:text-[#94A3B8]">
                  {selectedAgentDetail.permissions.performExternalSideEffects
                    ? 'Requires explicit approval gate'
                    : 'Pure computation (zero mutations)'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
              <button
                onClick={() => setSelectedAgentDetail(null)}
                className="btn-secondary px-3 py-1.5 text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const a = selectedAgentDetail;
                  setSelectedAgentDetail(null);
                  onSelectAgentForTask(a);
                }}
                className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Orchestrate {selectedAgentDetail.name}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
