import React from 'react';
import { WorkflowPlan } from '../../domain/types';
import { PolicyEvaluation } from '../../domain/policies';
import { getAgentById } from '../../domain/agent-registry';
import { RiskBadge } from '../common/RiskBadge';
import { ShieldAlert, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

interface ApprovalModalProps {
  plan: WorkflowPlan;
  policy: PolicyEvaluation;
  onApprove: () => void;
  onReject: () => void;
  onEditPlan?: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  plan,
  policy,
  onApprove,
  onReject
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="surface-panel rounded-xl max-w-xl w-full p-5 text-[#153B75] dark:text-[#F1F5F9] bg-white dark:bg-[#0B0F19] border border-[#FCD8BE] dark:border-[#D97706]/40 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="p-2 rounded-lg bg-[#FEF3EB] dark:bg-[#78350F]/30 border border-[#FCD8BE] dark:border-[#D97706]/40 text-[#D97706] dark:text-[#F59E0B] shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#153B75] dark:text-[#F8FAFC]">Human Approval Gate</h3>
              <RiskBadge risk={policy.computedRisk} />
            </div>
            <p className="text-xs text-[#53657E] dark:text-[#94A3B8] mt-0.5">
              Deterministic security policy requires explicit human confirmation prior to executing this multi-agent workflow.
            </p>
          </div>
        </div>

        {/* Task Objective */}
        <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B] block mb-1">
            Task Objective
          </span>
          <p className="text-xs font-semibold text-[#153B75] dark:text-[#F8FAFC]">"{plan.goal}"</p>
        </div>

        {/* Policy Triggers */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#53657E] dark:text-[#64748B] block">
            Approval Triggers & Safety Rules
          </span>
          <div className="p-3 rounded-lg bg-[#FEF3EB] dark:bg-[#78350F]/20 border border-[#FCD8BE] dark:border-[#D97706]/30 space-y-1 text-xs text-[#D97706] dark:text-[#FBBF24]">
            {policy.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle size={13} className="shrink-0 mt-0.5 text-[#F07828] dark:text-[#F59E0B]" />
                <span className="text-[11px] font-medium">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sequence Preview */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#53657E] dark:text-[#64748B] block">
            Proposed Agent Sequence ({plan.steps.length} stages)
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {plan.steps.map((step, idx) => {
              const agent = getAgentById(step.agentId);
              return (
                <div
                  key={step.id}
                  className="p-2.5 rounded-md bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[#8092A8] dark:text-[#64748B] text-[10px]">0{idx + 1}</span>
                    <strong className="text-[#175CD3] dark:text-[#3B82F6] truncate">{agent?.name || step.agentId}</strong>
                    <span className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                    <span className="text-[#53657E] dark:text-[#94A3B8] truncate">{step.title}</span>
                  </div>
                  <RiskBadge risk={step.risk} showIcon={false} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Side-effect statement */}
        <div className="p-2.5 rounded-md bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between text-[11px] text-[#53657E] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#059669] dark:text-[#10B981]" />
            <span>Sandbox status: <strong className="text-[#153B75] dark:text-[#F8FAFC]">Local containment active</strong></span>
          </div>
          <span className="font-mono text-[#8092A8] dark:text-[#64748B]">Default-deny</span>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
          <button
            onClick={onReject}
            className="px-3.5 py-1.5 text-xs text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] cursor-pointer"
          >
            Reject Plan
          </button>
          <button
            onClick={onApprove}
            className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={13} />
            <span>Approve & Execute Pipeline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
