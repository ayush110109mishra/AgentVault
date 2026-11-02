import React, { useState } from 'react';
import { REGISTERED_AGENTS } from '../../domain/agent-registry';
import { evaluateWorkflowPolicy } from '../../domain/policies';
import { RiskBadge } from '../common/RiskBadge';
import { Shield, ShieldCheck, ShieldAlert, Lock, Check, X, AlertTriangle, Play } from 'lucide-react';

export const TrustDashboard: React.FC = () => {
  const [testGoal, setTestGoal] = useState('Send marketing email and delete customer database table');
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testGoal.trim()) return;

    const evaluation = evaluateWorkflowPolicy(
      [{ agentId: 'research-agent' }, { agentId: 'data-analyst', requestedTools: ['External Database Query', 'Email Sender'] }],
      'general',
      testGoal
    );
    setSimulationResult(evaluation);
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <h2 className="font-display text-xl font-bold tracking-tight text-[#153B75] dark:text-[#F8FAFC]">
          Trust, Permissions & Guardrails
        </h2>
        <p className="text-xs text-[#53657E] dark:text-[#94A3B8] mt-0.5">
          Zero-trust agent sandbox boundaries, deterministic risk rules, and audit verification standards.
        </p>
      </div>

      {/* Trust Posture Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface-card rounded-lg p-4 border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
          <div className="flex items-center gap-2 text-[#059669] dark:text-[#10B981] mb-1">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Local Registry</span>
          </div>
          <p className="font-display text-xl font-bold text-[#153B75] dark:text-[#F8FAFC] tabular-nums">
            {REGISTERED_AGENTS.length} Roles
          </p>
          <span className="text-[11px] text-[#53657E] dark:text-[#94A3B8]">Strict schema contracts</span>
        </div>

        <div className="surface-card rounded-lg p-4 border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
          <div className="flex items-center gap-2 text-[#175CD3] dark:text-[#3B82F6] mb-1">
            <Lock size={16} />
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Tool Sandbox</span>
          </div>
          <p className="font-display text-xl font-bold text-[#153B75] dark:text-[#F8FAFC]">
            Default-Deny
          </p>
          <span className="text-[11px] text-[#53657E] dark:text-[#94A3B8]">Unlisted tools denied</span>
        </div>

        <div className="surface-card rounded-lg p-4 border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
          <div className="flex items-center gap-2 text-[#D97706] dark:text-[#F59E0B] mb-1">
            <ShieldAlert size={16} />
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Approval Gates</span>
          </div>
          <p className="font-display text-xl font-bold text-[#153B75] dark:text-[#F8FAFC]">
            Policy Driven
          </p>
          <span className="text-[11px] text-[#53657E] dark:text-[#94A3B8]">Enforced on mutations & PII</span>
        </div>

        <div className="surface-card rounded-lg p-4 border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
          <div className="flex items-center gap-2 text-[#53657E] dark:text-[#94A3B8] mb-1">
            <Shield size={16} />
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Attestation Mode</span>
          </div>
          <p className="font-display text-xl font-bold text-[#153B75] dark:text-[#F8FAFC]">
            Deterministic RBAC
          </p>
          <span className="text-[11px] text-[#53657E] dark:text-[#94A3B8]">No external unverified code</span>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="surface-panel rounded-xl p-5 space-y-4 border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div>
            <h3 className="font-display text-xs font-bold text-[#153B75] dark:text-[#F8FAFC] uppercase tracking-wider">
              Agent Permission Matrix
            </h3>
            <p className="text-[11px] text-[#53657E] dark:text-[#94A3B8]">Declared sandbox access boundaries per specialized role</p>
          </div>
          <span className="text-[11px] font-mono text-[#175CD3] dark:text-[#3B82F6] bg-[#EFF8FF] dark:bg-[#090D16] px-2.5 py-0.5 rounded border border-[#B2DDFF] dark:border-[#1E293B]">
            6 Configured Roles
          </span>
        </div>

        <div className="overflow-x-auto border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg bg-white dark:bg-[#0B1120]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] dark:bg-[#090D16] text-[#53657E] dark:text-[#64748B] border-b border-[#E2E8F0] dark:border-[#1E293B] font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Agent Role</th>
                <th className="py-2.5 px-3.5 font-semibold">Risk Level</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Read Inputs</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Analyze Data</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Generate Text</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Network API</th>
                <th className="py-2.5 px-3.5 font-semibold text-center">Mutation / Write</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
              {REGISTERED_AGENTS.map(agent => {
                const canNetwork = agent.availableTools.some(t => t.name.toLowerCase().includes('http') || t.name.toLowerCase().includes('external') || t.category === 'external');
                const canMutate = agent.permissions.performExternalSideEffects;

                return (
                  <tr key={agent.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors">
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-[#153B75] dark:text-[#F8FAFC]">{agent.name}</div>
                      <div className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B]">{agent.id}</div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <RiskBadge risk={agent.riskProfile} showIcon={false} />
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <Check size={14} className="text-[#059669] dark:text-[#10B981] mx-auto" />
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <Check size={14} className="text-[#059669] dark:text-[#10B981] mx-auto" />
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <Check size={14} className="text-[#059669] dark:text-[#10B981] mx-auto" />
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {canNetwork ? (
                        <Check size={14} className="text-[#059669] dark:text-[#10B981] mx-auto" />
                      ) : (
                        <X size={14} className="text-[#CBD5E1] dark:text-[#64748B] mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {canMutate ? (
                        <span className="text-[10px] font-mono text-[#D97706] dark:text-[#F59E0B] font-semibold">Gated (Approval)</span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#059669] dark:text-[#10B981]">Denied (Zero)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deterministic Policy Simulator */}
      <div className="surface-panel rounded-xl p-5 space-y-4 border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs">
        <div>
          <h3 className="font-display text-xs font-bold text-[#153B75] dark:text-[#F8FAFC] uppercase tracking-wider">
            Deterministic Policy Simulator
          </h3>
          <p className="text-[11px] text-[#53657E] dark:text-[#94A3B8] mt-0.5">
            Test how safety policies classify arbitrary agent requests against risk rules without side-effects.
          </p>
        </div>

        <form onSubmit={handleSimulate} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={testGoal}
            onChange={e => setTestGoal(e.target.value)}
            placeholder="Type a sensitive task to evaluate approval triggers..."
            className="surface-input flex-1 rounded-md px-3.5 py-2 text-xs text-[#153B75] dark:text-[#F8FAFC] bg-white dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#1E293B]"
          />
          <button
            type="submit"
            className="btn-primary px-4 py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Play size={12} fill="currentColor" />
            <span>Simulate Policy Check</span>
          </button>
        </form>

        {simulationResult && (
          <div className="p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#153B75] dark:text-[#F8FAFC]">Simulation Outcome:</span>
              <RiskBadge risk={simulationResult.computedRisk} />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#8092A8] dark:text-[#64748B]">Approval Gate Status:</span>
                <strong className={simulationResult.requiresApproval ? 'text-[#D97706] dark:text-[#F59E0B]' : 'text-[#059669] dark:text-[#10B981]'}>
                  {simulationResult.requiresApproval ? 'HUMAN CONFIRMATION REQUIRED' : 'AUTO-APPROVED'}
                </strong>
              </div>

              {simulationResult.reasons.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="font-mono text-[10px] text-[#8092A8] dark:text-[#64748B] block font-medium">Triggered Safeguards:</span>
                  {simulationResult.reasons.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-[#D97706] dark:text-[#FBBF24] text-[11px]">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5 text-[#F07828] dark:text-[#F59E0B]" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
