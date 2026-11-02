import React from 'react';
import { StepStatus, WorkflowStatus } from '../../domain/types';
import { CheckCircle2, Clock, XCircle, RotateCcw, Pause, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: WorkflowStatus | StepStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const iconSize = isSm ? 12 : 13;
  const paddingClass = isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-[#059669] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#A7F3D0] dark:border-[#059669]/40 rounded-md font-mono tabular-nums ${paddingClass}`}>
          <CheckCircle2 size={iconSize} className="text-[#059669] dark:text-[#10B981]" />
          <span>Completed</span>
        </span>
      );
    case 'running':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-[#175CD3] dark:text-[#60A5FA] bg-[#EFF8FF] dark:bg-[#1E3A8A]/30 border border-[#B2DDFF] dark:border-[#2563EB]/40 rounded-md font-mono tabular-nums ${paddingClass}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#175CD3] dark:bg-[#3B82F6] animate-pulse inline-block" />
          <span>Running</span>
        </span>
      );
    case 'waiting_for_approval':
    case 'awaiting_approval':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-[#D97706] dark:text-[#FBBF24] bg-[#FEF3EB] dark:bg-[#78350F]/30 border border-[#FCD8BE] dark:border-[#D97706]/40 rounded-md font-mono tabular-nums ${paddingClass}`}>
          <ShieldAlert size={iconSize} className="text-[#D97706] dark:text-[#F59E0B]" />
          <span>Action Required</span>
        </span>
      );
    case 'failed':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-[#DC2626] dark:text-[#F87171] bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#FECACA] dark:border-[#DC2626]/40 rounded-md font-mono tabular-nums ${paddingClass}`}>
          <XCircle size={iconSize} className="text-[#DC2626] dark:text-[#EF4444]" />
          <span>Failed</span>
        </span>
      );
    case 'paused':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-[#D97706] dark:text-[#FBBF24] bg-[#FEF3EB] dark:bg-[#78350F]/20 border border-[#FCD8BE] dark:border-[#B45309]/30 rounded-md font-mono tabular-nums ${paddingClass}`}>
          <Pause size={iconSize} className="text-[#D97706] dark:text-[#F59E0B]" />
          <span>Paused</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#1E293B]/60 border border-[#CBD5E1] dark:border-[#334155] rounded-md font-mono tabular-nums ${paddingClass}`}>
          <XCircle size={iconSize} className="text-[#64748B]" />
          <span>Cancelled</span>
        </span>
      );
    case 'skipped':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#1E293B]/60 border border-[#CBD5E1] dark:border-[#334155] rounded-md font-mono tabular-nums ${paddingClass}`}>
          <RotateCcw size={iconSize} className="text-[#64748B]" />
          <span>Skipped</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-md font-mono tabular-nums ${paddingClass}`}>
          <Clock size={iconSize} className="text-[#64748B]" />
          <span>Pending</span>
        </span>
      );
  }
};
