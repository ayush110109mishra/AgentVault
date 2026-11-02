import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWorkflowPolicy, validatePlanGraph } from '../src/domain/policies';
import { REGISTERED_AGENTS } from '../src/domain/agent-registry';

test('Policy Evaluator — Enforces human approval on security audit and code review', () => {
  const codeReviewPolicy = evaluateWorkflowPolicy(
    [{ agentId: 'code-review-agent' }],
    'code_review',
    'Review express route handlers for vulnerabilities'
  );
  assert.equal(codeReviewPolicy.requiresApproval, true);
  assert.ok(codeReviewPolicy.reasons.some(r => r.includes('Code analysis')));

  const secAuditPolicy = evaluateWorkflowPolicy(
    [{ agentId: 'security-auditor' }],
    'security_audit',
    'Audit authentication tokens and session security'
  );
  assert.equal(secAuditPolicy.requiresApproval, true);
  assert.ok(secAuditPolicy.reasons.some(r => r.includes('security audit')));
});

test('Policy Evaluator — Enforces default-deny on undeclared or unavailable tools', () => {
  // data-analyst only has 'Deterministic Math Engine' and 'Anomaly Scanner'. 'Direct Database Drop' is undeclared.
  const evaluation = evaluateWorkflowPolicy(
    [{ agentId: 'data-analyst', requestedTools: ['Direct Database Drop'] }],
    'general',
    'Drop database table'
  );
  assert.equal(evaluation.allowed, false);
  assert.ok(evaluation.disallowedReasons.some(r => r.includes('undeclared tool')));

  // 'External Database Query' is marked isAvailable: false for data-analyst
  const disabledToolEval = evaluateWorkflowPolicy(
    [{ agentId: 'data-analyst', requestedTools: ['External Database Query'] }],
    'general',
    'Execute remote SQL'
  );
  assert.equal(disabledToolEval.allowed, false);
  assert.ok(disabledToolEval.disallowedReasons.some(r => r.includes('disabled or requires external authorization')));
});

test('Policy Evaluator — Detects dangerous mutations and elevates risk to high', () => {
  const deleteEval = evaluateWorkflowPolicy(
    [{ agentId: 'research-agent' }],
    'general',
    'Please delete customer backup tables'
  );
  assert.equal(deleteEval.computedRisk, 'high');
  assert.equal(deleteEval.requiresApproval, true);
  assert.ok(deleteEval.reasons.some(r => r.includes('data mutation or deletion')));
});

test('Policy Evaluator — Registered Agent Registry Integrity', () => {
  assert.equal(REGISTERED_AGENTS.length, 6);
  const ids = REGISTERED_AGENTS.map(a => a.id);
  assert.ok(ids.includes('research-agent'));
  assert.ok(ids.includes('data-analyst'));
  assert.ok(ids.includes('verification-agent'));
  assert.ok(ids.includes('writer-agent'));
  assert.ok(ids.includes('code-review-agent'));
  assert.ok(ids.includes('security-auditor'));

  // Every agent must have default-deny tool policy (isAvailable: false for external side effects)
  for (const agent of REGISTERED_AGENTS) {
    assert.equal(agent.permissions.performExternalSideEffects, false);
  }
});

test('DAG Validator — Detects dependency cycles, invalid IDs, and missing dependencies', () => {
  // Valid sequential plan
  const validGraph = validatePlanGraph({
    steps: [
      { id: 'step-1', agentId: 'research-agent', dependsOn: [] },
      { id: 'step-2', agentId: 'verification-agent', dependsOn: ['step-1'] }
    ] as any
  });
  assert.equal(validGraph.valid, true);

  // Invalid unregistered agent ID
  const invalidAgentGraph = validatePlanGraph({
    steps: [
      { id: 'step-1', agentId: 'hacker-bot-9000', dependsOn: [] }
    ] as any
  });
  assert.equal(invalidAgentGraph.valid, false);
  assert.ok(invalidAgentGraph.errors.some(e => e.includes('unregistered agent')));

  // Missing dependency ID
  const missingDepGraph = validatePlanGraph({
    steps: [
      { id: 'step-1', agentId: 'research-agent', dependsOn: ['nonexistent-step'] }
    ] as any
  });
  assert.equal(missingDepGraph.valid, false);
  assert.ok(missingDepGraph.errors.some(e => e.includes('non-existent step')));
});
