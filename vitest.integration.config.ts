import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.integration.test.ts"],
    testTimeout: 45_000,
    hookTimeout: 15_000,
    fileParallelism: false,
    maxConcurrency: 1,
    reporters: ["verbose"],
  },
});
