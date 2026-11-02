import { Agent, RiskLevel, WorkflowPlan, WorkflowStep } from './types';
import { REGISTERED_AGENTS, getAgentById } from './agent-registry';

export interface PolicyEvaluation {
  allowed: boolean;
  requiresApproval: boolean;
  computedRisk: RiskLevel;
  reasons: string[];
  expectedSideEffects: string[];
  disallowedReasons: string[];
}

/**
 * Deterministic policy evaluator that assesses a proposed workflow plan
 * against security boundaries and agent capabilities.
 */
export function evaluateWorkflowPolicy(
  steps: { agentId: string; title?: string; input?: any; requestedTools?: string[] }[],
  taskType: string,
  userGoal: string
): PolicyEvaluation {
  const reasons: string[] = [];
  const disallowedReasons: string[] = [];
  const expectedSideEffects: string[] = [];
  let highestRisk: RiskLevel = 'low';
  let requiresApproval = false;

  // 1. Verify all agents exist in registry
  for (const step of steps) {
    const agent = getAgentById(step.agentId);
    if (!agent) {
      disallowedReasons.push(`Unknown agent ID: "${step.agentId}". Only locally registered agents are permitted.`);
      continue;
    }

    // Check risk profile of the agent
    if (agent.riskProfile === 'high') {
      highestRisk = 'high';
      requiresApproval = true;
      reasons.push(`Agent "${agent.name}" carries high risk profile.`);
    } else if (agent.riskProfile === 'medium' && highestRisk !== 'high') {
      highestRisk = 'medium';
      requiresApproval = true;
      reasons.push(`Agent "${agent.name}" requires user verification for specialized analysis.`);
    }

    // Check permissions and requested tools
    if (step.requestedTools && step.requestedTools.length > 0) {
      for (const toolName of step.requestedTools) {
        const matchingTool = agent.availableTools.find(t => t.name.toLowerCase() === toolName.toLowerCase());
        if (!matchingTool) {
          disallowedReasons.push(`Agent "${agent.name}" requested undeclared tool: "${toolName}". Default-deny enforced.`);
        } else if (!matchingTool.isAvailable) {
          disallowedReasons.push(`Tool "${matchingTool.name}" is disabled or requires external authorization.`);
        }
      }
    }
  }

  // 2. Goal and Task Type heuristics
  const goalLower = userGoal.toLowerCase();
  
  if (taskType === 'security_audit' || taskType === 'code_review') {
    if (highestRisk === 'low') highestRisk = 'medium';
    requiresApproval = true;
    reasons.push('Code analysis and security audit workflows require human review before execution.');
  }

  if (goalLower.includes('delete') || goalLower.includes('drop') || goalLower.includes('remove') || goalLower.includes('overwrite')) {
    highestRisk = 'high';
    requiresApproval = true;
    reasons.push('Goal indicates potential data mutation or deletion.');
    expectedSideEffects.push('File or data mutation check');
  }

  if (goalLower.includes('email') || goalLower.includes('send') || goalLower.includes('post') || goalLower.includes('publish') || goalLower.includes('pay') || goalLower.includes('purchase')) {
    highestRisk = 'high';
    requiresApproval = true;
    reasons.push('Goal mentions outbound communication or external side effect.');
    expectedSideEffects.push('Outbound network notification (Blocked in sandbox)');
  }

  // Data analysis tasks with custom files require confirmation
  if (taskType === 'data_analysis') {
    if (highestRisk === 'low') highestRisk = 'medium';
    requiresApproval = true;
    reasons.push('Data analysis on provided datasets requires human authorization to confirm data scope.');
  }

  // If there are multiple steps (multi-agent orchestration), require approval if medium/high
  if (steps.length >= 3 && highestRisk === 'low') {
    // low risk 3-step research can run or request quiet approval
    requiresApproval = true;
    reasons.push('Multi-agent pipeline proposed. Human review recommended to confirm agent sequence.');
  }

  return {
    allowed: disallowedReasons.length === 0,
    requiresApproval,
    computedRisk: highestRisk,
    reasons: reasons.length > 0 ? reasons : ['Routine low-risk workflow.'],
    expectedSideEffects,
    disallowedReasons
  };
}

/**
 * Validates a plan's structure and dependency graph (detects cycles, unknown step IDs).
 */
export function validatePlanGraph(plan: { steps: WorkflowStep[] }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const stepIds = new Set(plan.steps.map(s => s.id));

  if (plan.steps.length === 0) {
    errors.push('Workflow must contain at least one step.');
    return { valid: false, errors };
  }

  for (const step of plan.steps) {
    // Agent validity
    if (!getAgentById(step.agentId)) {
      errors.push(`Step ${step.id} references unregistered agent: ${step.agentId}`);
    }

    // Dependency validity
    for (const dep of step.dependsOn) {
      if (!stepIds.has(dep)) {
        errors.push(`Step ${step.id} depends on non-existent step: ${dep}`);
      }
      if (dep === step.id) {
        errors.push(`Step ${step.id} cannot depend on itself.`);
      }
    }
  }

  // Simple cycle detection via topological sort
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  for (const step of plan.steps) {
    inDegree[step.id] = step.dependsOn.length;
    adj[step.id] = [];
  }
  for (const step of plan.steps) {
    for (const dep of step.dependsOn) {
      if (adj[dep]) adj[dep].push(step.id);
    }
  }

  const queue: string[] = [];
  for (const id in inDegree) {
    if (inDegree[id] === 0) queue.push(id);
  }

  let visitedCount = 0;
  while (queue.length > 0) {
    const curr = queue.shift()!;
    visitedCount++;
    for (const neighbor of adj[curr] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (visitedCount < plan.steps.length) {
    errors.push('Circular dependency cycle detected in workflow plan steps.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
