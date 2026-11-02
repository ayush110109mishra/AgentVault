import { Agent } from './types';

export const REGISTERED_AGENTS: Agent[] = [
  {
    id: 'research-agent',
    name: 'Research Agent',
    version: '1.2.0',
    role: 'Information Gathering & Synthesis',
    description: 'Extracts relevant information from provided contexts, breaks topics into structured components, and separates verified facts from assumptions.',
    capabilities: ['Source analysis', 'Evidence extraction', 'Topic decomposition', 'Fact vs assumption separation'],
    supportedInputTypes: ['text/plain', 'text/markdown', 'application/json', 'url_references'],
    expectedOutput: 'Structured research findings with explicit claims, identified unknowns, and contextual references.',
    availableTools: [
      { name: 'Document Parser', description: 'Parses raw text, user transcripts, and supplied notes', isAvailable: true, category: 'read' },
      { name: 'Live Web Search', description: 'Real-time search engine integration', isAvailable: false, category: 'external' },
      { name: 'Evidence Normalizer', description: 'Structures quotes and claim tags', isAvailable: true, category: 'compute' }
    ],
    permissions: {
      readSuppliedInputs: true,
      analyzeData: false,
      generateText: true,
      useConfiguredExternalTools: false,
      performExternalSideEffects: false,
      scopeList: ['input:read', 'text:generate']
    },
    riskProfile: 'low',
    systemInstruction: 'You are a research analyst. Extract relevant information from the material actually provided to you. Separate facts, assumptions, and unknowns. Preserve source references when available. Never invent citations or claim to have accessed external live web sources that were not provided. Structure your output clearly into Key Findings, Core Claims, and Open Questions/Unknowns.',
    isLocallyRegistered: true,
    externalIdentityVerified: false
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    version: '1.4.0',
    role: 'Quantitative Analysis & Trend Detection',
    description: 'Inspects structured datasets, evaluates statistical metrics, detects trends, identifies outliers, and produces actionable quantitative insights.',
    capabilities: ['CSV & JSON analysis', 'Descriptive statistics', 'Trend detection', 'Anomaly identification', 'Caveat documentation'],
    supportedInputTypes: ['text/csv', 'application/json', 'tabular_summary'],
    expectedOutput: 'Computed metric summaries, highlighted data trends, detected anomalies, and data hygiene caveats.',
    availableTools: [
      { name: 'Deterministic Math Engine', description: 'Calculates mean, median, min, max, stdDev programmatically', isAvailable: true, category: 'compute' },
      { name: 'Anomaly Scanner', description: 'Identifies standard deviation outliers and malformed cells', isAvailable: true, category: 'compute' },
      { name: 'External Database Query', description: 'Direct SQL execution to remote warehouse', isAvailable: false, category: 'external' }
    ],
    permissions: {
      readSuppliedInputs: true,
      analyzeData: true,
      generateText: true,
      useConfiguredExternalTools: false,
      performExternalSideEffects: false,
      scopeList: ['input:read', 'data:analyze', 'text:generate']
    },
    riskProfile: 'low',
    systemInstruction: 'You are a senior data analyst. You review computed statistical summaries and tabular observations. Base all conclusions strictly on supplied numbers. Never invent numerical metrics or claim trends not present in the data. Clearly state data limitations, sample sizes, and caveats.',
    isLocallyRegistered: true,
    externalIdentityVerified: false
  },
  {
    id: 'verification-agent',
    name: 'Verification Agent',
    version: '2.0.1',
    role: 'Evidence Verification & Schema Audit',
    description: 'Audits upstream claims against supplied evidence, flags unsupported assumptions, checks logical consistency, and enforces schema integrity.',
    capabilities: ['Schema validation', 'Consistency checks', 'Claim-to-evidence verification', 'Logical fallacy detection', 'Risk flagging'],
    supportedInputTypes: ['application/json', 'agent_output', 'text/markdown'],
    expectedOutput: 'Structured verification report with check lists, flagged unsupported claims, warnings, and confidence caveats.',
    availableTools: [
      { name: 'Schema Validator', description: 'Enforces JSON structure and required keys', isAvailable: true, category: 'verify' },
      { name: 'Claim Grounding Verifier', description: 'Compares assertions against upstream facts', isAvailable: true, category: 'verify' },
      { name: 'External Fact Checker API', description: 'Third-party fact checking oracle', isAvailable: false, category: 'external' }
    ],
    permissions: {
      readSuppliedInputs: true,
      analyzeData: false,
      generateText: true,
      useConfiguredExternalTools: false,
      performExternalSideEffects: false,
      scopeList: ['input:read', 'output:verify', 'text:generate']
    },
    riskProfile: 'low',
    systemInstruction: 'You are a verification specialist. Check supplied claims against supplied evidence from upstream agents. Identify unsupported claims, contradictions, missing fields, and uncertainty. Do not treat model confidence as evidence. Return a rigorous structured evaluation highlighting what is verified, what is an ungrounded inference, and what remains unknown.',
    isLocallyRegistered: true,
    externalIdentityVerified: false
  },
  {
    id: 'writer-agent',
    name: 'Writer Agent',
    version: '1.3.0',
    role: 'Executive Report Synthesis',
    description: 'Synthesizes upstream findings and verified claims into clear, cohesive, executive-grade documentation without introducing hallucinated data.',
    capabilities: ['Executive summarization', 'Technical report generation', 'Markdown structuring', 'Actionable recommendation synthesis'],
    supportedInputTypes: ['multi_agent_outputs', 'application/json', 'text/markdown'],
    expectedOutput: 'Comprehensive, structured executive report with summary, thematic sections, caveats, and next steps.',
    availableTools: [
      { name: 'Document Formatter', description: 'Generates structured markdown and headings', isAvailable: true, category: 'synthesis' },
      { name: 'Email Sender', description: 'Dispatches finalized report to external recipients', isAvailable: false, category: 'external' }
    ],
    permissions: {
      readSuppliedInputs: true,
      analyzeData: false,
      generateText: true,
      useConfiguredExternalTools: false,
      performExternalSideEffects: false,
      scopeList: ['input:read', 'text:generate']
    },
    riskProfile: 'low',
    systemInstruction: 'You are an executive technical writer. Create a concise, useful report using only the supplied upstream results. Preserve material caveats, verification warnings, and uncertainty. Do not fabricate statistics, source references, or execution results. Organize with clear sections: Executive Summary, Key Findings, Verified Evidence, and Strategic Implications.',
    isLocallyRegistered: true,
    externalIdentityVerified: false
  },
  {
    id: 'code-review-agent',
    name: 'Code Review Agent',
    version: '1.1.0',
    role: 'Static Code Inspection & Defect Analysis',
    description: 'Inspects code snippets for architectural defects, bad practices, performance bottlenecks, and code smell, referencing specific line patterns.',
    capabilities: ['Static syntax inspection', 'Defect identification', 'Maintainability review', 'Performance analysis', 'Remediation guidance'],
    supportedInputTypes: ['text/x-typescript', 'text/x-javascript', 'text/x-python', 'text/plain'],
    expectedOutput: 'Prioritized code review findings with severity, line references, explanation, and corrected code snippets.',
    availableTools: [
      { name: 'AST Pattern Matcher', description: 'Examines code patterns and syntax trees', isAvailable: true, category: 'compute' },
      { name: 'Sandboxed Code Runner', description: 'Executes untrusted code in an isolated container', isAvailable: false, category: 'external' }
    ],
    permissions: {
      readSuppliedInputs: true,
      analyzeData: false,
      generateText: true,
      useConfiguredExternalTools: false,
      performExternalSideEffects: false,
      scopeList: ['input:read', 'code:inspect', 'text:generate']
    },
    riskProfile: 'medium',
    systemInstruction: 'You are a principal software engineer performing static code review. Review supplied code for defects, anti-patterns, and maintainability concerns. Reference specific code lines or constructs where possible. Never claim the code was executed or run in a sandbox; state clearly that this is static textual inspection. Provide actionable, high-quality code fixes.',
    isLocallyRegistered: true,
    externalIdentityVerified: false
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    version: '1.5.0',
    role: 'Threat Modeling & Vulnerability Audit',
    description: 'Evaluates permission boundaries, credential exposure, injection vulnerabilities, OWASP Top 10 risks, and recommends security hardening.',
    capabilities: ['OWASP Top 10 auditing', 'Permission boundary review', 'Secret leakage detection', 'Threat modeling', 'Hardening advice'],
    supportedInputTypes: ['text/plain', 'source_code', 'policy_document'],
    expectedOutput: 'Structured security vulnerability audit with CVE/OWASP references, risk ratings, proof of concept analysis, and defense-in-depth steps.',
    availableTools: [
      { name: 'Vulnerability Pattern Engine', description: 'Matches known vulnerability signatures in logic', isAvailable: true, category: 'verify' },
      { name: 'Active Penetration Tester', description: 'Executes active network attacks or exploit payloads', isAvailable: false, category: 'external' }
    ],
    permissions: {
      readSuppliedInputs: true,
      analyzeData: false,
      generateText: true,
      useConfiguredExternalTools: false,
      performExternalSideEffects: false,
      scopeList: ['input:read', 'security:audit', 'text:generate']
    },
    riskProfile: 'medium',
    systemInstruction: 'You are an application security specialist. Analyze the supplied code or architecture for vulnerabilities, injection vectors, authorization flaws, and policy oversights. Distinguish confirmed vulnerabilities from potential risks requiring contextual verification. State clearly that no dynamic penetration testing was conducted.',
    isLocallyRegistered: true,
    externalIdentityVerified: false
  }
];

export function getAgentById(id: string): Agent | undefined {
  return REGISTERED_AGENTS.find(a => a.id === id);
}

export function getAgentsByCapability(capability: string): Agent[] {
  const q = capability.toLowerCase();
  return REGISTERED_AGENTS.filter(a => 
    a.capabilities.some(c => c.toLowerCase().includes(q)) ||
    a.name.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q)
  );
}
