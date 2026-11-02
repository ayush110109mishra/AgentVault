import React from 'react';
import { RiskLevel } from '../../domain/types';
import { ShieldCheck, ShieldAlert, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  risk: RiskLevel;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, showIcon = true }) => {
  if (risk === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium font-mono text-[#DC2626] dark:text-[#F87171] bg-[#FEF2F2] dark:bg-[#7F1D1D]/25 border border-[#FECACA] dark:border-[#DC2626]/40 px-2 py-0.5 rounded-md">
        {showIcon && <AlertOctagon size={12} className="text-[#DC2626] dark:text-[#EF4444]" />}
        <span>High Risk</span>
      </span>
    );
  }

  if (risk === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium font-mono text-[#D97706] dark:text-[#FBBF24] bg-[#FEF3EB] dark:bg-[#78350F]/25 border border-[#FCD8BE] dark:border-[#D97706]/40 px-2 py-0.5 rounded-md">
        {showIcon && <ShieldAlert size={12} className="text-[#D97706] dark:text-[#F59E0B]" />}
        <span>Medium Risk</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium font-mono text-[#059669] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/25 border border-[#A7F3D0] dark:border-[#059669]/40 px-2 py-0.5 rounded-md">
      {showIcon && <ShieldCheck size={12} className="text-[#059669] dark:text-[#10B981]" />}
      <span>Low Risk</span>
    </span>
  );
};
