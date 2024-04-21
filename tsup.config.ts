import { defineConfig } from "tsup";

export default defineConfig((options) => [
    {
        entry: ["cli/main.ts"],
        outDir: "bin",
        splitting: false,
        minify: !options.watch,
        format: "esm",
        treeshake: true,
        sourcemap: false,
        clean: true,
        platform: "node",
        target: "node20", // Sync with `runs.using` in action.yml
    },
]);
