import fs from "fs";
import { AppError } from "./errors";
import type { LanguageData } from "./language-data";

export type Status = undefined | "translated" | "approved";
export type ApprovalMap = Record<string, Record<string, Status> | undefined>;

export class StatusMap {
    constructor(
        private readonly filePath: string,
        // Maps ID -> list of languages where it is approved
        readonly map: ApprovalMap,
        readonly codes: string[],
    ) {}

    [Symbol.iterator]() {
        return Object.entries(this.map)[Symbol.iterator]();
    }

    get ids() {
        return Object.keys(this.map);
    }

    get numMissing() {
        const codes = this.codes;
        return Object.values(this.map).reduce((total, langs) => {
            if (!langs) return total + codes.length;
            return total + codes.filter((code) => !langs[code]).length;
        }, 0);
    }

    get numUnapproved() {
        const codes = this.codes;
        return Object.values(this.map).reduce((total, langs) => {
            if (!langs) return total;
            return total + codes.filter((code) => langs[code] === "translated").length;
        }, 0);
    }

    get numTotal() {
        return this.ids.length * this.codes.length;
    }

    static from(source: LanguageData, codes: string[], createIfMissing = true) {
        const dir = source.dir;
        const filePath = `${dir}/status-map.json`;
        const keys = source.ids;

        if (!fs.existsSync(filePath)) {
            if (!createIfMissing) throw new AppError(`Status map not found at ${filePath}`);
            fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        }

        const approvedMap = JSON.parse(fs.readFileSync(filePath, "utf-8")) as ApprovalMap;
        for (const key of keys) approvedMap[key] ??= {};
        return new StatusMap(filePath, approvedMap, codes);
    }

    prune(ids: readonly string[]) {
        const idsToRemove = this.ids.filter((id) => !ids.includes(id));
        for (const id of idsToRemove) this.map[id] = undefined;
    }

    addLanguage(...targetLangs: LanguageData[]) {
        for (const { code, terms } of targetLangs)
            for (const [id] of terms) {
                this.map[id] ??= {};
                if (this.map[id]![code] === "approved") continue;
                this.map[id]![code] = "translated";
            }

        this.save();
    }

    addTranslation(id: string, code: string, status: Status) {
        this.map[id] ??= {};
        if (this.map[id]![code] !== "approved") this.map[id]![code] = status;
    }

    approve(id: string, code: string, status: Status) {
        const oldStatus = this.map[id]?.[code];
        if (oldStatus !== "translated" && oldStatus !== "approved")
            throw new AppError(`Cannot approve translation for ${id} in ${code} because it is not translated`);

        this.map[id]![code] = status;
    }

    toJSON() {
        return this.map;
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this, null, 2));
    }
}
