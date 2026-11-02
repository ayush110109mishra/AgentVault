process.env.NODE_ENV = 'test';
process.env.TEST = '1';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../server';

let server: http.Server;
let baseUrl: string;

before(async () => {
  server = http.createServer(app);
  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address() as any;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

test('Server Endpoints — /api/health reports open-weight engine readiness and registered agents', async () => {
  const res = await fetch(`${baseUrl}/api/health`, { method: 'GET' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.registeredAgentsCount, 6);
  assert.ok(typeof data.activeProvider === 'string');
  assert.ok(typeof data.model === 'string');
  assert.ok(typeof data.isOpenWeight === 'boolean');
});

test('Server Endpoints — /api/model-status returns provider info and licensing', async () => {
  const res = await fetch(`${baseUrl}/api/model-status`, { method: 'GET' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.provider);
  assert.ok(data.model);
  assert.ok(data.license);
  assert.ok(['connected', 'offline', 'unconfigured', 'error'].includes(data.status));
});

test('Server Validation — /api/plan rejects missing or empty goals with 400 Bad Request', async () => {
  const emptyRes = await fetch(`${baseUrl}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal: '' })
  });
  assert.equal(emptyRes.status, 400);
  const emptyData = await emptyRes.json();
  assert.ok(emptyData.error.includes('Goal is required'));

  const missingRes = await fetch(`${baseUrl}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(missingRes.status, 400);
});

test('Server Endpoints — /api/plan generates structured DAG with verification agent included', async () => {
  const res = await fetch(`${baseUrl}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal: 'Examine sales trend anomalies in Q3 dataset' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.plan);
  assert.equal(data.plan.taskType, 'data_analysis');
  assert.ok(data.plan.steps.length >= 2);

  // Must include verification agent step
  const hasVerifier = data.plan.steps.some((s: any) => s.agentId === 'verification-agent');
  assert.ok(hasVerifier, 'Plan must include verification-agent step');
});

test('Server Validation — /api/execute-step rejects unregistered agent ID with 400 Bad Request', async () => {
  const res = await fetch(`${baseUrl}/api/execute-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: 'step-1',
      agentId: 'unregistered-rogue-agent',
      goal: 'Attempt unauthorized access',
      stepTitle: 'Unauthorized Action',
      stepDescription: 'Run malicious payload'
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('Unregistered agent ID'));
});

test('Server Security Gate — /api/execute-step blocks approval-gated steps when approvalGranted is false', async () => {
  const res = await fetch(`${baseUrl}/api/execute-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: 'step-1',
      agentId: 'code-review-agent', // Requires approval according to policy
      goal: 'Audit server code for vulnerabilities',
      stepTitle: 'Static Code & Defect Analysis',
      stepDescription: 'Analyze code',
      stepInput: { code: 'const x = eval("1+1");' },
      approvalGranted: false // Human approval withheld!
    })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.ok(data.error.includes('Approval Gate Violation'));
  assert.equal(data.requiresApproval, true);
});

test('Server Security Gate — /api/execute-step blocks undeclared tools via default-deny', async () => {
  const res = await fetch(`${baseUrl}/api/execute-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: 'step-1',
      agentId: 'research-agent',
      goal: 'Query external database',
      stepTitle: 'Unauthorized Tool Request',
      stepDescription: 'Attempt to execute remote database query',
      stepInput: {},
      requestedTools: ['Undeclared Superuser Tool'],
      approvalGranted: true
    })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.ok(data.error.includes('Security Violation: Agent "Research Agent" requested undeclared tool'));
});

test('Server Security Gate — /api/execute-step successfully runs when human approval is granted', async () => {
  const res = await fetch(`${baseUrl}/api/execute-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: 'step-1',
      agentId: 'code-review-agent',
      goal: 'Audit express server handlers',
      stepTitle: 'Static Code & Defect Analysis',
      stepDescription: 'Analyze code',
      stepInput: { code: 'const a = 1; if (a == 1) { eval("alert(1)"); }' },
      approvalGranted: true // Explicitly granted!
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.output.findings.length > 0);
  assert.ok(data.output.qualityScore > 0);
});

test('Server Verification — /api/verify-step identifies schema failures, ungrounded claims, and hallucinated URLs', async () => {
  // 1. Empty output check failure
  const emptyRes = await fetch(`${baseUrl}/api/verify-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: 'step-1',
      agentId: 'research-agent',
      agentOutput: {}
    })
  });
  assert.equal(emptyRes.status, 200);
  const emptyData = await emptyRes.json();
  assert.equal(emptyData.validation.status, 'failed');

  // 2. Ungrounded financial guarantee claim flagged as warning
  const ungroundedRes = await fetch(`${baseUrl}/api/verify-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: 'step-2',
      agentId: 'writer-agent',
      agentOutput: { statement: 'This strategy offers a guaranteed ROI with zero risk' },
      upstreamOutputs: { 'step-1': { data: [10, 20] } }
    })
  });
  assert.equal(ungroundedRes.status, 200);
  const ungroundedData = await ungroundedRes.json();
  assert.equal(ungroundedData.validation.status, 'warning');
  assert.ok(ungroundedData.validation.unverifiedClaims.length > 0);

  // 3. Hallucinated external URL flagged as warning
  const urlRes = await fetch(`${baseUrl}/api/verify-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: 'step-3',
      agentId: 'research-agent',
      agentOutput: { source: 'Found live on https://random-external-site.com/data' },
      upstreamOutputs: { 'step-1': { query: 'test' } }
    })
  });
  assert.equal(urlRes.status, 200);
  const urlData = await urlRes.json();
  assert.equal(urlData.validation.status, 'warning');
  assert.ok(urlData.validation.warnings.length > 0);

  // 4. Valid verified output passes cleanly
  const validRes = await fetch(`${baseUrl}/api/verify-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: 'step-4',
      agentId: 'research-agent',
      agentOutput: { keyFindings: ['Verified claim grounded in data'] },
      upstreamOutputs: { 'step-0': { data: [1, 2, 3] } }
    })
  });
  assert.equal(validRes.status, 200);
  const validData = await validRes.json();
  assert.equal(validData.validation.status, 'passed');
});

test('Server Synthesis — /api/synthesize produces structured executive brief from step outputs', async () => {
  const res = await fetch(`${baseUrl}/api/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goal: 'Produce verified brief on platform security',
      steps: [
        {
          id: 'step-1',
          agentId: 'security-auditor',
          title: 'Threat Modeling & Vulnerability Audit',
          status: 'completed',
          output: { threatLevel: 'LOW', summary: 'Zero critical vulnerabilities' },
          validation: { status: 'passed', warnings: [] }
        }
      ]
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.summary);
  assert.ok(data.sections.length > 0);
  assert.equal(data.validationOverview.totalSteps, 1);
});
