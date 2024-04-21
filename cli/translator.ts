import chalk from "chalk";
import fs from "fs";
import { Translator, type TargetLanguageCode } from "deepl-node";
import { AppError } from "./errors";
import { log } from "./logger";

export interface ITranslator {
    translateText(text: string, sourceLang: string, targetLang: TargetLanguageCode): Promise<{ text: string }>;
}

export async function getTranslator(token: string | undefined, fileToken: string | undefined): Promise<ITranslator> {
    token = getToken(token, fileToken);

    const translator = new Translator(token);
    log(chalk.green("DeepL API initialized"));

    // Log the usage of the API
    const usage = await translator.getUsage();
    if (usage.anyLimitReached()) {
        log("Translation limit exceeded.");
    }

    if (usage.character) {
        const { count, limit } = usage.character;
        const percentage = (count / limit) * 100;
        const rounded = Math.round(percentage);

        log(`Characters: [${count}/${limit}] (${percentage > 100 ? " - Limit exceeded" : String(rounded) + "%"})`);
    }

    if (usage.document) {
        const { count, limit } = usage.document;
        const percentage = (count / limit) * 100;
        const rounded = Math.round(percentage);

        log(`Characters: [${count}/${limit}] (${percentage > 100 ? " - Limit exceeded" : String(rounded) + "%"})`);
    }

    return translator as ITranslator;
}

export function demoTranslator(): ITranslator {
    return {
        translateText(text) {
            log.warn("Demo translation!");
            return Promise.resolve({ text });
        },
    };
}

export function isAcceptedLanguage(lang: string): lang is TargetLanguageCode {
    return [
        "ar",
        "bg",
        "cs",
        "da",
        "de",
        "el",
        "es",
        "et",
        "fi",
        "fr",
        "hu",
        "id",
        "it",
        "ja",
        "ko",
        "lt",
        "lv",
        "nb",
        "nl",
        "pl",
        "ro",
        "ru",
        "sk",
        "sl",
        "sv",
        "tr",
        "uk",
        "zh",
    ].includes(lang);
}

export function languagePrefix(code?: string) {
    if (!code) return "      ";
    return `[${chalk.cyan(chalk.bold(code))}]: `;
}

export function getToken(token: string | undefined, fileToken: string | undefined) {
    if (!token && !fileToken) throw new AppError("No token provided");
    return token ?? fs.readFileSync(fileToken!, "utf-8").trim();
}
