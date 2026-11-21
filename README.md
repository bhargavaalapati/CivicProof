# CivicProof — Independent Civic Complaint Evidence Workspace

> **A complaint marked "Resolved" does not necessarily mean the problem is fixed.**
>
> CivicProof is an independent citizen evidence workspace that bridges the gap between *administrative closure* and *evidence-backed civic resolution*.

<p align="center">
  <img src="https://img.shields.io/badge/Project-In%20Progress-orange?style=for-the-badge" alt="Project In Progress" />
  <img src="https://img.shields.io/badge/Stage-MVP-blue?style=for-the-badge" alt="MVP" />
  <img src="https://img.shields.io/badge/Hackathon-IDEA%2F%2FFORGE-8A63D2?style=for-the-badge" alt="IDEA FORGE Hackathon" />
  <img src="https://img.shields.io/badge/Track-Civic%20Pulse-0D9488?style=for-the-badge" alt="Civic Pulse" />
</p>

<p align="center">
  <a href="/demo">
    <img src="https://img.shields.io/badge/TRY%20DEMO-/demo-2563EB?style=for-the-badge" alt="Try Demo" />
  </a>
  <img src="https://img.shields.io/badge/Pilot-GVMC%20Ward%2018-64748B?style=for-the-badge" alt="GVMC Ward 18 Pilot" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-UI-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/AI%20SDK-Vercel-black?logo=vercel" alt="Vercel AI SDK" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

**IDEA//FORGE Online Hackathon · Track 1 — Civic Pulse, Digital Governance & Public Information**

> [!IMPORTANT]
> **Sprint & Git History Note**
>
> During rapid development under hackathon time pressure, sprint-wise changes were not consistently separated into individual Git commits. Consequently, the earlier sprint progression may not be fully visible in the Git history.
>
> Starting with this commit, each sprint will have its own commit message to make future development, iteration, and progress easier to track.
>
> Thank you for your understanding!

> [!NOTE]
> **Development Status:** CivicProof is an evolving MVP, not a production-ready application. Weekly improvements are ongoing across the user experience, assessment pipeline, reliability, and architecture. Features and workflows may evolve with each iteration.

---

## 1. The Problem

A municipal complaint may be marked **"Resolved"** even when the reported issue has not been adequately fixed.

Consider a few situations:

- A pothole remains visible after a complaint closure update.
- An overflowing garbage site is photographed from a different angle.
- Poor lighting or framing makes before-and-after comparisons unreliable.
- Citizens have no structured way to challenge an unsupported closure.

The missing link is between **administrative closure and evidence-backed resolution**.

### The CivicProof Approach

CivicProof complements existing civic reporting channels through a structured evidence-verification workflow.

1. **Capture Evidence** — Submit a civic issue with its location and a Before photograph.
2. **Compare Evidence** — Add an After photograph when a repair or closure is reported.
3. **Review AI Observations** — Examine visual observations, uncertainty, and limitations.
4. **Make the Decision** — Confirm, dispute, or request a clearer photograph.
5. **Generate Evidence** — Export a factual PDF evidence packet or share a privacy-safe public view.

**Core principle:** AI can assist with evidence review, but it cannot independently decide that a civic complaint has been resolved on behalf of a citizen.

---

## 2. MVP Scope

| Area | Current scope |
|---|---|
| Pilot locality | GVMC Ward 18 — MVP Colony, Visakhapatnam |
| Geographic scope | Approximately 17.732–17.752 latitude, 83.325–83.348 longitude |
| Issue categories | Potholes and garbage |
| Public demonstration | `/demo` |
| Authenticated workspace | `/reports` |
| Evidence workflow | Before-and-after photographs |
| AI workflow | Two-stage multimodal assessment |
| Citizen control | Confirm, dispute, or request a clearer photo |
| Export | Reproducible PDF evidence packet |
| Public access | Privacy-safe report view |

The pilot intentionally focuses on a limited locality and two issue categories. This keeps the initial implementation focused and testable rather than implying city-wide coverage.

---

## 3. System Architecture

