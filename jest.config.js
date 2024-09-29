/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.ts",
    "!**/*.spec.ts",
    "!**/node_modules/**",
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ["cobertura", "html"],
  moduleNameMapper: {
    "@src/(.+)": "<rootDir>/src/$1"
  }
};