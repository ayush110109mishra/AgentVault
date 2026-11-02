import React, { useState } from 'react';
import { WorkflowStep } from '../../domain/types';
import { getAgentById } from '../../domain/agent-registry';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { ArrowRight, RotateCcw, Clock, GitBranch } from 'lucide-react';

interface WorkflowVisualizerProps {
  steps: WorkflowStep[];
  onRetryStep?: (stepId: string) => void;
  isExecuting?: boolean;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  steps,
  onRetryStep,
  isExecuting
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const selectedStep = steps.find(s => s.id === selectedStepId);
  const selectedAgent = selectedStep ? getAgentById(selectedStep.agentId) : null;
  const completedCount = steps.filter(s => s.status === 'completed').length;

  return (
    <div className="surface-panel rounded-xl p-5 space-y-4 border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-[#175CD3] dark:text-[#3B82F6]" />
          <div>
            <h3 className="font-display text-xs font-bold text-[#153B75] dark:text-[#F8FAFC] uppercase tracking-wider">
              Execution Pipeline Topology
            </h3>
            <p className="text-[11px] text-[#53657E] dark:text-[#94A3B8]">Sequential capability-routed agent dependencies</p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-[#53657E] dark:text-[#94A3B8]">
          <span className="text-[#175CD3] dark:text-[#3B82F6] font-bold">{completedCount}</span> / {steps.length} Steps Completed
        </div>
      </div>

      {/* Nodes Strip */}
      <div className="flex flex-col lg:flex-row items-stretch gap-2.5 overflow-x-auto pb-1 pt-1">
        {steps.map((step, idx) => {
          const agent = getAgentById(step.agentId);
          const isSelected = selectedStepId === step.id;
          const isRunning = step.status === 'running';
          const isFailed = step.status === 'failed';
          const isCompleted = step.status === 'completed';

          let borderClass = 'border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A]';
          if (isRunning) borderClass = 'border-[#175CD3] dark:border-[#3B82F6] bg-[#EFF8FF] dark:bg-[#0F1E38] ring-1 ring-[#175CD3] dark:ring-[#3B82F6]';
          else if (isCompleted) borderClass = 'border-[#A7F3D0] dark:border-[#059669]/50 bg-[#ECFDF5] dark:bg-[#0A1A17]';
          else if (isFailed) borderClass = 'border-[#FECACA] dark:border-[#DC2626]/60 bg-[#FEF2F2] dark:bg-[#1F0D0D]';
          else if (step.status === 'waiting_for_approval') borderClass = 'border-[#FCD8BE] dark:border-[#D97706]/60 bg-[#FEF3EB] dark:bg-[#1C1307]';

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => setSelectedStepId(isSelected ? null : step.id)}
                className={`flex-1 min-w-[240px] p-3.5 rounded-lg border transition-all cursor-pointer relative group ${borderClass} ${
                  isSelected ? 'ring-1 ring-[#175CD3] dark:ring-[#3B82F6]' : 'hover:border-[#CBD5E1] dark:hover:border-[#334155]'
                }`}
              >
                {/* Top Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#8092A8] dark:text-[#64748B]">0{idx + 1}</span>
                    <span className="text-xs font-semibold text-[#175CD3] dark:text-[#3B82F6] truncate max-w-[120px]">
                      {agent?.name || step.agentId}
                    </span>
                  </div>
                  <StatusBadge status={step.status} size="sm" />
                </div>

                {/* Title */}
                <h4 className="text-xs font-semibold text-[#153B75] dark:text-[#F8FAFC] line-clamp-1 group-hover:text-[#175CD3] dark:group-hover:text-[#3B82F6] transition-colors">
                  {step.title}
                </h4>
                <p className="text-[11px] text-[#53657E] dark:text-[#94A3B8] line-clamp-2 mt-0.5 leading-relaxed">
                  {step.description}
                </p>

                {/* Bottom Row */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B] text-[11px]">
                  <RiskBadge risk={step.risk} showIcon={false} />

                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#53657E] dark:text-[#94A3B8] tabular-nums">
                    {step.durationMs ? (
                      <span className="flex items-center gap-1 text-[#175CD3] dark:text-[#3B82F6] font-semibold">
                        <Clock size={10} />
                        {(step.durationMs / 1000).toFixed(2)}s
                      </span>
                    ) : (
                      <span>{step.dependsOn.length > 0 ? `Deps: ${step.dependsOn.join(', ')}` : 'Entry Node'}</span>
                    )}
                  </div>
                </div>

                {/* Retry Button if Failed */}
                {isFailed && onRetryStep && !isExecuting && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetryStep(step.id);
                    }}
                    className="mt-2.5 w-full py-1 text-xs font-medium text-[#DC2626] dark:text-[#F87171] bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/50 border border-[#FECACA] dark:border-[#DC2626]/40 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Retry Step</span>
                  </button>
                )}
              </div>

              {/* Connecting arrow */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center text-[#CBD5E1] dark:text-[#334155] px-0.5 shrink-0">
                  <ArrowRight size={14} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Selected Step Drawer / Inspection */}
      {selectedStep && (
        <div className="p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] text-xs space-y-3 mt-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#8092A8] dark:text-[#64748B]">Inspecting Node:</span>
              <strong className="text-[#153B75] dark:text-[#F8FAFC]">{selectedStep.title}</strong>
              <span className="text-[#175CD3] dark:text-[#3B82F6]">({selectedAgent?.name})</span>
            </div>
            <button
              onClick={() => setSelectedStepId(null)}
              className="text-[#53657E] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#53657E] dark:text-[#94A3B8]">
            <div>
              <span className="font-mono text-[#8092A8] dark:text-[#64748B] block mb-1">Expected Input:</span>
              <pre className="p-2.5 rounded bg-white dark:bg-[#070B13] border border-[#E2E8F0] dark:border-[#1E293B] font-mono text-[#153B75] dark:text-[#94A3B8] whitespace-pre-wrap">
                {typeof selectedStep.input === 'object'
                  ? JSON.stringify(selectedStep.input, null, 2)
                  : String(selectedStep.input || 'Inherits pipeline context')}
              </pre>
            </div>
            <div>
              <span className="font-mono text-[#8092A8] dark:text-[#64748B] block mb-1">Produced Deliverable:</span>
              <pre className="p-2.5 rounded bg-white dark:bg-[#070B13] border border-[#E2E8F0] dark:border-[#1E293B] font-mono text-[#153B75] dark:text-[#94A3B8] whitespace-pre-wrap max-h-36 overflow-y-auto">
                {selectedStep.output
                  ? (typeof selectedStep.output === 'object'
                    ? JSON.stringify(selectedStep.output, null, 2)
                    : String(selectedStep.output))
                  : 'Pending step execution'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
