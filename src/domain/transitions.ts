import { StepStatus, WorkflowStatus } from './types';

// Legal Workflow transitions
const VALID_WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ['awaiting_approval', 'running', 'cancelled'],
  awaiting_approval: ['running', 'cancelled', 'draft'],
  running: ['paused', 'completed', 'failed', 'cancelled'],
  paused: ['running', 'cancelled'],
  completed: [], // Terminal
  failed: ['running', 'cancelled'], // Can retry
  cancelled: [] // Terminal
};

// Legal Step transitions
const VALID_STEP_TRANSITIONS: Record<StepStatus, StepStatus[]> = {
  pending: ['running', 'waiting_for_approval', 'skipped', 'cancelled'],
  waiting_for_approval: ['running', 'cancelled', 'skipped'],
  running: ['completed', 'failed', 'cancelled'],
  completed: ['running'], // Allow explicit step retry
  failed: ['running', 'skipped', 'cancelled'], // Can retry
  skipped: ['pending', 'running'],
  cancelled: ['pending', 'running']
};

export function canTransitionWorkflow(from: WorkflowStatus, to: WorkflowStatus): boolean {
  if (from === to) return true;
  return VALID_WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionStep(from: StepStatus, to: StepStatus): boolean {
  if (from === to) return true;
  return VALID_STEP_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertWorkflowTransition(from: WorkflowStatus, to: WorkflowStatus): void {
  if (!canTransitionWorkflow(from, to)) {
    throw new Error(`Illegal workflow state transition: cannot transition from "${from}" to "${to}".`);
  }
}

export function assertStepTransition(from: StepStatus, to: StepStatus): void {
  if (!canTransitionStep(from, to)) {
    throw new Error(`Illegal step state transition: cannot transition from "${from}" to "${to}".`);
  }
}
