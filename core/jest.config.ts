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
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  testPathIgnorePatterns: [
    "\\\\node_modules\\\\"
  ],
};

export default config;
