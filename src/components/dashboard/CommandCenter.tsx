import React, { useState, useEffect, useRef } from 'react';
import {
  WorkflowPlan,
  WorkflowStep,
  WorkflowRun,
  ExecutionEvent,
  AppSettings
} from '../../domain/types';
import { REGISTERED_AGENTS, getAgentById } from '../../domain/agent-registry';
import { evaluateWorkflowPolicy, PolicyEvaluation } from '../../domain/policies';
import {
  planWorkflow,
  executeStepApi,
  verifyStepApi,
  synthesizeRunApi
} from '../../services/api';
import { voiceController, interpretVoiceCommand } from '../../services/voice';
import { WorkflowVisualizer } from '../workflows/WorkflowVisualizer';
import { ApprovalModal } from './ApprovalModal';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { ToastMessage } from '../common/Toast';
import {
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Pause,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  Code2,
  Search,
  Shield,
  Layers,
  ArrowRight,
  Clock,
  Copy,
  Check,
  Zap,
  Activity,
  Bot,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface CommandCenterProps {
  onAddEvent: (event: Omit<ExecutionEvent, 'id' | 'timestamp'>) => void;
  onAddOrUpdateRun: (run: WorkflowRun) => void;
  activeRun: WorkflowRun | null;
  onSetActiveRun: (run: WorkflowRun | null) => void;
  settings: AppSettings;
  hasGeminiKey: boolean;
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
  onOpenCsvModal: () => void;
  onNavigateToTab?: (tab: string) => void;
  initialPrompt?: string;
  runs?: WorkflowRun[];
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onAddEvent,
  onAddOrUpdateRun,
  activeRun,
  onSetActiveRun,
  settings,
  hasGeminiKey,
  onShowToast,
  onOpenCsvModal,
  onNavigateToTab,
  initialPrompt = '',
  runs = []
}) => {
  const [goalInput, setGoalInput] = useState(initialPrompt);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);

  // Proposed plan awaiting approval
  const [proposedPlan, setProposedPlan] = useState<WorkflowPlan | null>(null);
  const [proposedPolicy, setProposedPolicy] = useState<PolicyEvaluation | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Cancellation and pause flags
  const isCancelledRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    if (initialPrompt) {
      setGoalInput(initialPrompt);
    }
  }, [initialPrompt]);

  // Voice Push-to-Talk Handler
  const handleToggleVoice = () => {
    if (isListening) {
      voiceController.stopListening();
      setIsListening(false);
      return;
    }

    const started = voiceController.startListening(
      (transcript, isFinal) => {
        setSpeechTranscript(transcript);
        setGoalInput(transcript);

        if (isFinal) {
          const intent = interpretVoiceCommand(transcript);
          if (intent.type === 'PAUSE_WORKFLOW') {
            handlePauseExecution();
          } else if (intent.type === 'RESUME_WORKFLOW') {
            handleResumeExecution();
          } else if (intent.type === 'CANCEL_WORKFLOW') {
            handleCancelExecution();
          } else if (intent.type === 'RETRY_STEP') {
            handleRetryFailedStep();
          } else if (intent.type === 'EXPLAIN_RESULT') {
            handleSpeakResult();
          }
        }
      },
      (error) => {
        setIsListening(false);
        onShowToast({
          type: 'warning',
          title: 'Voice Recognition Status',
          message: error
        });
      }
    );

    if (started) {
      setIsListening(true);
    }
  };

  // Plan Generation
  const handleGeneratePlan = async (customPrompt?: string) => {
    const goal = (customPrompt || goalInput).trim();
    if (!goal) {
      onShowToast({
        type: 'warning',
        title: 'Empty Goal',
        message: 'Please enter a goal or task description to plan.'
      });
      return;
    }

    setIsPlanning(true);
    try {
      const response = await planWorkflow(goal);
      const plan = response.plan;
      const policy = response.policy;

      setProposedPlan(plan);
      setProposedPolicy(policy);

      onAddEvent({
        runId: plan.id,
        eventType: 'plan_created',
        status: 'draft',
        message: `Plan generated with ${plan.steps.length} steps (${plan.plannerType})`,
        details: { steps: plan.steps.map(s => ({ id: s.id, agent: s.agentId, risk: s.risk })) }
      });

      if (plan.requiresApproval || policy.requiresApproval) {
        setShowApprovalModal(true);
        onAddEvent({
          runId: plan.id,
          eventType: 'approval_requested',
          status: 'awaiting_approval',
          message: `Approval requested: ${plan.approvalReason}`,
          details: { reasons: policy.reasons }
        });
      } else {
        handleApproveAndExecute(plan, policy);
      }
    } catch (err: any) {
      onShowToast({
        type: 'error',
        title: 'Planning Failed',
        message: err.message || 'Could not decompose goal into agent steps.'
      });
    } finally {
      setIsPlanning(false);
    }
  };

  // Approval Handlers
  const handleApproveAndExecute = (planOverride?: WorkflowPlan, policyOverride?: PolicyEvaluation) => {
    const plan = planOverride || proposedPlan;
    if (!plan) return;

    setShowApprovalModal(false);

    onAddEvent({
      runId: plan.id,
      eventType: 'approval_granted',
      status: 'running',
      message: 'Human approval granted. Workflow execution started.'
    });

    const newRun: WorkflowRun = {
      id: 'run-' + Math.random().toString(36).substring(2, 9),
      planId: plan.id,
      goal: plan.goal,
      taskType: plan.taskType,
      steps: plan.steps.map(s => ({ ...s, status: 'pending' })),
      status: 'running',
      requiresApproval: false,
      approvalReason: plan.approvalReason,
      limitations: plan.limitations,
      createdAt: Date.now(),
      startedAt: Date.now(),
      currentStepIndex: 0
    };

    onSetActiveRun(newRun);
    onAddOrUpdateRun(newRun);
    executeWorkflowSequence(newRun);
  };

  const handleRejectPlan = () => {
    if (!proposedPlan) return;
    onAddEvent({
      runId: proposedPlan.id,
      eventType: 'approval_rejected',
      status: 'cancelled',
      message: 'Workflow plan rejected by operator.'
    });
    setProposedPlan(null);
    setProposedPolicy(null);
    setShowApprovalModal(false);
    onShowToast({
      type: 'info',
      title: 'Plan Rejected',
      message: 'The proposed workflow was cancelled without side-effects.'
    });
  };

  // Sequential Multi-Agent Execution Engine
  const executeWorkflowSequence = async (initialRun: WorkflowRun) => {
    setIsExecuting(true);
    isCancelledRef.current = false;
    isPausedRef.current = false;

    let currentRun: WorkflowRun = { ...initialRun };
    const upstreamOutputs: Record<string, any> = {};

    for (let i = 0; i < currentRun.steps.length; i++) {
      if (isCancelledRef.current) {
        currentRun.status = 'cancelled';
        onAddOrUpdateRun(currentRun);
        onSetActiveRun(currentRun);
        onAddEvent({
          runId: currentRun.id,
          eventType: 'run_cancelled',
          status: 'cancelled',
          message: 'Execution aborted by operator.'
        });
        setIsExecuting(false);
        return;
      }

      while (isPausedRef.current) {
        await new Promise(r => setTimeout(r, 500));
        if (isCancelledRef.current) break;
      }

      const step = currentRun.steps[i];
      currentRun.currentStepIndex = i;

      step.status = 'running';
      step.startedAt = Date.now();
      currentRun.steps = [...currentRun.steps];
      onAddOrUpdateRun(currentRun);
      onSetActiveRun({ ...currentRun });

      onAddEvent({
        runId: currentRun.id,
        stepId: step.id,
        agentId: step.agentId,
        agentName: getAgentById(step.agentId)?.name,
        eventType: 'step_started',
        status: 'running',
        message: `Executing ${getAgentById(step.agentId)?.name || step.agentId}: "${step.title}"`
      });

      try {
        const execResult = await executeStepApi({
          stepId: step.id,
          agentId: step.agentId,
          goal: currentRun.goal,
          stepTitle: step.title,
          stepDescription: step.description,
          stepInput: step.input,
          upstreamOutputs,
          approvalGranted: true
        });

        step.output = execResult.output;
        step.durationMs = execResult.durationMs;
        step.completedAt = Date.now();
        upstreamOutputs[step.id] = execResult.output;

        const verifyResult = await verifyStepApi({
          stepId: step.id,
          agentId: step.agentId,
          agentOutput: execResult.output,
          upstreamOutputs
        });

        step.validation = verifyResult.validation;
        step.status = 'completed';

        onAddEvent({
          runId: currentRun.id,
          stepId: step.id,
          agentId: step.agentId,
          agentName: getAgentById(step.agentId)?.name,
          eventType: 'step_completed',
          status: 'completed',
          durationMs: execResult.durationMs,
          message: `Completed step "${step.title}" (${(execResult.durationMs / 1000).toFixed(2)}s)`,
          details: { output: execResult.output }
        });

        onAddEvent({
          runId: currentRun.id,
          stepId: step.id,
          agentId: step.agentId,
          eventType: 'validation_completed',
          status: 'completed',
          message: `Verification check: ${verifyResult.validation.status.toUpperCase()} (${verifyResult.validation.warnings.length} warnings)`,
          details: { validation: verifyResult.validation }
        });

        currentRun.steps = [...currentRun.steps];
        onAddOrUpdateRun(currentRun);
        onSetActiveRun({ ...currentRun });
      } catch (err: any) {
        step.status = 'failed';
        step.error = err.message || 'Execution error';
        currentRun.status = 'failed';
        currentRun.steps = [...currentRun.steps];
        onAddOrUpdateRun(currentRun);
        onSetActiveRun({ ...currentRun });

        onAddEvent({
          runId: currentRun.id,
          stepId: step.id,
          agentId: step.agentId,
          agentName: getAgentById(step.agentId)?.name,
          eventType: 'step_failed',
          status: 'failed',
          message: `Step "${step.title}" failed: ${step.error}`,
          error: step.error
        });

        onShowToast({
          type: 'error',
          title: `Step Failed: ${step.title}`,
          message: step.error
        });

        setIsExecuting(false);
        return;
      }
    }

    // Final Synthesis Step
    try {
      const synthesis = await synthesizeRunApi({
        goal: currentRun.goal,
        steps: currentRun.steps
      });

      currentRun.finalReport = synthesis;
      currentRun.status = 'completed';
      currentRun.completedAt = Date.now();

      onAddOrUpdateRun(currentRun);
      onSetActiveRun({ ...currentRun });

      onAddEvent({
        runId: currentRun.id,
        eventType: 'step_completed',
        status: 'completed',
        message: 'Executive brief synthesized and verified across all workflow steps.'
      });

      onShowToast({
        type: 'success',
        title: 'Workflow Execution Completed',
        message: `All ${currentRun.steps.length} agents finished in sequence with verified outcomes.`
      });

      if (settings.autoSpeakResults && synthesis.summary) {
        handleSpeakResult(synthesis.summary);
      }
    } catch (err: any) {
      console.error('Final synthesis error:', err);
      currentRun.status = 'completed';
      currentRun.completedAt = Date.now();
      onAddOrUpdateRun(currentRun);
      onSetActiveRun({ ...currentRun });
    } finally {
      setIsExecuting(false);
    }
  };

  // Run Controls: Pause, Resume, Cancel, Retry
  const handlePauseExecution = () => {
    isPausedRef.current = true;
    if (activeRun) {
      const updated = { ...activeRun, status: 'paused' as const };
      onAddOrUpdateRun(updated);
      onSetActiveRun(updated);
      onAddEvent({
        runId: activeRun.id,
        eventType: 'run_paused',
        status: 'paused',
        message: 'Execution paused by operator.'
      });
    }
  };

  const handleResumeExecution = () => {
    isPausedRef.current = false;
    if (activeRun) {
      const updated = { ...activeRun, status: 'running' as const };
      onAddOrUpdateRun(updated);
      onSetActiveRun(updated);
      onAddEvent({
        runId: activeRun.id,
        eventType: 'run_resumed',
        status: 'running',
        message: 'Execution resumed by operator.'
      });
    }
  };

  const handleCancelExecution = () => {
    isCancelledRef.current = true;
    if (activeRun) {
      const updated = { ...activeRun, status: 'cancelled' as const };
      onAddOrUpdateRun(updated);
      onSetActiveRun(updated);
      onAddEvent({
        runId: activeRun.id,
        eventType: 'run_cancelled',
        status: 'cancelled',
        message: 'Execution cancelled by operator. Downstream steps aborted.'
      });
    }
    setIsExecuting(false);
  };

  const handleRetryFailedStep = async (stepId?: string) => {
    if (!activeRun) return;
    const targetStepId = stepId || activeRun.steps.find(s => s.status === 'failed')?.id;
    if (!targetStepId) return;

    onAddEvent({
      runId: activeRun.id,
      stepId: targetStepId,
      eventType: 'step_retried',
      status: 'running',
      message: `Retrying failed step ${targetStepId}`
    });

    const resetRun: WorkflowRun = {
      ...activeRun,
      status: 'running',
      steps: activeRun.steps.map(s => {
        if (s.id === targetStepId) {
          return { ...s, status: 'pending', error: undefined, retryCount: (s.retryCount || 0) + 1 };
        }
        return s;
      })
    };

    onAddOrUpdateRun(resetRun);
    onSetActiveRun(resetRun);
    executeWorkflowSequence(resetRun);
  };

  const handleCopyStepOutput = (stepId: string, output: any) => {
    const text = typeof output === 'object' ? JSON.stringify(output, null, 2) : String(output);
    navigator.clipboard.writeText(text);
    setCopiedStepId(stepId);
    setTimeout(() => setCopiedStepId(null), 2000);
    onShowToast({
      type: 'info',
      title: 'Copied Deliverable',
      message: 'Step output JSON copied to clipboard.'
    });
  };

  // Spoken Output Handler
  const handleSpeakResult = (customText?: string) => {
    if (isSpeaking) {
      voiceController.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = customText || activeRun?.finalReport?.summary || 'No summary available to read aloud.';
    voiceController.speak(textToSpeak, {
      voiceName: settings.speechVoiceName,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      onEnd: () => setIsSpeaking(false)
    });
    setIsSpeaking(true);
  };

  // Quick Start Scenarios
  const demoPrompts = [
    {
      title: 'Competitor Research',
      icon: Search,
      prompt: 'Compare three AI coding tools: GitHub Copilot, Cursor, and Windsurf. Prepare a structured report covering features, pricing caveats, strengths, weaknesses, and open questions.'
    },
    {
      title: 'CSV Data Insights',
      icon: FileSpreadsheet,
      action: () => onOpenCsvModal(),
      prompt: 'Analyze sales and conversion CSV, calculate monthly trends, and flag unusual values.'
    },
    {
      title: 'Code Security Review',
      icon: Code2,
      prompt: 'Review the authentication middleware code for likely security vulnerabilities, OWASP violations, and produce a prioritized remediation report.'
    }
  ];

  const completedStepsCount = activeRun?.steps.filter(s => s.status === 'completed').length || 0;
  const progressPercent = activeRun && activeRun.steps.length > 0 ? (completedStepsCount / activeRun.steps.length) * 100 : 0;

  // Real operational stats calculated from runs
  const activeRunsCount = runs.filter(r => r.status === 'running').length;
  const completedRunsCount = runs.filter(r => r.status === 'completed').length;
  const pendingApprovalsCount = runs.filter(r => r.status === 'awaiting_approval').length;

  return (
    <div className="space-y-6">
      {/* 1. Compact Operational Header */}
      <div className="surface-panel rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#175CD3] dark:text-[#94A3B8] font-bold">
              AI OPERATIONS / COMMAND CENTER
            </span>
            <span className="text-[#CBD5E1] dark:text-[#334155]">·</span>
            <span className="text-[11px] text-[#53657E] dark:text-[#64748B]">Deterministic Policy Guardrails</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#153B75] dark:text-[#F8FAFC]">
            Orchestrate intelligent workflows.
          </h1>
          <p className="text-xs sm:text-sm text-[#53657E] dark:text-[#94A3B8] leading-relaxed">
            Coordinate specialized agents, enforce deterministic policies, and verify execution in an auditable sandbox.
          </p>
        </div>

        {/* Compact Pipeline Status Indicator */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#1E293B] flex items-center gap-2 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isExecuting
                  ? 'bg-[#175CD3] dark:bg-[#3B82F6] animate-pulse'
                  : isPlanning
                  ? 'bg-[#F07828] dark:bg-[#F59E0B] animate-pulse'
                  : 'bg-[#059669] dark:bg-[#10B981]'
              }`}
            />
            <span className="text-[#53657E] dark:text-[#94A3B8]">Pipeline:</span>
            <span className="font-semibold text-[#153B75] dark:text-[#F8FAFC]">
              {isExecuting ? 'Executing' : isPlanning ? 'Planning' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Operational Metrics Overview (Using Real Existing Application Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface-card rounded-lg p-3.5 flex flex-col border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B]">Registered Agents</span>
          <span className="font-display text-xl font-bold text-[#153B75] dark:text-[#F8FAFC] tabular-nums mt-1">
            {REGISTERED_AGENTS.length} Roles
          </span>
          <span className="text-[11px] text-[#53657E] dark:text-[#94A3B8] mt-0.5">Isolated capabilities</span>
        </div>

        <div className="surface-card rounded-lg p-3.5 flex flex-col border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B]">Active Workflows</span>
          <span className="font-display text-xl font-bold text-[#175CD3] dark:text-[#3B82F6] tabular-nums mt-1 flex items-center gap-1.5">
            {isExecuting ? activeRunsCount + 1 : activeRunsCount}
          </span>
          <span className="text-[11px] text-[#53657E] dark:text-[#94A3B8] mt-0.5">
            {pendingApprovalsCount > 0 ? `${pendingApprovalsCount} awaiting approval` : 'No pending gates'}
          </span>
        </div>

        <div className="surface-card rounded-lg p-3.5 flex flex-col border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B]">Completed Runs</span>
          <span className="font-display text-xl font-bold text-[#059669] dark:text-[#10B981] tabular-nums mt-1">
            {completedRunsCount}
          </span>
          <span className="text-[11px] text-[#53657E] dark:text-[#94A3B8] mt-0.5">Audited & verified</span>
        </div>

        <div className="surface-card rounded-lg p-3.5 flex flex-col border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B]">Policy Posture</span>
          <span className="font-display text-xl font-bold text-[#F07828] dark:text-[#F97316] mt-1">
            Default-Deny
          </span>
          <span className="text-[11px] text-[#53657E] dark:text-[#94A3B8] mt-0.5">RBAC & tool sandboxing</span>
        </div>
      </div>

      {/* 3. Primary Focal Point: Natural-Language Command Composer */}
      <div className="surface-panel rounded-xl p-5 sm:p-6 space-y-4 border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#153B75] dark:text-[#F8FAFC] flex items-center gap-2">
            <span>Natural-Language Objective or Voice Command</span>
          </label>
          <span className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B]">
            {goalInput.length} chars · <kbd className="px-1 py-0.5 bg-[#F8FAFC] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#1E293B] rounded text-[10px]">Ctrl+Enter</kbd> to plan
          </span>
        </div>

        <div className="relative">
          <textarea
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleGeneratePlan();
              }
            }}
            placeholder="Describe the task you want your specialized agents to plan and execute (e.g. Compare three AI coding tools, audit code security, or analyze a dataset)..."
            rows={3}
            className="surface-input w-full rounded-lg p-3.5 pr-12 text-xs sm:text-sm text-[#153B75] dark:text-[#F8FAFC] placeholder-[#8092A8] dark:placeholder-[#64748B] resize-none leading-relaxed font-normal bg-white dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#1E293B]"
          />

          {/* Microphone push-to-talk button */}
          <button
            onClick={handleToggleVoice}
            className={`absolute right-3 top-3 p-2 rounded-md transition-colors cursor-pointer ${
              isListening
                ? 'bg-[#F07828] dark:bg-[#F97316] text-white animate-pulse'
                : 'text-[#53657E] dark:text-[#64748B] hover:text-[#153B75] dark:hover:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#131E33] hover:bg-[#F1F5F9] dark:hover:bg-[#182642] border border-[#CBD5E1] dark:border-[#1E293B]'
            }`}
            title={isListening ? 'Stop recording voice' : 'Push-to-talk voice input'}
            aria-label="Push-to-talk voice input"
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        </div>

        {/* Listening Voice Visualizer Ribbon */}
        {isListening && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#FEF3EB] dark:bg-[#78350F]/20 border border-[#FCD8BE] dark:border-[#D97706]/40 text-xs text-[#D97706] dark:text-[#FBBF24]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#D97706] dark:bg-[#F59E0B] animate-pulse shrink-0" />
              <span className="font-semibold shrink-0">Live Microphone:</span>
              <span className="italic text-[#153B75] dark:text-[#F8FAFC] truncate">
                {speechTranscript || 'Listening... Speak your command clearly.'}
              </span>
            </div>
            <div className="flex items-center gap-1 h-3 shrink-0 ml-2">
              <span className="w-1 h-3 bg-[#D97706] dark:bg-[#F59E0B] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-2 bg-[#D97706] dark:bg-[#F59E0B] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-3 bg-[#D97706] dark:bg-[#F59E0B] rounded-full animate-bounce"></span>
            </div>
          </div>
        )}

        {/* Quick-Start Scenarios & Composer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Quick-start scenarios */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8092A8] dark:text-[#64748B] shrink-0 mr-1">
              Scenarios:
            </span>
            {demoPrompts.map((d, i) => {
              const Icon = d.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (d.action) {
                      d.action();
                    } else {
                      setGoalInput(d.prompt);
                    }
                  }}
                  className="surface-card hover:bg-[#EAF1FB] dark:hover:bg-[#17243E] border border-[#E2E8F0] dark:border-[#1E293B] px-2.5 py-1 text-xs font-medium text-[#53657E] dark:text-[#94A3B8] hover:text-[#153B75] dark:hover:text-[#F8FAFC] rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <Icon size={12} className="text-[#175CD3] dark:text-[#3B82F6]" />
                  <span>{d.title}</span>
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {goalInput.trim().length > 0 && (
              <button
                onClick={() => setGoalInput('')}
                disabled={isPlanning || isExecuting}
                className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              onClick={() => handleGeneratePlan()}
              disabled={isPlanning || isExecuting || !goalInput.trim()}
              className="btn-primary px-5 py-2 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPlanning ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Decomposing Tasks...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>Plan Workflow</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Human Approval Gate Modal if awaiting approval */}
      {showApprovalModal && proposedPlan && proposedPolicy && (
        <ApprovalModal
          plan={proposedPlan}
          policy={proposedPolicy}
          onApprove={() => handleApproveAndExecute(proposedPlan, proposedPolicy)}
          onReject={handleRejectPlan}
        />
      )}

      {/* Active Run Workspace */}
      {activeRun && (
        <div className="space-y-5">
          {/* Execution Controls Header */}
          <div className="surface-panel rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={activeRun.status} />
                <span className="text-xs font-mono text-[#64748B]">{activeRun.id}</span>
                <span className="text-xs text-[#64748B]">· Task: <strong className="text-[#F8FAFC]">{activeRun.taskType}</strong></span>
              </div>
              <h2 className="font-display text-base font-semibold text-[#F8FAFC] truncate">
                "{activeRun.goal}"
              </h2>

              {/* Progress bar */}
              <div className="pt-1 flex items-center gap-3">
                <div className="w-40 h-1.5 rounded-full bg-[#1E293B] overflow-hidden">
                  <div
                    className="h-full bg-[#3B82F6] transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-[#94A3B8] tabular-nums">
                  {completedStepsCount}/{activeRun.steps.length} Steps ({Math.round(progressPercent)}%)
                </span>
              </div>
            </div>

            {/* Execution Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {activeRun.status === 'running' && (
                <button
                  onClick={handlePauseExecution}
                  className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer text-[#F59E0B]"
                >
                  <Pause size={12} />
                  <span>Pause</span>
                </button>
              )}

              {activeRun.status === 'paused' && (
                <button
                  onClick={handleResumeExecution}
                  className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer text-[#3B82F6]"
                >
                  <Play size={12} />
                  <span>Resume</span>
                </button>
              )}

              {(activeRun.status === 'running' || activeRun.status === 'paused') && (
                <button
                  onClick={handleCancelExecution}
                  className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer text-[#EF4444]"
                >
                  <XCircle size={12} />
                  <span>Cancel</span>
                </button>
              )}

              {activeRun.status === 'failed' && (
                <button
                  onClick={() => handleRetryFailedStep()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Retry Step</span>
                </button>
              )}

              {activeRun.finalReport && (
                <button
                  onClick={() => handleSpeakResult()}
                  className={`btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer ${
                    isSpeaking ? 'text-[#3B82F6] border-[#3B82F6]' : 'text-[#94A3B8]'
                  }`}
                >
                  {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  <span>{isSpeaking ? 'Mute' : 'Audio Brief'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Graph Visualizer */}
          <WorkflowVisualizer
            steps={activeRun.steps}
            onRetryStep={handleRetryFailedStep}
            isExecuting={isExecuting}
          />

          {/* Live Step Deliverables */}
          <div className="surface-panel rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
              <h3 className="font-display text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-[#3B82F6]" />
                <span>Intermediate Agent Deliverables</span>
              </h3>
              <span className="text-[11px] font-mono text-[#64748B]">Real-Time Data Flow</span>
            </div>

            <div className="space-y-3">
              {activeRun.steps.map((step, idx) => {
                const agent = getAgentById(step.agentId);
                const isRunning = step.status === 'running';

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isRunning
                        ? 'bg-[#0B1120] border-[#3B82F6]'
                        : step.status === 'completed'
                        ? 'bg-[#0B1120] border-[#1E293B]'
                        : step.status === 'failed'
                        ? 'bg-[#180A0A] border-[#7F1D1D]'
                        : 'bg-[#070B13] border-[#1E293B] opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs text-[#64748B]">0{idx + 1}</span>
                        <h4 className="text-xs font-semibold text-[#F8FAFC] truncate">{step.title}</h4>
                        <span className="text-[11px] font-mono text-[#3B82F6] shrink-0">
                          ({agent?.name || step.agentId})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {step.durationMs && (
                          <span className="text-[11px] font-mono text-[#94A3B8] tabular-nums">
                            {(step.durationMs / 1000).toFixed(2)}s
                          </span>
                        )}
                        <StatusBadge status={step.status} size="sm" />
                      </div>
                    </div>

                    {step.output && (
                      <div className="mt-2.5 p-3 rounded bg-[#070B13] border border-[#1E293B] font-mono text-[11px] text-[#94A3B8] max-h-52 overflow-y-auto relative group">
                        <button
                          onClick={() => handleCopyStepOutput(step.id, step.output)}
                          className="absolute right-2 top-2 p-1 rounded bg-[#131E33] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy Output"
                        >
                          {copiedStepId === step.id ? <Check size={11} className="text-[#10B981]" /> : <Copy size={11} />}
                        </button>
                        <pre className="whitespace-pre-wrap leading-relaxed">
                          {typeof step.output === 'object'
                            ? JSON.stringify(step.output, null, 2)
                            : String(step.output)}
                        </pre>
                      </div>
                    )}

                    {step.validation && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] font-mono">
                        <span className="text-[#64748B]">Verification:</span>
                        {step.validation.checksPerformed.map((c, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
                              c.passed
                                ? 'bg-[#064E3B]/20 text-[#34D399] border-[#059669]/40'
                                : 'bg-[#7F1D1D]/20 text-[#F87171] border-[#DC2626]/40'
                            }`}
                          >
                            <CheckCircle2 size={10} />
                            <span>{c.name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {step.error && (
                      <div className="mt-2.5 p-2.5 rounded bg-[#7F1D1D]/20 border border-[#DC2626]/40 text-xs text-[#F87171]">
                        <strong>Error:</strong> {step.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Executive Briefing / Report */}
          {activeRun.finalReport && (
            <div className="surface-panel rounded-xl p-5 sm:p-6 space-y-4 border border-[#2563EB]/40">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1E293B]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#064E3B]/30 border border-[#059669]/40 text-[#10B981]">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                      Synthesized Executive Outcome
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Cohesive findings unified across all agent stages and verified by audit rules.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const md = `# Executive Report: ${activeRun.goal}\n\n${activeRun.finalReport?.summary}\n\n` +
                      activeRun.finalReport?.sections.map(s => `## ${s.title}\n${s.content}\n`).join('\n') +
                      `\n## Caveats & Unknowns\n` +
                      activeRun.finalReport?.caveats.map(c => `- ${c}`).join('\n');
                    const blob = new Blob([md], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `agentvault_report_${activeRun.id}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} className="text-[#3B82F6]" />
                  <span>Download .md</span>
                </button>
              </div>

              {/* Summary Lead */}
              <div className="p-4 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#3B82F6] block mb-1">
                  Executive Briefing
                </span>
                <p className="text-xs sm:text-sm text-[#F8FAFC] leading-relaxed">
                  {activeRun.finalReport.summary}
                </p>
              </div>

              {/* Thematic Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeRun.finalReport.sections.map((sec, i) => (
                  <div key={i} className="surface-card rounded-lg p-3.5 space-y-1">
                    <h4 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-wider">
                      {sec.title}
                    </h4>
                    <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Caveats */}
              {activeRun.finalReport.caveats && activeRun.finalReport.caveats.length > 0 && (
                <div className="p-3.5 rounded-lg bg-[#78350F]/20 border border-[#D97706]/30 text-xs text-[#FBBF24] space-y-1">
                  <strong className="block text-[#F59E0B]">Audited Caveats & Limitations:</strong>
                  {activeRun.finalReport.caveats.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5 text-[#F59E0B]" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Operational Overview (Below Composer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Workflow Executions (7 cols) */}
        <div className="lg:col-span-7 surface-panel rounded-xl p-5 space-y-3 border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#175CD3] dark:text-[#3B82F6]" />
              <h3 className="font-display text-xs font-bold text-[#153B75] dark:text-[#F8FAFC] uppercase tracking-wider">
                Recent Workflow Executions
              </h3>
            </div>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('runs')}
                className="text-[11px] text-[#175CD3] dark:text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>View all</span>
                <ChevronRight size={12} />
              </button>
            )}
          </div>

          {runs.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {runs.slice(0, 5).map(run => {
                const completedSteps = run.steps.filter(s => s.status === 'completed').length;
                return (
                  <div
                    key={run.id}
                    onClick={() => onSetActiveRun(run)}
                    className="p-3 rounded-lg surface-card border border-[#E2E8F0] dark:border-[#1E293B] hover:bg-[#EAF1FB] dark:hover:bg-[#17243E] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#8092A8] dark:text-[#64748B]">{run.id}</span>
                        <span className="text-[11px] text-[#53657E] dark:text-[#94A3B8]">· {run.taskType}</span>
                      </div>
                      <p className="text-xs font-medium text-[#153B75] dark:text-[#F8FAFC] truncate mt-0.5 group-hover:text-[#175CD3] dark:group-hover:text-[#3B82F6] transition-colors">
                        "{run.goal}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-[#53657E] dark:text-[#94A3B8] tabular-nums hidden sm:inline">
                        {completedSteps}/{run.steps.length} steps
                      </span>
                      <StatusBadge status={run.status} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#8092A8] dark:text-[#64748B]">
              <p>No executions logged yet.</p>
              <p className="text-[11px] mt-1 text-[#53657E] dark:text-[#94A3B8]">
                Run a scenario above or compose your first goal to initiate orchestration.
              </p>
            </div>
          )}
        </div>

        {/* Registered Agent Roster & Availability (5 cols) */}
        <div className="lg:col-span-5 surface-panel rounded-xl p-5 space-y-3 border border-[#E2E8F0] dark:border-[#1E293B] shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Bot size={14} className="text-[#F07828] dark:text-[#F97316]" />
              <h3 className="font-display text-xs font-bold text-[#153B75] dark:text-[#F8FAFC] uppercase tracking-wider">
                Specialized Agent Availability
              </h3>
            </div>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('marketplace')}
                className="text-[11px] text-[#175CD3] dark:text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>Catalog</span>
                <ChevronRight size={12} />
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {REGISTERED_AGENTS.map(agent => (
              <div
                key={agent.id}
                className="p-2.5 rounded-lg surface-card border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between gap-2.5 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#153B75] dark:text-[#F8FAFC] truncate">{agent.name}</span>
                    <span className="text-[10px] font-mono text-[#8092A8] dark:text-[#64748B]">({agent.role})</span>
                  </div>
                  <p className="text-[11px] text-[#53657E] dark:text-[#94A3B8] truncate">{agent.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <RiskBadge risk={agent.riskProfile} showIcon={false} />
                  <button
                    onClick={() => {
                      setGoalInput(`Coordinate ${agent.name} to: `);
                    }}
                    className="p-1 rounded text-[#8092A8] dark:text-[#64748B] hover:text-[#175CD3] dark:hover:text-[#3B82F6] hover:bg-[#F8FAFC] dark:hover:bg-[#090D16] transition-colors cursor-pointer"
                    title={`Select ${agent.name}`}
                  >
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
