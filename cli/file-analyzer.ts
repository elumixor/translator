import chalk from "chalk";
import fs from "fs";
import { isAcceptedLanguage } from "./translator";
import { AppError } from "./errors";

export function getLanguageFiles(path: string, codes: string[]) {
    // Check if file exists
    if (!fs.existsSync(path)) throw new AppError(`File not found: ${path}`);

    // Check if extension is .json
    if (!path.endsWith(".json")) throw new AppError("File must have .json extension");

    path = fs.realpathSync(path);
    const { dir, fileName, ext } = splitPath(path);

    const languageFiles = codes.map((code) => ({ code, filePath: `${dir}/${fileName}.${code}.${ext}` }));
    const formattedPath = formatPath(path);

    return { dir, formattedPath, languageFiles };
}

export function splitPath(path: string) {
    const split = path.split("/");
    const dir = split.slice(0, -1).join("/");
    const file = split[split.length - 1];
    const fileName = file.split(".").slice(0, -1).join(".");
    const ext = file.split(".").slice(-1).join(".");

    return {
        dir,
        fileName,
        ext,
    };
}

export function formatPath(path: string) {
    const { dir, fileName, ext } = splitPath(path);
    const split = fileName.split(".");
    const maybeCode = split.slice(-1).join(".");

    let code, name;
    if (isAcceptedLanguage(maybeCode)) {
        code = maybeCode;
        name = split.slice(0, -1).join(".");
    } else {
        code = undefined;
        name = fileName;
    }

    if (code !== undefined)
        return `${chalk.yellow(dir)}/${chalk.green(name)}.${chalk.green(chalk.bold(code))}.${chalk.cyan(ext)}`;

    return `${chalk.yellow(dir)}/${chalk.green(fileName)}.${chalk.cyan(ext)}`;
}
