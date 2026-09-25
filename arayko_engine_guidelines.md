# SymptaCare Architecture & Engine Guidelines

This document explains the core technical architecture, the Inference Engine, and the clinical logic boundaries of the **SymptaCare** mobile application. It is meant to guide developers, AI tools (like Stitch), and designers on how the application processes data and makes decisions.

---

## 1. What is SymptaCare?
SymptaCare is an **offline, rules-based clinical symptom triage application**. It evaluates a user's symptoms and contextual information (like duration or severity) to recommend a safe clinical next step (e.g., "Seek urgent medical care", "Consider medical advice", or "Low concern").

It does **not** use LLMs or generative AI for medical decisions. It relies entirely on a deterministic, auditable **Forward-Chaining Inference Engine** to guarantee 100% predictable and medically safe outcomes.

## 2. The Inference Engine (`InferenceEngine.ts`)
The brain of the app is a custom inference engine located in `src/engine/`. 
- **Forward-Chaining:** It starts with known facts (the patient's symptoms) and repeatedly applies rules to derive new facts until no more rules can fire.
- **Deterministic:** The same inputs will *always* produce the exact same triage output and audit trail.
- **Conflict Resolution:** If multiple rules fire, the engine resolves conflicts using a strict hierarchy: `Red Risk > Amber Risk > Green Risk`, followed by `Rule Priority`, and finally `Symptom Weight`.

## 3. Working Memory
The engine evaluates everything against a `WorkingMemory` object.
- It is a **flat, boolean dictionary** of facts.
- Example: 
  ```typescript
  {
    "headache": { value: true, weight: 0.2 },
    "headache_severity_severe": { value: true, weight: 0 },
    "fever": { value: false, weight: 0.3 }
  }
  ```
- Every fact is either `true` (present), `false` (explicitly denied/absent), or `undefined` (unknown).

## 4. The Knowledge Base (KBS) & Rules
Medical logic is defined in declarative rules (stored in SQLite/JSON), never hard-coded into UI components.
A rule looks like this:
*   **Antecedents (IF):** A set of conditions (e.g., `IF headache === true AND headache_severity_severe === true`).
*   **Consequent (THEN):** The resulting derived fact (e.g., `THEN triage_amber === true`).
*   **Metadata:** Contains human-readable text like the Triage Advice, Risk Category (Red/Amber/Green), and Priority.

## 5. UI / Engine Separation (The Golden Rule)
To maintain clinical safety, there is a strict boundary between the UI (React Native) and the Inference Engine:

1.  **No Logic in UI:** React components must *never* contain `if (symptom === 'chest_pain') { showRedWarning() }`.
2.  **The ContextMapper:** The UI collects rich, hierarchical data from the user (e.g., a "Headache" object with `severity: 'severe'`). The `ContextMapper` translates this UI object into flat boolean strings (`headache = true`, `headache_severity_severe = true`) to feed into the Working Memory.
3.  **UI is purely a Renderer:** The UI passes facts to the engine, receives a `TriageResult`, and simply renders the risk category and text exactly as returned by the engine.

## 6. Audit Trail & Explainability
Because SymptaCare is a healthcare tool, every decision must be auditable. The Inference Engine generates an `AuditTrail` array that records:
*   When a user inputs a fact (`USER_INPUT`)
*   When a rule fires (`RULE_FIRED`)
*   When a new fact is derived (`FACT_DERIVED`)

The Patient UI translates this trail into a friendly "Why this result was reached" summary, while the Admin/TestBench UI shows the raw technical trace for debugging.

