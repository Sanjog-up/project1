import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      DB_URI: "mongodb://localhost:27017/project1_test",
      JWT_SECRET: "test-secret-that-is-long-enough-1234567890",
      JWT_EXPIRY: "1d",
      CLOUDINARY_CLOUD_NAME: "demo",
      CLOUDINARY_API_KEY: "123456",
      CLOUDINARY_API_SECRET: "fake-secret",
      ALLOW_ORIGIN: "http://localhost:3000",
      COOKIE_EXPIRY: "7",
    },
  },
});