import type { Config } from 'jest';

const config: Config = {
  cacheDirectory: "C:\\Users\\Clark\\AppData\\Local\\Temp\\jest",
  clearMocks: true,
  coverageProvider: "v8",
  errorOnDeprecated: true,
  globals: {},
  setupFiles: [
    "./jest-setup.js"
  ],
  testMatch: [
    "**/__tests__/**/*.ts",
    "**/?(*.)+(spec|test).ts"
  ],
  testPathIgnorePatterns: [
    "\\\\node_modules\\\\"
  ],
  testEnvironment: "node",
  preset: "ts-jest"
};

export default config;