```text
                    CIVICPROOF
                        |
                        v
               Next.js App Router
                        |
          +-------------+-------------+
          |                           |
     Public Routes              Protected Routes
          |                           |
        /demo                     /reports
   /public/reports/[id]        /reports/new
                               /reports/[id]
                               /reports/[id]/export
          |                           |
          +-------------+-------------+
                        |
                        v
              Server Route Handlers
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      Media Safety  AI Assessment  Domain Workflow
       Pipeline       Pipeline       & Policies
          |             |             |
          +-------------+-------------+
                        |
                        v
                    Supabase
          +-------------+-------------+
          |             |             |
         Auth       PostgreSQL   Private Storage
                    + RLS           Bucket
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router, React |
| Styling | Tailwind CSS |
| UI and motion | GSAP, Lenis |
| Typography | Plus Jakarta Sans, Instrument Serif, JetBrains Mono |
| Backend | Next.js Server Route Handlers |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth — Email/Password and Google OAuth |
| File storage | Private Supabase Storage |
| Image processing | Sharp |
| AI integration | Google GenAI SDK, Vercel AI SDK |
| AI models | `gemini-decision-1`, `gemini-2.5-flash` |
| Validation | Zod |
| Evidence integrity | SHA-256 hashing |

### Assessment Pipeline

The current implementation uses a **two-stage multimodal AI workflow**, supported by deterministic TypeScript policies.

#### Stage 1 — Decision & Triage

`gemini-decision-1` evaluates five atomic questions:

- Is the image a civic scene?
- Is visible personal information present?
- What issue category is represented?
- Are the Before and After images likely from the same location?
- What visible change, if any, can be observed?

The application applies additional policy checks, including a `0.7` confidence floor and a comparability lock based on a three-level location-comparability rubric.

#### Stage 2 — Evidence Observations

`gemini-2.5-flash`, integrated through the Vercel AI SDK, generates image-specific observations and limitations.

Results are validated against the strict `EvidenceAssessmentContractSchema` Zod contract.

The application does not treat model output as an authoritative resolution decision. In particular, an improvement assessment is restricted when the location-comparability requirement is not satisfied.

### State Separation

CivicProof maintains three independent workflow concepts:

| State | Responsibility |
|---|---|
| `external_status` | Status reported by an external complaint channel |
| `assessment_status` | Processing state of the AI evidence assessment |
| `citizen_review` | The report owner's decision |

AI assessments and external portal statuses cannot modify `citizen_review`.

This separation prevents automated assessment from silently becoming a citizen's decision.

---

## 4. Evaluation & Reliability

CivicProof is designed to evaluate evidence cautiously rather than generate an impressive-looking AI verdict.

| Evaluation area | What is checked |
|---|---|
| Scene validation | Whether the image represents a relevant civic scene |
| Category recognition | Whether the issue matches supported categories |
| PII detection | Whether visible personal information requires additional privacy protection |
| Scene comparability | Whether Before and After photographs are sufficiently comparable |
| Visible change | Whether an observable change can be described |
| Output validity | Whether AI output satisfies the Zod contract |
| Policy enforcement | Whether confidence and comparability restrictions are applied |
| Citizen control | Whether only the report owner can record the citizen review decision |

### Reliability Principles

1. **No unsupported certainty:** AI output is provisional and includes limitations.
2. **Comparability before improvement:** A claimed improvement must satisfy the location-comparability policy.
3. **Fail safely:** Provider errors should not destroy uploaded evidence.
4. **Human decision remains authoritative:** The report owner controls the final citizen review.
5. **No fabricated performance claims:** Model confidence is not presented as measured accuracy.

### Current Evaluation Limitations

The MVP has a constrained pilot scope. A larger independently labelled image dataset, systematic model benchmarking, broader locality testing, and ongoing false-positive and false-negative analysis are still required before making production-level accuracy or reliability claims.

---

## 5. Architecture Evolution: From LLM Calls to Agentic Workflows

CivicProof is being developed incrementally.

### Current Foundation — LLM-Assisted Assessment

The current implementation uses model calls for image understanding and evidence observations, with deterministic application logic enforcing business rules.

This establishes a controlled foundation for the workflow.

### Next Direction — Constrained Agentic Architecture

The planned evolution is toward specialised, tool-enabled agents that can support bounded tasks such as:

- Evidence intake and validation assistance.
- Structured comparison and follow-up research.
- Policy-aware assessment orchestration.
- Evidence packet preparation.
- Workflow recommendations based on report state.

The transition is not simply from one model to another. It is from **basic LLM API calls and application-level decisions toward coordinated, auditable agentic workflows**.

Any future agent capabilities must retain strict boundaries:

- No autonomous complaint closure.
- No direct modification of citizen review decisions.
- No unrestricted database or storage access.
- Explicit validation before state-changing operations.
- Traceable actions and human oversight.

These are development directions, not claims that a fully autonomous agent system is already implemented.

---

## 6. Known Limitations

CivicProof is an MVP under active development.

Current limitations include:

- The pilot is restricted to GVMC Ward 18 — MVP Colony.
- Only pothole and garbage reports are supported.
- Image comparison cannot independently authenticate the exact capture time or prove that a repair occurred.
- Differences in lighting, angle, framing, weather, and obstruction can affect AI observations.
- AI-generated observations may be incomplete or incorrect.
- The application does not currently represent an official integration with GVMC or any municipal authority.
- Public coordinate rounding reduces location precision but does not guarantee complete anonymity.
- The current assessment architecture is not yet a fully agentic system.
- Production deployment requires broader testing, monitoring, and security review.

**Development Status:** Weekly improvements are ongoing. The implementation, architecture, and user experience will continue to evolve based on testing and feedback.

---

## 7. Originality & Credits

CivicProof is an independently developed hackathon project focused on the gap between complaint closure and evidence-backed civic resolution.

The application workflow, evidence-review approach, citizen-review separation, and supporting integrations are developed as part of this project.

The project builds on the following third-party technologies and services:

- **Google Gemini / Google GenAI** — Multimodal AI assessment.
- **Vercel AI SDK** — Model integration and structured output generation.
- **Supabase** — Authentication, PostgreSQL, Row Level Security, and private storage.
- **Next.js and React** — Application framework and interface.
- **Tailwind CSS** — Styling and responsive interface.
- **Sharp and Zod** — Image processing and structured validation.

All referenced frameworks, services, and model providers remain the property of their respective owners.

CivicProof is a hackathon prototype and is not affiliated with or officially endorsed by GVMC, Google, Vercel, or Supabase.

---

## 8. Try CivicProof

### Start with the Demo

<p align="center">
  <a href="/demo">
    <img src="https://img.shields.io/badge/OPEN%20DEMO-Try%20CivicProof-2563EB?style=for-the-badge" alt="Open CivicProof Demo" />
  </a>
</p>

The `/demo` route provides a simple starting point for exploring the demonstration workflow.

### Authenticated Workspace

**Reports:** `/reports`

The authenticated workspace requires a valid user session.

---

## Final Note

CivicProof is built around one principle:

> **A status update is a statement. Evidence makes it reviewable.**

The current MVP establishes the foundation for that process. The next iterations will focus on improving assessment reliability, strengthening the evidence workflow, and evolving toward constrained, auditable agentic capabilities.

**Built with the intention of making civic accountability more transparent, evidence-driven, and citizen-controlled.**