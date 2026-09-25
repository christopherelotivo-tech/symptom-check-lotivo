import * as SQLite from 'expo-sqlite';
import { TriageResult } from '../engine/types';

export interface PatientAssessmentRecord {
  id: string;
  date: number;
  symptoms: string[];
  triage: string;
  advice: string;
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
      result.triageAdvice,
      JSON.stringify(auditTrail)
    ]
  );
}

export async function getAssessmentHistory(): Promise<PatientAssessmentRecord[]> {
  const db = await SQLite.openDatabaseAsync('symptomcheck.db');
  const rows = await db.getAllAsync<any>('SELECT * FROM patient_history ORDER BY date DESC');
  
  return rows.map(row => ({
    id: row.id,
    date: row.date,
    symptoms: JSON.parse(row.symptoms),
    triage: row.triage,
    advice: row.advice,
    audit: row.audit
  }));
}

export async function clearAssessmentHistory(): Promise<void> {
  const db = await SQLite.openDatabaseAsync('symptomcheck.db');
  await db.runAsync('DELETE FROM patient_history');
}
