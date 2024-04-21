import { log } from "./logger";
import { spawn } from "child_process";
import path from "path";

export function launchEditor(sourceFilePath: string, targetLangs: string[], translatorToken: string) {
    log("Launching editor");

    // Get the path the current js file
    const currentPath = import.meta.url.replace("file://", "");
    const editorPath = path.resolve(currentPath, "../../dist/translator/server/server.mjs");

    const editor = spawn("node", [editorPath, sourceFilePath, "-l", ...targetLangs, "-t", translatorToken])
        .on("error", (err) => log(`Editor error: ${String(err)}`))
        .on("exit", (code) => log(`Editor exited with code ${code}`));

    editor.stdout.on("data", (data) => log(`${data}`.trim()));
    editor.stderr.on("data", (data) => log(`${data}`.trim()));
}
