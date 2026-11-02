import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
      {toasts.map(toast => {
        let borderClass = 'border-[#1E293B] bg-[#0F172A] text-[#F1F5F9] shadow-xl';
        let Icon = Info;
        let iconColor = 'text-[#3B82F6]';

        if (toast.type === 'success') {
          borderClass = 'border-[#059669]/50 bg-[#064E3B]/20 text-[#F1F5F9] shadow-xl';
          Icon = CheckCircle2;
          iconColor = 'text-[#10B981]';
        } else if (toast.type === 'warning') {
          borderClass = 'border-[#D97706]/50 bg-[#78350F]/20 text-[#F1F5F9] shadow-xl';
          Icon = AlertTriangle;
          iconColor = 'text-[#F59E0B]';
        } else if (toast.type === 'error') {
          borderClass = 'border-[#DC2626]/50 bg-[#7F1D1D]/20 text-[#F1F5F9] shadow-xl';
          Icon = XCircle;
          iconColor = 'text-[#EF4444]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border backdrop-blur-md transition-all ${borderClass}`}
          >
            <Icon size={16} className={`shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight text-[#F8FAFC]">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#64748B] hover:text-[#F8FAFC] p-0.5 rounded transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
