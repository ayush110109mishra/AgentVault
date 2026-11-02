import React, { useState } from 'react';
import { ExecutionEvent } from '../../domain/types';
import { StatusBadge } from '../common/StatusBadge';
import { Search, Download, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

interface ExecutionLogsViewProps {
  events: ExecutionEvent[];
  onClearLogs?: () => void;
  onExportLogs?: () => void;
}

export const ExecutionLogsView: React.FC<ExecutionLogsViewProps> = ({
  events,
  onClearLogs,
  onExportLogs
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const eventTypes = [
    'all',
    'plan_created',
    'approval_requested',
    'approval_granted',
    'approval_rejected',
    'step_started',
    'step_completed',
    'step_failed',
    'step_retried',
    'run_paused',
    'run_resumed',
    'run_cancelled',
    'validation_completed'
  ];

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.runId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.agentName && e.agentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.stepId && e.stepId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedEventType === 'all' || e.eventType === selectedEventType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-[#153B75] dark:text-[#F8FAFC]">
            Execution Audit Logs
          </h2>
          <p className="text-xs text-[#53657E] dark:text-[#94A3B8] mt-0.5">
            Tamper-evident chronological log of state transitions, agent calls, and verification audits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && onExportLogs && (
            <button
              onClick={onExportLogs}
              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer text-[#153B75] dark:text-[#F8FAFC]"
            >
              <Download size={13} className="text-[#175CD3] dark:text-[#3B82F6]" />
              <span>Export Log JSON</span>
            </button>
          )}
          {events.length > 0 && onClearLogs && (
            <button
              onClick={onClearLogs}
              className="px-3 py-1.5 text-xs font-medium text-[#DC2626] dark:text-[#F87171] hover:text-[#B91C1C] dark:hover:text-[#EF4444] bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/40 border border-[#FECACA] dark:border-[#DC2626]/30 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="surface-panel p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8092A8] dark:text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events by run ID, message, or agent..."
            className="surface-input w-full rounded-md pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#1E293B] text-[#153B75] dark:text-[#F8FAFC] placeholder-[#8092A8] dark:placeholder-[#64748B]"
          />
        </div>

        <select
          value={selectedEventType}
          onChange={e => setSelectedEventType(e.target.value)}
          className="surface-input rounded-md px-3 py-1.5 text-xs text-[#153B75] dark:text-[#F8FAFC] bg-white dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#1E293B] font-mono"
        >
          {eventTypes.map(t => (
            <option key={t} value={t}>
              {t === 'all' ? 'All Event Types' : t}
            </option>
          ))}
        </select>
      </div>

      {/* Log Feed Table / List */}
      <div className="surface-panel rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs">
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#0B1120] border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between text-[11px] font-mono text-[#53657E] dark:text-[#64748B]">
          <span>{filteredEvents.length} Events Logged</span>
          <span>Log Engine: Local Auditable Ring Buffer</span>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
            {filteredEvents.map(event => {
              const isExpanded = expandedEventId === event.id;

              return (
                <div
                  key={event.id}
                  className="p-3 hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors cursor-pointer text-xs"
                  onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button className="text-[#8092A8] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] shrink-0">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      {/* Timestamp */}
                      <span className="font-mono text-[11px] text-[#8092A8] dark:text-[#64748B] tabular-nums shrink-0">
                        {new Date(event.timestamp).toLocaleTimeString()}.{String(event.timestamp % 1000).padStart(3, '0')}
                      </span>

                      {/* Event Type Badge */}
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF] dark:bg-[#090D16] dark:border-[#1E293B] dark:text-[#3B82F6] shrink-0 font-medium">
                        {event.eventType}
                      </span>

                      {/* Message */}
                      <span className="text-[#153B75] dark:text-[#F8FAFC] truncate font-medium">
                        {event.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pl-6 sm:pl-0">
                      {event.agentName && (
                        <span className="text-[11px] font-mono text-[#53657E] dark:text-[#94A3B8]">
                          {event.agentName}
                        </span>
                      )}
                      <StatusBadge status={event.status} size="sm" />
                    </div>
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-3 ml-6 p-3 rounded bg-[#F8FAFC] dark:bg-[#070B13] border border-[#E2E8F0] dark:border-[#1E293B] font-mono text-[11px] text-[#153B75] dark:text-[#94A3B8] overflow-x-auto space-y-2">
                      <div className="flex items-center justify-between text-[#8092A8] dark:text-[#64748B] text-[10px] pb-1 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                        <span>Event ID: {event.id}</span>
                        <span>Run ID: {event.runId}</span>
                        {event.durationMs && <span>Duration: {event.durationMs}ms</span>}
                      </div>

                      <pre className="whitespace-pre-wrap leading-relaxed text-[#153B75] dark:text-[#94A3B8]">
                        {JSON.stringify(
                          {
                            eventType: event.eventType,
                            message: event.message,
                            runId: event.runId,
                            stepId: event.stepId,
                            agentId: event.agentId,
                            agentName: event.agentName,
                            details: event.details,
                            error: event.error
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-[#8092A8] dark:text-[#64748B]">
            No execution events match your criteria.
          </div>
        )}
      </div>
    </div>
  );
};
