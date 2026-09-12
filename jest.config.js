/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only run tests inside src/ to avoid picking up Expo/React Native files
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  // Map module imports using the same paths as tsconfig
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // Redirect native Expo modules to manual mocks so Jest never touches real ESM.
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/src/__mocks__/expo-sqlite.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
      },
    }],
  },
};

