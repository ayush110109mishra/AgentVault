import React, { useState } from 'react';
import { analyzeCsvData, SAMPLE_CSV_DATA } from '../../features/data-analysis/csv-analyzer';
import { CsvAnalysisResult } from '../../domain/types';
import { FileSpreadsheet, Upload, Download, Play, AlertTriangle, X } from 'lucide-react';

interface CsvAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferToPlanner: (prompt: string, analysisSummary: string) => void;
}

export const CsvAnalysisModal: React.FC<CsvAnalysisModalProps> = ({
  isOpen,
  onClose,
  onTransferToPlanner
}) => {
  const [analysisResult, setAnalysisResult] = useState<CsvAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a valid .csv file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = analyzeCsvData(file.name, text);
        setAnalysisResult(result);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading file from disk.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = analyzeCsvData('q3_enterprise_saas_metrics.csv', SAMPLE_CSV_DATA);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to process sample CSV.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysisResult) return;
    const blob = new Blob([analysisResult.generatedSummaryMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_report_${analysisResult.fileName.replace('.csv', '')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunAgentWorkflow = () => {
    if (!analysisResult) return;
    const prompt = `Synthesize multi-agent executive briefing on CSV dataset "${analysisResult.fileName}" with ${analysisResult.rowCount} records and verify anomalies across marketing/financial KPIs.`;
    onTransferToPlanner(prompt, analysisResult.generatedSummaryMarkdown);
    onClose();
  };

  const numericColumns = analysisResult?.columns.filter(c => c.type === 'numeric') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="surface-panel rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col text-[#153B75] dark:text-[#F1F5F9] bg-white dark:bg-[#0B0F19] overflow-hidden border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between bg-[#F8FAFC] dark:bg-[#0B1120]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#EFF8FF] text-[#175CD3] dark:bg-[#131E33] dark:text-[#F97316] border border-[#B2DDFF] dark:border-[#1E293B]">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#153B75] dark:text-[#F8FAFC]">CSV Analysis Studio</h3>
              <p className="text-[11px] text-[#53657E] dark:text-[#94A3B8]">
                In-browser deterministic parsing, anomaly detection & multi-agent synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#53657E] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] p-1 rounded hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Upload and Sample Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col items-center justify-center p-5 rounded-lg border-2 border-dashed border-[#CBD5E1] dark:border-[#1E293B] hover:border-[#175CD3] dark:hover:border-[#3B82F6] bg-[#F8FAFC] dark:bg-[#0B1120] hover:bg-white dark:hover:bg-[#0F172A] cursor-pointer transition-colors text-center group">
              <Upload size={20} className="text-[#8092A8] dark:text-[#64748B] group-hover:text-[#175CD3] dark:group-hover:text-[#3B82F6] mb-1.5 transition-colors" />
              <span className="font-semibold text-[#153B75] dark:text-[#F8FAFC]">Upload CSV Document</span>
              <span className="text-[11px] text-[#53657E] dark:text-[#64748B] mt-0.5">Drag and drop or click to browse (up to 5MB)</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="p-5 rounded-lg surface-card border border-[#E2E8F0] dark:border-[#1E293B] flex flex-col justify-between">
              <div>
                <span className="font-semibold text-[#153B75] dark:text-[#F8FAFC] block mb-1">Pre-loaded Enterprise Dataset</span>
                <p className="text-[11px] text-[#53657E] dark:text-[#94A3B8] leading-relaxed">
                  Test with sample sales, conversion, churn, and revenue data across enterprise segments.
                </p>
              </div>
              <button
                onClick={handleLoadSample}
                disabled={isProcessing}
                className="mt-3 btn-secondary px-3.5 py-1.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer text-[#153B75] dark:text-[#F8FAFC]"
              >
                <FileSpreadsheet size={13} className="text-[#F07828] dark:text-[#F97316]" />
                <span>Load Sample SaaS CSV</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FECACA] dark:border-[#DC2626]/40 text-xs text-[#DC2626] dark:text-[#F87171] flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 text-[#DC2626] dark:text-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          {isProcessing && (
            <div className="py-12 text-center text-xs text-[#53657E] dark:text-[#94A3B8] space-y-2">
              <div className="w-5 h-5 mx-auto border-2 border-[#CBD5E1] dark:border-[#1E293B] border-t-[#175CD3] dark:border-t-[#3B82F6] rounded-full animate-spin" />
              <p>Parsing tabular records and calculating statistical distribution...</p>
            </div>
          )}

          {/* Results Display */}
          {analysisResult && !isProcessing && (
            <div className="space-y-4 pt-2">
              {/* Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="surface-card border border-[#E2E8F0] dark:border-[#1E293B] rounded-md p-3">
                  <span className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B] block">Total Rows</span>
                  <span className="font-display text-lg font-bold text-[#153B75] dark:text-[#F8FAFC] tabular-nums mt-0.5">
                    {analysisResult.rowCount}
                  </span>
                </div>
                <div className="surface-card border border-[#E2E8F0] dark:border-[#1E293B] rounded-md p-3">
                  <span className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B] block">Total Columns</span>
                  <span className="font-display text-lg font-bold text-[#153B75] dark:text-[#F8FAFC] tabular-nums mt-0.5">
                    {analysisResult.columnCount}
                  </span>
                </div>
                <div className="surface-card border border-[#E2E8F0] dark:border-[#1E293B] rounded-md p-3">
                  <span className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B] block">Numeric Attributes</span>
                  <span className="font-display text-lg font-bold text-[#175CD3] dark:text-[#3B82F6] tabular-nums mt-0.5">
                    {numericColumns.length}
                  </span>
                </div>
                <div className="surface-card border border-[#E2E8F0] dark:border-[#1E293B] rounded-md p-3">
                  <span className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B] block">Anomalies Detected</span>
                  <span className="font-display text-lg font-bold text-[#D97706] dark:text-[#F59E0B] tabular-nums mt-0.5">
                    {analysisResult.anomalies.length}
                  </span>
                </div>
              </div>

              {/* Discovered Columns Table */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#53657E] dark:text-[#64748B]">
                  Schema & Statistical Profile ({analysisResult.columns.length} columns)
                </span>
                <div className="overflow-x-auto border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg bg-white dark:bg-[#0B1120]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] dark:bg-[#090D16] text-[#53657E] dark:text-[#64748B] border-b border-[#E2E8F0] dark:border-[#1E293B] font-mono text-[11px]">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Column Name</th>
                        <th className="py-2 px-3 font-semibold">Type</th>
                        <th className="py-2 px-3 font-semibold text-right">Unique</th>
                        <th className="py-2 px-3 font-semibold text-right">Nulls</th>
                        <th className="py-2 px-3 font-semibold text-right">Min / Max</th>
                        <th className="py-2 px-3 font-semibold text-right">Mean</th>
                        <th className="py-2 px-3 font-semibold">Sample Values</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B] font-mono text-[11px]">
                      {analysisResult.columns.map((col, i) => (
                        <tr key={i} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]">
                          <td className="py-2 px-3 font-semibold text-[#153B75] dark:text-[#F8FAFC]">{col.name}</td>
                          <td className="py-2 px-3 text-[#175CD3] dark:text-[#3B82F6]">{col.type}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-[#53657E] dark:text-[#94A3B8]">{col.uniqueCount}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-[#53657E] dark:text-[#94A3B8]">{col.nullCount}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-[#53657E] dark:text-[#94A3B8]">
                            {col.min !== undefined && col.max !== undefined
                              ? `${col.min} / ${col.max}`
                              : '—'}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-[#53657E] dark:text-[#94A3B8]">
                            {col.mean !== undefined ? col.mean.toFixed(2) : '—'}
                          </td>
                          <td className="py-2 px-3 text-[#8092A8] dark:text-[#64748B] max-w-xs truncate">
                            {col.sampleValues.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Anomalies List */}
              {analysisResult.anomalies.length > 0 && (
                <div className="p-3.5 rounded-lg bg-[#FEF3EB] dark:bg-[#78350F]/20 border border-[#FCD8BE] dark:border-[#D97706]/30 text-xs text-[#D97706] dark:text-[#FBBF24] space-y-1.5">
                  <strong className="block text-[#F07828] dark:text-[#F59E0B] font-semibold">Statistical Outliers Flagged:</strong>
                  {analysisResult.anomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px]">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5 text-[#F07828] dark:text-[#F59E0B]" />
                      <span>
                        <strong>{a.column}:</strong> {a.reason} ({a.value})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between bg-[#F8FAFC] dark:bg-[#0B1120]">
          <button
            onClick={onClose}
            className="text-xs text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] cursor-pointer"
          >
            Close
          </button>

          {analysisResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadReport}
                className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer text-[#153B75] dark:text-[#F8FAFC]"
              >
                <Download size={12} className="text-[#175CD3] dark:text-[#3B82F6]" />
                <span>Export Markdown</span>
              </button>

              <button
                onClick={handleRunAgentWorkflow}
                className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Play size={12} fill="currentColor" />
                <span>Transfer to Multi-Agent Planner</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
