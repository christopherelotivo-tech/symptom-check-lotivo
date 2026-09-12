/**
 * Manual Jest mock for expo-sqlite.
 *
 * Placed at src/__mocks__/expo-sqlite.ts so Jest automatically uses it
 * for any `import * as SQLite from 'expo-sqlite'` in tests under src/.
 *
 * This file contains no native code and is pure TypeScript,
 * which lets the DatabaseService tests run in Node/Jest
 * without requiring the Expo native module infrastructure.
 */

export const openDatabaseAsync = jest.fn();
