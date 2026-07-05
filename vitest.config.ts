import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./server/testing/server-only.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: [
      "server/**/*.test.ts",
      "components/**/*.test.ts",
      "lib/**/*.test.ts",
    ],
  },
});
