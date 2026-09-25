# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
1. Patients: Individuals experiencing symptoms who need guidance on whether to seek emergency care or how to manage their health.
2. Clinical Administrators: Healthcare professionals configuring the underlying clinical rules, risk thresholds, and triage guidance.

## Product Purpose
ArayKo! is an offline, knowledge-based symptom checker. It provides users with a structured assessment of their symptoms and returns a deterministic, clinical triage risk category and advice. It exists to provide calm, trustworthy, and immediate triage guidance without relying on online AI models.

## Positioning
A deterministic, offline clinical inference engine. Unlike generative AI chatbots, ArayKo! relies strictly on explicit rules, ensuring predictable and medically verifiable triage outcomes.

## Operating Context
Patients primarily use it on mobile devices when feeling unwell, requiring a calm, accessible, and high-trust interface. Clinical Administrators access a PIN-protected section to build and manage rules using a structural Rule Builder and Test Bench.

## Capabilities and Constraints
- Strictly knowledge-based inference (forward-chaining engine).
- Clinical logic (WorkingMemory, InferenceEngine) is 100% isolated from the UI rendering layer.
- Offline-first architecture.
- No generative AI in the clinical flow; no invented diagnosis.

## Brand Commitments
- Name: ArayKo!
- Voice: Calm, guided, understandable, reassuring, patient-first.
- The phrase "Your Assessment" is preferred over "Diagnosis".
- Technical terminology (FactKey, WorkingMemory) must remain exclusively in the Admin context.

## Evidence on Hand
- Complete offline inference engine (RuleValidator, DatabaseService, ContextMapper).
- 7 existing system triage rules.

## Product Principles
1. Clinical safety and determinism above all.
2. Complete separation of logic and presentation.
3. Patient reassurance through structured, transparent explainability.

## Accessibility & Inclusion
Must maintain high-contrast touch targets (minimum 44px), readable typography, and accessible form inputs suitable for users who may be distressed or visually impaired.
