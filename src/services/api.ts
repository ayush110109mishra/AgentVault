import { WorkflowPlan, WorkflowStep, ValidationResult } from '../domain/types';
import { PolicyEvaluation } from '../domain/policies';

export interface PlanApiResponse {
  plan: WorkflowPlan;
  policy: PolicyEvaluation;
  isFallback: boolean;
  message?: string;
  modelUsed?: string;
  provider?: string;
}

export interface ExecuteStepApiResponse {
  success: boolean;
  output: any;
  durationMs: number;
  agentId: string;
  stepId: string;
  isFallback?: boolean;
  error?: string;
}

export interface VerifyStepApiResponse {
  validation: ValidationResult;
}

export interface FinalSynthesisResponse {
  summary: string;
  sections: { title: string; content: string }[];
  unresolvedQuestions?: string[];
  caveats: string[];
  validationOverview: {
    totalSteps: number;
    passedChecks: number;
    warningsCount: number;
  };
  provider?: string;
  model?: string;
}

export interface ServerHealthResponse {
  status: string;
  hasGeminiKey: boolean;
  model: string;
  activeProvider: string;
  isOpenWeight: boolean;
  providerStatus: 'connected' | 'offline' | 'unconfigured' | 'error';
  license: string;
  endpoint?: string;
  details?: string;
}

export async function checkServerHealth(): Promise<ServerHealthResponse> {
  try {
    const res = await fetch('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      status: 'offline',
      hasGeminiKey: false,
      model: 'Gemma-Compatible Guarded Engine',
      activeProvider: 'offline-engine',
      isOpenWeight: true,
      providerStatus: 'offline',
      license: 'Apache-2.0',
      details: 'Local deterministic safety engine (air-gapped)'
    };
  }
}

export async function getModelStatusApi(): Promise<any> {
  try {
    const res = await fetch('/api/model-status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      provider: 'offline-engine',
      model: 'Guarded Engine',
      isOpenWeight: true,
      status: 'offline',
      license: 'Apache-2.0',
      details: err?.message || 'Server unreachable'
    };
  }
}

export async function planWorkflow(goal: string, context?: any): Promise<PlanApiResponse> {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, context })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to plan workflow' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return await res.json();
}

export async function executeStepApi(params: {
  stepId: string;
  agentId: string;
  goal: string;
  stepTitle: string;
  stepDescription: string;
  stepInput?: any;
  upstreamOutputs?: Record<string, any>;
  approvalGranted?: boolean;
  requestedTools?: string[];
}): Promise<ExecuteStepApiResponse> {
  const res = await fetch('/api/execute-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Step execution failed with HTTP ${res.status}`);
  }

  return data;
}

export async function verifyStepApi(params: {
  stepId: string;
  agentId: string;
  agentOutput: any;
  upstreamOutputs?: Record<string, any>;
}): Promise<VerifyStepApiResponse> {
  const res = await fetch('/api/verify-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    throw new Error(`Step verification failed with HTTP ${res.status}`);
  }

  return await res.json();
}

export async function synthesizeRunApi(params: {
  goal: string;
  steps: WorkflowStep[];
}): Promise<FinalSynthesisResponse> {
  const res = await fetch('/api/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    throw new Error(`Final synthesis failed with HTTP ${res.status}`);
  }

  return await res.json();
}
