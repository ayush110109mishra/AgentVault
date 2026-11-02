import React, { useState } from 'react';
import { WorkflowRun } from '../../domain/types';
import { StatusBadge } from '../common/StatusBadge';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { Download, CheckCircle2, ArrowRight } from 'lucide-react';

interface WorkflowRunsViewProps {
  runs: WorkflowRun[];
  onSelectRun: (runId: string) => void;
  onResumeRun: (runId: string) => void;
  onPauseRun: (runId: string) => void;
  onCancelRun: (runId: string) => void;
  onRetryStep: (runId: string, stepId: string) => void;
  onExportRuns: () => void;
}

export const WorkflowRunsView: React.FC<WorkflowRunsViewProps> = ({
  runs,
  onSelectRun,
  onRetryStep,
  onExportRuns
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(runs[0]?.id || null);

  const filteredRuns = runs.filter(run => {
    if (statusFilter === 'all') return true;
    return run.status === statusFilter;
  });

  const expandedRun = runs.find(r => r.id === expandedRunId);

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-[#153B75] dark:text-[#F8FAFC]">
            Workflow Execution Runs
          </h2>
          <p className="text-xs text-[#53657E] dark:text-[#94A3B8] mt-0.5">
            Auditable execution history, step handoffs, and intermediate telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {runs.length > 0 && (
            <button
              onClick={onExportRuns}
              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer text-[#153B75] dark:text-[#F8FAFC]"
            >
              <Download size={13} className="text-[#175CD3] dark:text-[#3B82F6]" />
              <span>Export Runs JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        {['all', 'running', 'awaiting_approval', 'completed', 'failed', 'paused', 'cancelled'].map(st => {
          const count = runs.filter(r => st === 'all' || r.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap capitalize cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#EAF1FB] text-[#175CD3] font-bold border border-[#D0E2FF] dark:bg-[#1E293B] dark:text-[#F8FAFC] dark:border-[#334155]'
                  : 'text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] hover:bg-[#F8FAFC] dark:hover:bg-[#131E33]'
              }`}
            >
              {st.replace('_', ' ')} <span className="font-mono text-[10px] text-[#8092A8] dark:text-[#64748B]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Content Split: Master-Detail Grid */}
      {filteredRuns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Runs List (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            {filteredRuns.map(run => {
              const isSelected = run.id === expandedRunId;
              const completedCount = run.steps.filter(s => s.status === 'completed').length;

              return (
                <div
                  key={run.id}
                  onClick={() => setExpandedRunId(run.id)}
                  className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#EAF1FB] border-[#175CD3] dark:bg-[#131E33] dark:border-[#3B82F6] shadow-xs'
                      : 'bg-white dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#CBD5E1] dark:hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] text-[#8092A8] dark:text-[#64748B] font-semibold">{run.id}</span>
                    <StatusBadge status={run.status} size="sm" />
                  </div>

                  <h4 className="text-xs font-semibold text-[#153B75] dark:text-[#F8FAFC] line-clamp-1">
                    "{run.goal}"
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-[#53657E] dark:text-[#94A3B8] mt-2.5 pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B] font-mono">
                    <span className="text-[#175CD3] dark:text-[#3B82F6] font-medium">{run.taskType}</span>
                    <span className="tabular-nums">{completedCount}/{run.steps.length} Steps</span>
                    <span className="tabular-nums">{new Date(run.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Run Detail Inspection (7 cols) */}
          <div className="lg:col-span-7">
            {expandedRun ? (
              <div className="surface-panel rounded-xl p-5 space-y-5 border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#8092A8] dark:text-[#64748B]">{expandedRun.id}</span>
                      <StatusBadge status={expandedRun.status} size="sm" />
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#153B75] dark:text-[#F8FAFC]">
                      "{expandedRun.goal}"
                    </h3>
                  </div>

                  <button
                    onClick={() => onSelectRun(expandedRun.id)}
                    className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Open in Command Center</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                {/* Topology */}
                <WorkflowVisualizer
                  steps={expandedRun.steps}
                  onRetryStep={(stepId) => onRetryStep(expandedRun.id, stepId)}
                />

                {/* Final Report Brief if exists */}
                {expandedRun.finalReport && (
                  <div className="p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#059669] dark:text-[#10B981]">
                      <CheckCircle2 size={14} />
                      <span>Synthesized Executive Summary</span>
                    </div>
                    <p className="text-xs text-[#53657E] dark:text-[#94A3B8] leading-relaxed">
                      {expandedRun.finalReport.summary}
                    </p>
                  </div>
                )}

                {/* Step Details list */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B] block font-medium">
                    Execution Step Telemetry ({expandedRun.steps.length} stages)
                  </span>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {expandedRun.steps.map((st, i) => (
                      <div
                        key={st.id}
                        className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-[#8092A8] dark:text-[#64748B]">0{i + 1}</span>
                          <span className="font-semibold text-[#153B75] dark:text-[#F8FAFC] truncate">{st.title}</span>
                          <span className="text-[11px] text-[#175CD3] dark:text-[#3B82F6] font-mono">({st.agentId})</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {st.durationMs && (
                            <span className="font-mono text-[10px] text-[#53657E] dark:text-[#94A3B8] tabular-nums">
                              {(st.durationMs / 1000).toFixed(2)}s
                            </span>
                          )}
                          <StatusBadge status={st.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="surface-panel rounded-xl p-12 text-center text-xs text-[#8092A8] dark:text-[#64748B] border border-[#E2E8F0] dark:border-[#1E293B]">
                Select a run on the left to inspect its pipeline stages.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="surface-panel rounded-xl p-12 text-center text-xs text-[#8092A8] dark:text-[#64748B] border border-[#E2E8F0] dark:border-[#1E293B]">
          <p>No runs matching filter "{statusFilter}".</p>
        </div>
      )}
    </div>
  );
};
