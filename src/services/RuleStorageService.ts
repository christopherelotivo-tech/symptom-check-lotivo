import { cacheDirectory, writeAsStringAsync, readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { addCustomRule, getAllRules } from '../database/DatabaseService';
import { RuleValidator } from '../engine/RuleValidator';
import { Rule } from '../engine/types';

export interface ImportSummary {
  successCount: number;
  failedRules: Array<{
    ruleId: string;
    errors: string[];
  }>;
}

export class RuleStorageService {
  /**
   * Fetches all rules from the database and exports them as a JSON file.
   * Invokes the native share sheet so the admin can save it to their filesystem.
   */
  public static async exportRules(): Promise<void> {
    try {
      const rules = await getAllRules();
      const rulesJson = JSON.stringify(rules, null, 2);

      // Create a temporary file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `symptom_rules_export_${timestamp}.json`;
      const fileUri = `${cacheDirectory}${filename}`;

      // Write to local cache
      await writeAsStringAsync(fileUri, rulesJson, {
        encoding: EncodingType.UTF8,
      });

      // Share or save to device filesystem
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        throw new Error('Sharing is not available on this device.');
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Symptom Rules',
        UTI: 'public.json',
      });
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Opens the native document picker to select a JSON rule file.
   * Parses the file, validates each rule sequentially to prevent conflicts,
   * and saves valid rules to the custom_rules table.
   * 
   * @returns An ImportSummary if a file was selected, or null if cancelled.
   */
  public static async importRules(): Promise<ImportSummary | null> {
    try {
      // 1. Pick the document
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const fileUri = result.assets[0].uri;

      // 2. Read and parse file
      const fileContents = await readAsStringAsync(fileUri, {
        encoding: EncodingType.UTF8,
      });

      const parsedData = JSON.parse(fileContents);
      const importedRules: Rule[] = Array.isArray(parsedData) ? parsedData : [parsedData];

      // 3. Load existing rules context for validation
      // We keep a running list in memory so rules within the same import batch
      // are validated against each other (e.g., checking for batch duplicates).
      const existingRules = await getAllRules();
      const currentRuleContext = [...existingRules];

      // 4. Validate and Import
      const summary: ImportSummary = {
        successCount: 0,
        failedRules: [],
      };

      for (const rule of importedRules) {
        // Validate against the actively updated context
        const validation = RuleValidator.validate(rule, currentRuleContext);

        if (validation.isValid) {
          await addCustomRule(rule);
          currentRuleContext.push(rule);
          summary.successCount++;
        } else {
          summary.failedRules.push({
            ruleId: rule.id || 'UNKNOWN_ID',
            errors: validation.errors,
          });
        }
      }

      return summary;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }
}
