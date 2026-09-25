/**
 * ArayKo! Fact Label Map
 *
 * Translates internal engine fact keys into approved human-readable strings
 * for the patient-facing UI.
 *
 * RULES:
 * 1. Known fact → display approved human-readable wording.
 * 2. Unknown/unmapped fact → return null. The caller must NOT render
 *    the raw key in the normal patient view.
 * 3. Raw fact keys remain available only inside the opt-in
 *    "Show technical details" section.
 *
 * DO NOT:
 * - Add language that sounds like a confirmed diagnosis.
 * - Invent medical recommendations.
 * - Expose internal engine keys (e.g. `suspect_meningitis`) in patient UI.
 *
 * DO NOT TOUCH: factKey values used in SymptomForm, InferenceEngine, or seedRules.
 */

// ---------------------------------------------------------------------------
// Patient-facing label map
// ---------------------------------------------------------------------------

const FACT_LABELS: Record<string, string> = {

  // ── User-reported symptom facts ───────────────────────────────────────────
  shortness_of_breath:            'Shortness of breath',
  cough:                          'Cough',
  wheezing:                       'Wheezing',
  chest_pain:                     'Chest pain',
  fever:                          'Fever',
  fatigue:                        'Fatigue',
  nausea:                         'Nausea',
  vomiting:                       'Vomiting',
  headache:                       'Headache',
  stiff_neck:                     'Stiff neck',
  dizziness:                      'Dizziness',
  confusion:                      'Confusion',
  rash:                           'Rash',
  swelling:                       'Swelling',
  jaundice:                       'Yellowing of skin',

  // ── Engine-derived intermediate facts ─────────────────────────────────────
  // Translate without implying a confirmed diagnosis.
  possible_respiratory_infection: 'A possible respiratory concern was identified.',
  severe_respiratory_risk:        'A potentially serious breathing concern was noted.',
  possible_meningitis:            'A pattern requiring extra caution was identified.',
  mild_headache_likely:           'Your headache pattern appears to be low urgency.',
  refer_to_emergency:             'Your assessment flagged you for urgent care.',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the approved patient-facing label for a given fact key.
 *
 * Returns `null` for unknown/unmapped keys.
 * The caller is responsible for NOT rendering raw keys in the patient UI.
 * Unknown keys may be displayed in the opt-in technical details section only.
 */
export function getFactLabel(factKey: string): string | null {
  return FACT_LABELS[factKey] ?? null;
}

/**
 * Returns the raw fact key unchanged.
 * Use ONLY inside the opt-in "Show technical details" section.
 */
export function getRawFactKey(factKey: string): string {
  return factKey;
}

/**
 * Checks whether a fact key has an approved patient-facing label.
 */
export function hasFactLabel(factKey: string): boolean {
  return factKey in FACT_LABELS;
}

