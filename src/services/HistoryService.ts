import * as SQLite from 'expo-sqlite';
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
  const db = await SQLite.openDatabaseAsync('symptomcheck.db');
  
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
}

export async function getAssessmentHistory(): Promise<PatientAssessmentRecord[]> {
  const db = await SQLite.openDatabaseAsync('symptomcheck.db');
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
}

export async function clearAssessmentHistory(): Promise<void> {
  const db = await SQLite.openDatabaseAsync('symptomcheck.db');
  await db.runAsync('DELETE FROM patient_history');
}
