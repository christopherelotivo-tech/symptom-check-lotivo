import { WorkingMemory } from '../engine/types';

export interface SymptomAssessment {
  factKey: string;
  active: boolean;
  weight: number; 
  durationCode?: string; 
  severityCode?: string;
  onsetCode?: string;
}

/**
 * Maps a rich array of SymptomAssessments from the UI into a flat boolean 
 * WorkingMemory dictionary required by the Knowledge-Based System.
 * 
 * Ensures the InferenceEngine remains isolated from UI complexity.
 */
export function mapAssessmentsToMemory(assessments: SymptomAssessment[]): WorkingMemory {
  const memory: WorkingMemory = {};

  for (const assessment of assessments) {
    if (!assessment.active) continue;

    // 1. Always map the base fact (preserves legacy rules)
    memory[assessment.factKey] = {
      value: true,
      weight: assessment.weight,
    };

    // 2. Synthesize duration fact (e.g., fever_duration_lt_24h = true)
    if (assessment.durationCode) {
      const durationFact = `${assessment.factKey}_duration_${assessment.durationCode}`;
      memory[durationFact] = {
        value: true,
        weight: 0, // Contextual facts don't contribute to aggregate score
      };
    }

    // 3. Synthesize severity fact (e.g., headache_severity_severe = true)
    if (assessment.severityCode) {
      const severityFact = `${assessment.factKey}_severity_${assessment.severityCode}`;
      memory[severityFact] = {
        value: true,
        weight: 0,
      };
    }

    // 4. Synthesize onset fact
    if (assessment.onsetCode) {
      const onsetFact = `${assessment.factKey}_onset_${assessment.onsetCode}`;
      memory[onsetFact] = {
        value: true,
        weight: 0,
      };
    }
  }

  return memory;
}

