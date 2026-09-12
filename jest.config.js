/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only run tests inside src/ to avoid picking up Expo/React Native files
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  // Map module imports using the same paths as tsconfig
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Use a relaxed config for tests — strict mode is still on but
        // we don't need Expo-specific compiler options here
        jsx: 'react',
        esModuleInterop: true,
      },
    }],
  },
};

