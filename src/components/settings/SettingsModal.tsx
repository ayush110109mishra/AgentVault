import React, { useEffect, useState } from 'react';
import { AppSettings } from '../../domain/types';
import { Settings, Volume2, Database, Download, X, Sun, Moon } from 'lucide-react';

import { ServerHealthResponse } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearAllData: () => void;
  onExportAllData: () => void;
  hasGeminiKey: boolean;
  serverHealth?: ServerHealthResponse | null;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllData,
  onExportAllData,
  hasGeminiKey,
  serverHealth,
  theme = 'dark',
  onToggleTheme
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="surface-panel rounded-xl max-w-lg w-full p-5 text-[#153B75] dark:text-[#F1F5F9] max-h-[90vh] overflow-y-auto border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xl space-y-5 bg-white dark:bg-[#0B0F19]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <Settings size={18} className="text-[#175CD3] dark:text-[#3B82F6]" />
            <h3 className="text-sm font-bold text-[#153B75] dark:text-[#F8FAFC]">Platform Settings & Orchestration Engine</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#53657E] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] p-1 rounded hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Appearance & Interface Theme */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#153B75] dark:text-[#F8FAFC]">
              {theme === 'dark' ? <Moon size={14} className="text-[#3B82F6]" /> : <Sun size={14} className="text-[#F07828]" />}
              <span>Interface Appearance & Theme</span>
            </div>

            <div className="p-3.5 rounded-lg surface-card border border-[#E2E8F0] dark:border-[#1E293B] space-y-2.5">
              <p className="text-[11px] text-[#53657E] dark:text-[#94A3B8]">
                Switch between high-contrast Dark Mode (deep navy & charcoal) and Light Mode with original corporate navy, soft slate, and royal blue accents.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (theme !== 'light' && onToggleTheme) onToggleTheme();
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                    theme === 'light'
                      ? 'bg-[#EAF1FB] border-[#175CD3] text-[#175CD3] font-bold shadow-xs'
                      : 'bg-white dark:bg-[#131E33] border-[#CBD5E1] dark:border-[#1E293B] text-[#53657E] dark:text-[#94A3B8] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Sun size={14} className="text-[#F07828]" />
                  <span>Light Mode (Classic)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (theme !== 'dark' && onToggleTheme) onToggleTheme();
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#1E293B] border-[#3B82F6] text-[#F8FAFC] font-bold shadow-xs'
                      : 'bg-white dark:bg-[#131E33] border-[#CBD5E1] dark:border-[#1E293B] text-[#53657E] dark:text-[#94A3B8] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Moon size={14} className="text-[#3B82F6]" />
                  <span>Dark Mode (Navy)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Model Engine Posture */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#153B75] dark:text-[#F8FAFC] block text-xs">
                  {serverHealth?.isOpenWeight ? 'Open-Weight Model Engine' : 'AI Execution Engine'}
                </span>
                <span className="text-[10px] text-[#53657E] dark:text-[#94A3B8]">
                  Provider: <strong className="font-mono text-[#175CD3] dark:text-[#3B82F6]">{serverHealth?.activeProvider || 'offline-engine'}</strong>
                </span>
              </div>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold border ${
                  serverHealth?.providerStatus === 'connected'
                    ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] dark:bg-[#064E3B]/25 dark:text-[#34D399] dark:border-[#059669]/40'
                    : 'bg-[#FEF3EB] text-[#D97706] border-[#FCD8BE] dark:bg-[#78350F]/25 dark:text-[#FBBF24] dark:border-[#D97706]/40'
                }`}
              >
                {serverHealth?.providerStatus === 'connected' ? 'CONNECTED' : (serverHealth?.providerStatus?.toUpperCase() || 'SAFE FALLBACK')}
              </span>
            </div>

            <div className="text-[#53657E] dark:text-[#94A3B8] leading-relaxed text-[11px] space-y-1">
              <p>
                Active Model: <code className="text-[#175CD3] dark:text-[#3B82F6] font-mono font-semibold">{serverHealth?.model || 'Gemma 2 (gemma2-9b-it)'}</code>
              </p>
              <p>
                License: <span className="font-mono text-[10px] text-[#059669] dark:text-[#10B981]">{serverHealth?.license || 'Gemma Terms of Use / Open-Weight'}</span>
              </p>
              <p className="text-[10px] pt-1 text-[#8092A8] dark:text-[#64748B]">
                Configure via <code className="font-mono">.env</code>: Set <code className="font-mono">OLLAMA_BASE_URL</code> (e.g. <code className="font-mono">http://localhost:11434</code>) for local Gemma 2, or <code className="font-mono">OPEN_WEIGHT_API_URL</code> for hosted open-weight endpoints.
              </p>
            </div>
          </div>

          {/* Voice & Speech Synthesis */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#153B75] dark:text-[#F8FAFC]">
              <Volume2 size={14} className="text-[#175CD3] dark:text-[#3B82F6]" />
              <span>Voice & Spoken Briefings</span>
            </div>

            <div className="space-y-3 p-3.5 rounded-lg surface-card border border-[#E2E8F0] dark:border-[#1E293B]">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#153B75] dark:text-[#F8FAFC] font-medium">Auto-speak final workflow briefings</span>
                <input
                  type="checkbox"
                  checked={settings.autoSpeakResults}
                  onChange={e => onUpdateSettings({ ...settings, autoSpeakResults: e.target.checked })}
                  className="rounded border-[#CBD5E1] dark:border-[#1E293B] bg-white dark:bg-[#090D16] text-[#F07828] dark:text-[#F97316] focus:ring-[#F07828] w-4 h-4 accent-[#F07828]"
                />
              </label>

              {voices.length > 0 && (
                <div>
                  <label className="text-[11px] text-[#53657E] dark:text-[#64748B] block mb-1">Synthesizer Voice</label>
                  <select
                    value={settings.speechVoiceName}
                    onChange={e => onUpdateSettings({ ...settings, speechVoiceName: e.target.value })}
                    className="surface-input w-full rounded-md px-3 py-1.5 text-xs text-[#153B75] dark:text-[#F8FAFC] bg-white dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#1E293B]"
                  >
                    <option value="">Default System Voice</option>
                    {voices.map(v => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <div className="flex justify-between text-[#53657E] dark:text-[#94A3B8] mb-1">
                    <span>Speech Rate</span>
                    <span className="font-mono">{settings.speechRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={settings.speechRate}
                    onChange={e => onUpdateSettings({ ...settings, speechRate: parseFloat(e.target.value) })}
                    className="w-full accent-[#175CD3] dark:accent-[#3B82F6]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#53657E] dark:text-[#94A3B8] mb-1">
                    <span>Speech Pitch</span>
                    <span className="font-mono">{settings.speechPitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={settings.speechPitch}
                    onChange={e => onUpdateSettings({ ...settings, speechPitch: parseFloat(e.target.value) })}
                    className="w-full accent-[#175CD3] dark:accent-[#3B82F6]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Governance & Export */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#153B75] dark:text-[#F8FAFC]">
              <Database size={14} className="text-[#175CD3] dark:text-[#3B82F6]" />
              <span>Local Storage & Audit Logs</span>
            </div>

            <div className="p-3.5 rounded-lg surface-card border border-[#E2E8F0] dark:border-[#1E293B] space-y-3">
              <p className="text-[11px] text-[#53657E] dark:text-[#94A3B8] leading-relaxed">
                Workflow runs, plans, and intermediate deliverables are stored locally in your browser's persistent sandbox.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onExportAllData}
                  className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer text-[#153B75] dark:text-[#F8FAFC]"
                >
                  <Download size={13} className="text-[#175CD3] dark:text-[#3B82F6]" />
                  <span>Export All Data (.json)</span>
                </button>

                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="px-3 py-1.5 text-xs text-[#DC2626] dark:text-[#F87171] hover:text-[#B91C1C] rounded hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors cursor-pointer"
                  >
                    Clear History
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onClearAllData();
                        setConfirmClear(false);
                      }}
                      className="px-2.5 py-1 text-xs bg-[#DC2626] text-white rounded font-medium cursor-pointer"
                    >
                      Confirm Wipe
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1 text-xs text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B] flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-4 py-1.5 text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
