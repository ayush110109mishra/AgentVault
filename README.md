# AgentVault X

> **Voice-Controlled, Trust-Aware Multi-Agent Execution Platform powered by Open-Weight AI.**  
> Orchestrate, supervise, and audit specialized autonomous AI agents through one deterministic, policy-guarded execution layer.

---

## 🌟 Overview & Hackathon Compliance

AgentVault X is an open-source multi-agent orchestration and governance platform built to deliver **provably safe, auditable agent workflows**. It addresses the critical reliability and safety gaps in modern AI agent deployments:

1. **Native Open-Weight AI Architecture**: Designed natively around open-weight models (primarily **Google Gemma 2** via local **Ollama** or hosted **OpenAI-compatible endpoints** such as Groq, vLLM, and Hugging Face). It features a dedicated multi-provider inference abstraction layer with an air-gapped deterministic safe engine fallback.
2. **Deterministic Security & Policy Gates**: Unlike systems that give LLMs unconstrained tool execution, AgentVault X enforces **strict Role-Based Access Control (RBAC)**, **default-deny tool permissions**, and **Human-in-the-Loop (HITL) approval gates** before any mutating, code-inspecting, or high-risk task can execute.
3. **Meaningful, Testable Agent Workflows**: Agents do not emit canned mock responses. The platform includes genuine domain executors for static code analysis, OWASP Top 10 vulnerability scanning, descriptive CSV/tabular statistics, claim-to-evidence cross-verification, and executive synthesis.
4. **Zero Secrets in Frontend**: All credentials, model endpoints, and API calls are strictly quarantined on the server side via environment variables.

---

## 🏗️ System Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    AGENTVAULT X UI                     │
                               │  Command Center | Catalog | Runs | Trust | Logs | CSV  │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ (Voice Intent / Text Input)
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │             EXPRESS CONTROL PLANE (server.ts)          │
                               │                                                        │
                               │  1. /api/plan (DAG Topology & Risk Classification)     │
                               │  2. /api/execute-step (Server-Side RBAC Enforcement)   │
                               │  3. /api/verify-step (Schema & Evidence Grounding)     │
                               │  4. /api/synthesize (Unified Executive Briefing)       │
                               └───────────┬────────────────────────────────┬───────────┘
                                           │                                │
            ┌──────────────────────────────┴──────────────┐                 │
            ▼                                             ▼                 ▼
