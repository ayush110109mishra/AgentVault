export type TaskType = 
  | 'research'
  | 'data_analysis'
  | 'code_review'
  | 'security_audit'
  | 'writing'
  | 'general';

export type RiskLevel = 'low' | 'medium' | 'high';

export type StepStatus = 
  | 'pending'
  | 'running'
  | 'waiting_for_approval'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled';

export type WorkflowStatus = 
  | 'draft'
  | 'awaiting_approval'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type EventType =
  | 'plan_created'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_rejected'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'step_retried'
  | 'run_paused'
  | 'run_resumed'
  | 'run_cancelled'
  | 'validation_completed';

export interface AgentPermissions {
  readSuppliedInputs: boolean;
  analyzeData: boolean;
  generateText: boolean;
  useConfiguredExternalTools: boolean;
  performExternalSideEffects: boolean;
  scopeList: string[];
}

export interface AgentTool {
  name: string;
  description: string;
  isAvailable: boolean;
  category: 'read' | 'compute' | 'verify' | 'external' | 'synthesis';
}

export interface Agent {
  id: string;
  name: string;
  version: string;
  role: string;
  description: string;
  capabilities: string[];
  supportedInputTypes: string[];
  expectedOutput: string;
  availableTools: AgentTool[];
  permissions: AgentPermissions;
  riskProfile: RiskLevel;
  systemInstruction: string;
  isLocallyRegistered: boolean;
  externalIdentityVerified: boolean;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  title: string;
  description: string;
  dependsOn: string[];
  input: Record<string, any>;
  expectedOutput: string;
  risk: RiskLevel;
  status: StepStatus;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  output?: any;
  error?: string;
  validation?: ValidationResult;
  retryCount?: number;
}

export interface WorkflowPlan {
  id: string;
  goal: string;
  taskType: TaskType;
  steps: WorkflowStep[];
  requiresApproval: boolean;
  approvalReason: string;
  limitations: string[];
  plannerType: 'open_weight' | 'gemma' | 'gemini' | 'rule_based_fallback';
  createdAt: number;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface ValidationResult {
  stepId: string;
  status: 'passed' | 'warning' | 'failed';
  checksPerformed: ValidationCheck[];
  warnings: string[];
  unverifiedClaims: string[];
  limitations: string[];
  validatedAt: number;
}

export interface ApprovalRequest {
  planId: string;
  runId: string;
  requestedAt: number;
  riskLevel: RiskLevel;
  reason: string;
  proposedSteps: {
    id: string;
    agentName: string;
    title: string;
    risk: RiskLevel;
  }[];
  requestedTools: string[];
  expectedSideEffects: string[];
}

export interface ExecutionEvent {
  id: string;
  runId: string;
  stepId?: string;
  agentId?: string;
  agentName?: string;
  eventType: EventType;
  timestamp: number;
  status: WorkflowStatus | StepStatus;
  durationMs?: number;
  message: string;
  details?: Record<string, any>;
  error?: string;
}

export interface WorkflowRun {
  id: string;
  planId: string;
  goal: string;
  taskType: TaskType;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  requiresApproval: boolean;
  approvalReason: string;
  limitations: string[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  currentStepIndex: number;
  finalSynthesis?: string;
  finalReport?: {
    summary: string;
    sections: { title: string; content: string }[];
    unresolvedQuestions?: string[];
    caveats: string[];
    validationOverview: {
      totalSteps: number;
      passedChecks: number;
      warningsCount: number;
    };
  };
}

export interface CsvColumnSummary {
  name: string;
  type: 'numeric' | 'string' | 'date';
  nullCount: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  sum?: number;
  sampleValues: (string | number)[];
}

export interface CsvAnalysisResult {
  fileName: string;
  rowCount: number;
  columnCount: number;
  columns: CsvColumnSummary[];
  anomalies: {
    column: string;
    rowIndices: number[];
    reason: string;
    value: any;
  }[];
  groupAggregations?: Record<string, Record<string, number>>;
  generatedSummaryMarkdown: string;
  parsedAt: number;
}

export interface AppSettings {
  autoSpeakResults: boolean;
  speechVoiceName: string;
  speechRate: number;
  speechPitch: number;
  stepTimeoutSeconds: number;
  showAdvancedLogs: boolean;
  preferredModel: string;
}
