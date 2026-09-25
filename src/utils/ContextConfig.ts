export interface SymptomContextConfig {
  duration: boolean;
  severity: boolean;
  // Future phases: onset, progression, specialContext
}

/**
 * Centralized configuration determining which contextual questions
 * are asked for each specific symptom.
 * 
 * Do not scatter ad-hoc conditionals (e.g. "if headache") in the UI.
 * Always rely on this mapping.
 */
export const CONTEXT_CONFIG: Record<string, SymptomContextConfig> = {
  // Respiratory
  shortness_of_breath: { duration: true, severity: false }, // Allowed severity earlier, but strictly per matrix: no severity for now unless explicitly approved
  cough:               { duration: true, severity: false },
  wheezing:            { duration: true, severity: false },
  chest_pain:          { duration: true, severity: true },

  // Systemic
  fever:               { duration: true, severity: false },
  fatigue:             { duration: true, severity: false },
  nausea:              { duration: true, severity: false },
  vomiting:            { duration: true, severity: false },

  // Neurological
  headache:            { duration: true, severity: true },
  stiff_neck:          { duration: false, severity: false },
  dizziness:           { duration: true, severity: false },
  confusion:           { duration: false, severity: false }, // onset deferred

  // Dermatological
  rash:                { duration: true, severity: false },
  swelling:            { duration: true, severity: false },
  jaundice:            { duration: false, severity: false },
};

export const DEFAULT_CONTEXT_CONFIG: SymptomContextConfig = {
  duration: false,
  severity: false,
};

export const DURATION_OPTIONS = [
  { label: 'Less than 24 hours', value: 'lt_24h', shortLabel: '< 24h' },
  { label: '1 to 3 days', value: '1_to_3_days', shortLabel: '1-3 days' },
  { label: '4 to 7 days', value: '4_to_7_days', shortLabel: '4-7 days' },
  { label: 'More than a week', value: 'gt_1_week', shortLabel: '> 1 week' },
];

export const SEVERITY_OPTIONS = [
  { label: 'Mild (Noticeable but I can do normal activities)', value: 'mild', shortLabel: 'Mild' },
  { label: 'Moderate (Distracting and uncomfortable)', value: 'moderate', shortLabel: 'Moderate' },
  { label: 'Severe (I cannot focus or do normal activities)', value: 'severe', shortLabel: 'Severe' },
];

export function getContextFactKey(baseSymptom: string, contextType: 'duration' | 'severity', value: string): string {
  return `${baseSymptom}_${contextType}_${value}`;
}