┌──────────────────────────────┐            ┌───────────────────────────┐ ┌──────────────────────────┐
│  OPEN-WEIGHT MODEL PROVIDER  │            │  DETERMINISTIC SECURITY   │ │  GENUINE DOMAIN AGENTS   │
│  - Ollama (Local Gemma 2)    │            │  - Default-Deny Tools     │ │  - Code Review Analyzer  │
│  - Hosted (Groq/vLLM/HF)     │            │  - HITL Approval Gates    │ │  - Security OWASP Audit  │
│  - Gemini (Optional)         │            │  - Risk Categorization    │ │  - Descriptive Statistics│
│  - Air-Gapped Safe Fallback  │            │  - DAG Cycle Detection    │ │  - Claim Verification    │
└──────────────────────────────┘            └───────────────────────────┘ └──────────────────────────┘
```

---

## 🤖 Registered Specialized Agents

| Agent ID | Declared Role | Risk Profile | Permitted Tools | Core Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| `research-agent` | Information Gathering | Low | Document Parser, Evidence Normalizer | Structured topic findings & assumptions |
| `data-analyst` | Quantitative Analysis | Low / Medium | Deterministic Math Engine, Anomaly Scanner | Mean, median, stdDev, detected outliers |
| `verification-agent`| Evidence & Grounding Audit | Low | Schema Validator, Claim Grounding Verifier | Evidence cross-reference matrix |
| `writer-agent` | Executive Synthesis | Low | Document Formatter | Polished executive brief in Markdown |
| `code-review-agent` | Static Defect Analysis | Medium | AST Heuristic Engine, Anti-Pattern Scanner | Line-referenced findings & refactorings |
| `security-auditor` | Threat Modeling & OWASP | Medium / High | Vulnerability Scanner, Secret Leak Hunter | CWE / OWASP Top 10 security ratings |

*Note: All external mutation tools (such as live SQL databases, web scraping bots, and email senders) are set to `isAvailable: false` under the active sandbox profile to guarantee containment.*

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Node.js**: v20+ (tested on Node v24.14.1)
- **npm**: v10+

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/ayush110109mishra/agentvault-x.git
cd agentvault-x
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your preferred open-weight model provider:

#### Option A: Local Open-Weight Inference via Ollama (Zero API Keys Required)
1. Install [Ollama](https://ollama.com).
2. Pull and start Google Gemma 2:
   ```bash
   ollama run gemma2:9b
   ```
   *(Or `ollama run gemma2:2b` for lightweight machines)*.
3. In your `.env`:
   ```env
   MODEL_PROVIDER="ollama"
   OLLAMA_BASE_URL="http://127.0.0.1:11434"
   OLLAMA_MODEL="gemma2:9b"
   ```

#### Option B: Hosted Open-Weight Endpoint (Groq / vLLM / Hugging Face / OpenRouter)
In your `.env`:
```env
MODEL_PROVIDER="open-weight"
OPEN_WEIGHT_API_URL="https://api.groq.com/openai/v1"
OPEN_WEIGHT_API_KEY="your-groq-api-key"
OPEN_WEIGHT_MODEL="gemma2-9b-it"
```

#### Option C: Air-Gapped / Offline Deterministic Mode
If no remote provider or Ollama instance is detected, AgentVault X automatically operates in **Air-Gapped Safe Mode**, utilizing its built-in deterministic planning and domain executors without external network dependency.

### 3. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 🧪 Automated Testing

AgentVault X includes comprehensive unit and integration tests covering the model provider, deterministic policy rules, server security gates, agent executors, and CSV analytics.

Run the test suite:
```bash
npm test
```

### Verified Test Results (19/19 Passing)
```
✔ Agent Executors — Code Review Agent detects real static defects & anti-patterns
✔ Agent Executors — Security Auditor flags injection vulnerabilities and secrets
✔ Agent Executors — Data Analyst computes exact statistical metrics
✔ CSV Analyzer — parseCsv parses RFC-compliant quoted CSV with newlines & commas
✔ CSV Analyzer — analyzeCsvData produces descriptive statistics and markdown summary
✔ Model Provider — extractJsonFromText parses clean and markdown-wrapped JSON
✔ Model Provider — getProviderConfiguration defaults to Open-Weight / Ollama / Guarded Engine
✔ Model Provider — checkActiveProviderHealth reports valid provider info and open-weight license
✔ Policy Evaluator — Enforces human approval on security audit and code review
✔ Policy Evaluator — Enforces default-deny on undeclared or unavailable tools
✔ Policy Evaluator — Detects dangerous mutations and elevates risk to high
✔ Policy Evaluator — Registered Agent Registry Integrity
✔ DAG Validator — Detects dependency cycles, invalid IDs, and missing dependencies
✔ Server Endpoints — /api/health reports open-weight engine readiness and registered agents
✔ Server Endpoints — /api/plan generates structured DAG with verification agent included
✔ Server Security Gate — /api/execute-step blocks approval-gated steps when approvalGranted is false
✔ Server Security Gate — /api/execute-step blocks undeclared tools via default-deny
✔ Server Security Gate — /api/execute-step successfully runs when human approval is granted
✔ Server Verification — /api/verify-step performs real schema and grounding checks
```

---

## 🔒 Security & Guardrail Enforcement

1. **Server-Side Approval Gates**: When a step involves medium or high risk (e.g. security audits, static code analysis, or database operations), the backend rejects unapproved execution attempts with `403 Forbidden` (`Approval Gate Violation`).
2. **Default-Deny Tool RBAC**: Any request by an agent to access undeclared tools or tools marked unavailable is blocked at the API gateway.
3. **DAG Integrity Validation**: Multi-agent pipelines are validated against cycles, missing dependencies, and unregistered agent IDs prior to execution.
4. **Factual Verification Audits**: The Verification Agent cross-examines outputs against upstream evidence, flags ungrounded claims, and detects schema violations.

---

## 📄 Licensing & Open-Weight Terms

- **Platform Source Code**: Licensed under the OSI-approved **[Apache License 2.0](LICENSE)**.
- **Model Weights & Inference Terms**:
  - Google Gemma models are governed separately by the **[Gemma Terms of Use](https://ai.google.dev/gemma/terms)**.
  - The repository's open-source license applies strictly to the application code, control plane, and orchestration logic.

---

## 👥 Contributors & Hackathon Submission
Developed for the Open-Weight AI & Multi-Agent Hackathon.
