import { defineConfig } from "vitest/config";
import path from "node:path";
import ts from "typescript";

export default defineConfig({
  plugins: [
    {
      name: "test-tsx-transform",
      enforce: "pre",
      transform(code, id) {
        if (!/\.[jt]sx$/.test(id)) return null;
        return ts.transpileModule(code, {
          compilerOptions: {
            jsx: ts.JsxEmit.ReactJSX,
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
          fileName: id,
        }).outputText;
      },
    },
  ],
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
