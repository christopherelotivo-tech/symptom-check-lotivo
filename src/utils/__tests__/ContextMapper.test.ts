import { mapAssessmentsToMemory, SymptomAssessment } from '../ContextMapper';

describe('ContextMapper', () => {
  it('maps a base fact correctly without context', () => {
    const assessments: SymptomAssessment[] = [
      { factKey: 'cough', active: true, weight: 0.2 }
    ];

    const memory = mapAssessmentsToMemory(assessments);

    // Should only contain the base fact
    expect(memory['cough']).toBeDefined();
    expect(memory['cough'].value).toBe(true);
    expect(memory['cough'].weight).toBe(0.2);
    expect(Object.keys(memory).length).toBe(1);
  });

  it('maps a base fact and its contextual facts correctly', () => {
    const assessments: SymptomAssessment[] = [
      { 
        factKey: 'headache', 
        active: true, 
        weight: 0.2, 
        durationCode: 'gt_1_week', 
        severityCode: 'severe' 
      }
    ];

    const memory = mapAssessmentsToMemory(assessments);

    // Base fact is preserved for backwards compatibility
    expect(memory['headache']).toBeDefined();
    expect(memory['headache'].value).toBe(true);
    expect(memory['headache'].weight).toBe(0.2);

    // Duration context fact is synthesized with weight 0
    expect(memory['headache_duration_gt_1_week']).toBeDefined();
    expect(memory['headache_duration_gt_1_week'].value).toBe(true);
    expect(memory['headache_duration_gt_1_week'].weight).toBe(0);

    // Severity context fact is synthesized with weight 0
    expect(memory['headache_severity_severe']).toBeDefined();
    expect(memory['headache_severity_severe'].value).toBe(true);
    expect(memory['headache_severity_severe'].weight).toBe(0);

    expect(Object.keys(memory).length).toBe(3);
  });

  it('ignores inactive assessments', () => {
    const assessments: SymptomAssessment[] = [
      { factKey: 'fever', active: false, weight: 0.3, durationCode: 'lt_24h' },
      { factKey: 'fatigue', active: true, weight: 0.1 }
    ];

    const memory = mapAssessmentsToMemory(assessments);

    expect(memory['fever']).toBeUndefined();
    expect(memory['fever_duration_lt_24h']).toBeUndefined();
    
    expect(memory['fatigue']).toBeDefined();
    expect(memory['fatigue'].value).toBe(true);
    expect(Object.keys(memory).length).toBe(1);
  });
});
