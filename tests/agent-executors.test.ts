import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeCodeForReview,
  auditCodeSecurity,
  computeRealStatistics
} from '../src/domain/agent-executors';

test('Agent Executors — Code Review Agent detects real static defects & anti-patterns', () => {
  const sampleInsecureCode = `
    const token = req.query.token;
    if (token == 123) {
      eval("process(" + token + ")");
    }
    fetchData().then(data => console.log(data));
    function doSomething(input: any) {
      return input;
    }
  `;

  const review = analyzeCodeForReview(sampleInsecureCode);
  assert.ok(review.findings.length >= 3);

  // Checks dynamic eval detection
  const evalFinding = review.findings.find(f => f.category === 'Code Injection');
  assert.ok(evalFinding);
  assert.equal(evalFinding.severity, 'HIGH');
  assert.ok(evalFinding.recommendation.length > 0);

  // Checks loose equality
  const eqFinding = review.findings.find(f => f.category === 'Type Safety');
  assert.ok(eqFinding);

  // Checks unhandled promise chain
  const promiseFinding = review.findings.find(f => f.category === 'Async Resilience');
  assert.ok(promiseFinding);

  // Score is reduced appropriately
  assert.ok(review.qualityScore < 70);
});

test('Agent Executors — Clean code produces zero critical findings and high quality score', () => {
  const cleanCode = `
    export function calculateSum(a: number, b: number): number {
      if (a === b) {
        return a * 2;
      }
      return a + b;
    }
  `;

  const review = analyzeCodeForReview(cleanCode);
  assert.equal(review.findings.length, 0);
  assert.equal(review.qualityScore, 100);

  const securityAudit = auditCodeSecurity(cleanCode);
  assert.equal(securityAudit.vulnerabilities.length, 0);
  assert.equal(securityAudit.threatLevel, 'LOW');
  assert.ok(securityAudit.passedOwaspChecks.length > 0);
});

test('Agent Executors — Security Auditor flags injection vulnerabilities and secrets', () => {
  const vulnerableAppCode = `
    const apiKey = "sk_live_938102938102938120";
    const userQuery = "SELECT * FROM users WHERE id = '" + req.query.id + "'";
    const cmd = "ping " + req.query.host;
    child_process.exec(cmd);
    const link = "http://api.external-service.com/data";
  `;

  const audit = auditCodeSecurity(vulnerableAppCode);
  assert.ok(audit.vulnerabilities.length >= 3);
  assert.equal(audit.threatLevel, 'CRITICAL');

  // SQL Injection check
  const sqlVuln = audit.vulnerabilities.find(v => v.cwe === 'CWE-89');
  assert.ok(sqlVuln);
  assert.equal(sqlVuln.severity, 'CRITICAL');
  assert.ok(sqlVuln.remediation.includes('parameterized queries'));

  // Command Injection check
  const cmdVuln = audit.vulnerabilities.find(v => v.cwe === 'CWE-78');
  assert.ok(cmdVuln);
  assert.equal(cmdVuln.severity, 'CRITICAL');

  // Secret leak check
  const secretVuln = audit.vulnerabilities.find(v => v.cwe === 'CWE-798');
  assert.ok(secretVuln);
  assert.equal(secretVuln.severity, 'HIGH');
});

test('Agent Executors — Data Analyst computes exact statistical metrics', () => {
  const sampleValues = [10, 20, 30, 40, 50];
  const stats = computeRealStatistics(sampleValues);

  assert.equal(stats.count, 5);
  assert.equal(stats.min, 10);
  assert.equal(stats.max, 50);
  assert.equal(stats.mean, 30);
  assert.equal(stats.median, 30);
  assert.equal(stats.stdDev, 14.14); // sqrt(200) ≈ 14.142

  // Empty array handling
  const emptyStats = computeRealStatistics([]);
  assert.equal(emptyStats.count, 0);
  assert.equal(emptyStats.mean, 0);
});
