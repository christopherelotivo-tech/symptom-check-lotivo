import { getDb } from '../database/DatabaseService';
import { TriageResult } from '../engine/types';

export interface PatientAssessmentRecord {
  id: string;
  date: number;
  symptoms: string[];
  triage: string;
  advice: string; // Legacy string
  triageResult?: TriageResult; // New full object
  audit: string;
}

export async function saveAssessmentHistory(
  symptoms: string[],
  result: TriageResult,
  auditTrail: any[]
): Promise<void> {
  try {
    const db = await getDb();
    
    const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    const date = Date.now();
    
    await db.runAsync(
      `INSERT INTO patient_history (id, date, symptoms, triage, advice, audit) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        date,
        JSON.stringify(symptoms),
        result.riskCategory,
        JSON.stringify(result), // Store full object as JSON
        JSON.stringify(auditTrail)
      ]
    );
  } catch (error) {
    console.error('Failed to save assessment history:', error);
  }
}

export async function getAssessmentHistory(): Promise<PatientAssessmentRecord[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM patient_history ORDER BY date DESC');
    
    return rows.map(row => {
      let triageResultObj: TriageResult | undefined;
      let adviceStr = row.advice;
      
      try {
        triageResultObj = JSON.parse(row.advice);
        // If it parsed successfully, it's the new format
        // We can synthesize a display string for legacy UI just in case
        adviceStr = triageResultObj?.triageAdvice || triageResultObj?.selfCareAdvice || triageResultObj?.description || '';
      } catch {
        // It's the old legacy plain string
      }
      let parsedSymptoms: string[] = [];
      try {
        parsedSymptoms = JSON.parse(row.symptoms);
        if (!Array.isArray(parsedSymptoms)) parsedSymptoms = [];
      } catch {
        // Fallback to empty array if corrupted
      }

      return {
        id: row.id,
        date: row.date,
        symptoms: parsedSymptoms,
        triage: row.triage,
        advice: adviceStr,
        triageResult: triageResultObj,
        audit: row.audit
      };
    });
  } catch (error) {
    console.error('Failed to fetch assessment history:', error);
    return [];
  }
}

export async function clearAssessmentHistory(): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM patient_history');
  } catch (error) {
    console.error('Failed to clear assessment history:', error);
  }
}
