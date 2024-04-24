import chalk from "chalk";
import fs from "fs";
import { launchEditor as editor } from "../editor";
import { getLanguageFiles } from "../file-analyzer";
import { LanguageData } from "../language-data";
import { log } from "../logger";
import { StatusMap } from "../status-map";
import { getToken, getTranslator } from "../translator";

export interface Options {
    languages: string[];
    fileToken: string | undefined;
    token: string | undefined;
    actualize: boolean;
    autoTranslate: boolean;
}

export function checkTranslations(path: string, options: Options) {
    const { languages, actualize: doActualize } = options;
    if (doActualize) actualize(path, options);

    const source = LanguageData.fromFile(path);
    const statusMap = StatusMap.from(source, languages);

    const unapproved = statusMap.numUnapproved;
    const missing = statusMap.numMissing;

    if (unapproved > 0)
        log(chalk.yellow(`${unapproved} unapproved translations across ${languages.length} language(s)`));

    if (missing > 0) log(chalk.red(`${missing} missing translations across ${languages.length} language(s)`));

    if (unapproved === 0 && missing === 0) {
        log(chalk.green("All translations are up to date"));
        process.exit(0);
    }

    process.exit(1);
}

export function actualize(path: string, { languages }: { languages: string[] }) {
    const { languageFiles } = getLanguageFiles(path, languages);

    const source = LanguageData.fromFile(path);
    const targetLangs = getTargetLangs(languageFiles).filter((l) => l !== undefined) as LanguageData[];

    // Create empty translations
    for (const { code, filePath } of languageFiles)
        if (!fs.existsSync(filePath)) source.translateEmpty(code).save(filePath);

    // Create and actualize the status map
    const statusMap = StatusMap.from(source, languages);
    statusMap.prune(source.ids);
    statusMap.addLanguage(...targetLangs);
    statusMap.save();

    return { source, targetLangs, statusMap };
}

export async function autoTranslate(path: string, { languages, fileToken, token }: Options) {
    // Actualize what we have already
    actualize(path, { languages });

    const { languageFiles } = getLanguageFiles(path, languages);
    const source = LanguageData.fromFile(path);

    // Initialize DeepL API
    const translator = await getTranslator(token, fileToken);

    // Create empty translations
    for (const { code, filePath } of languageFiles)
        if (!fs.existsSync(filePath)) source.translateEmpty(code).save(filePath);

    const targetLangs = getTargetLangs(languageFiles) as LanguageData[];

    // Now we need to translate only the new terms
    for (const [index, target] of targetLangs.entries()) {
        const newIds = source.ids.filter((id) => !target.ids.includes(id));
        const newTerms = source.pick(newIds);

        // Translate it
        const newTranslated = await newTerms.translate(translator, target.code);

        // Merge the new translations
        const merged = target.merge(newTranslated);

        // Save the new translations
        merged.save();

        // Replace in the runtime array
        targetLangs[index] = merged;
    }

    // Create and actualize the status map
    const statusMap = StatusMap.from(source, languages);
    statusMap.prune(source.ids);
    statusMap.addLanguage(...targetLangs);
    statusMap.save();

    return { source, targetLangs, statusMap };
}

export async function launchEditor(path: string, options: Options & { port: string }) {
    const { autoTranslate: at } = options;
    if (at) await autoTranslate(path, options);
    const { targetLangs } = actualize(path, options);

    editor(
        path,
        targetLangs.map((l) => l.code),
        getToken(options.token, options.fileToken),
        options.port,
    );
}

export function getTargetLangs(languageFiles: { filePath: string }[]) {
    return languageFiles.map(({ filePath }) => (fs.existsSync(filePath) ? LanguageData.fromFile(filePath) : undefined));
}
