import fs from "fs";
import { log } from "./logger";
import type { ITranslator } from "./translator";
import { dirname } from "path";

export interface TranslationFile {
    locale: string;
    translations: Record<string, string>;
}

export class LanguageData {
    constructor(
        readonly filePath: string,
        readonly code: string,
        readonly terms: Map<string, string>,
    ) {}

    [Symbol.iterator]() {
        return this.terms.entries();
    }

    get ids() {
        return [...this.terms.keys()];
    }

    get dir() {
        return dirname(this.filePath);
    }

    static fromFile(filePath: string) {
        const { locale, translations } = JSON.parse(fs.readFileSync(filePath, "utf-8")) as TranslationFile;
        const terms = new Map(Object.entries(translations));
        return new LanguageData(filePath, locale, terms);
    }

    translate(translator: ITranslator, code: string) {
        log.warn("Automatic translation is not supported for now. This will produce a file with empty translations.");
        return Promise.resolve(this.translateBlank(code));
    }

    translateEmpty(code: string) {
        const terms = new Map<string, string>();
        return new LanguageData(this.filePath, code, terms);
    }

    translateBlank(code: string) {
        const terms = new Map<string, string>([...this.terms].map(([id]) => [id, ""]));
        return new LanguageData(this.filePath, code, terms);
    }

    pick(ids: readonly string[]) {
        const terms = new Map(ids.map((id) => [id, this.terms.get(id)!] as const));
        return new LanguageData(this.filePath, this.code, terms);
    }

    merge(other: LanguageData): LanguageData {
        const terms = new Map([...this.terms, ...other.terms]);
        return new LanguageData(this.filePath, this.code, terms);
    }

    set(id: string, value: string) {
        this.terms.set(id, value);
    }

    get(id: string) {
        return this.terms.get(id);
    }

    toJSON() {
        return {
            locale: this.code,
            translations: Object.fromEntries(this.terms),
        };
    }

    save(filePath = this.filePath) {
        fs.writeFileSync(filePath, JSON.stringify(this, null, 2));
    }
}
