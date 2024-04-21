import {
    LanguageData,
    actualize,
    demoTranslator,
    getLanguageFiles,
    getTargetLangs,
    getTranslator,
    isAcceptedLanguage,
    type ITranslator,
} from "../cli";
import { StatusMap, type Status } from "../cli/status-map";
import { request } from "./server";
import { AppError } from "../cli/errors";

export class Api {
    constructor(
        readonly source: LanguageData,
        readonly targetLangs: Map<string, LanguageData>,
        readonly statusMap: StatusMap,
        readonly translator: ITranslator,
        readonly codes: string[],
    ) {}

    static async from(
        path: string,
        { languages, token, fileToken }: { languages: string[]; token: string; fileToken: string },
    ) {
        // Actualize everything first
        actualize(path, { languages });

        const source = LanguageData.fromFile(path);

        const { languageFiles } = getLanguageFiles(path, languages);
        const targetLangs = getTargetLangs(languageFiles) as LanguageData[];

        const statusMap = StatusMap.from(source, languages);

        let translator: ITranslator;
        if (!process.env["NG_DEV"]) translator = await getTranslator(token, fileToken);
        else translator = demoTranslator();

        const targetLangsMap = new Map(targetLangs.map((lang) => [lang.code, lang]));

        return new Api(source, targetLangsMap, statusMap, translator, languages);
    }

    @request("codes")
    getCodes() {
        return this.codes;
    }

    @request("statusMap")
    getStatusMap() {
        return [...this.statusMap].flatMap(([id, approvals]) => {
            return {
                id,
                source: this.source.get(id),
                translations: Object.fromEntries(
                    this.codes.map((code) => [
                        code,
                        { approval: approvals?.[code], translation: this.targetLangs.get(code)?.get(id) },
                    ]),
                ),
            };
        });
    }

    @request("update")
    update({ id, code, value }: { id: string; code: string; value: string }) {
        const isSource = code === "source";
        const target = isSource ? this.source : this.targetLangs.get(code);
        if (!target) throw new AppError(`Language ${code} not found`);
        target.set(id, value);
        if (!isSource) this.statusMap.addTranslation(id, code, "translated");
        this.statusMap.save();
        target.save();
    }

    @request("approve")
    approve({ id, code, approval }: { id: string; code: string; approval: Status }) {
        this.statusMap.approve(id, code, approval);
        this.statusMap.save();
    }

    @request("autoTranslate")
    async autoTranslate({ id, code }: { id: string; code: string }) {
        if (!isAcceptedLanguage(code)) throw new AppError(`Language ${code} not supported`);
        const { text } = await this.translator.translateText(this.source.get(id)!, this.source.code, code);

        const targetLang = this.targetLangs.get(code);
        if (!targetLang) throw new AppError(`Language ${code} not found`);

        targetLang.set(id, text);
        this.statusMap.addTranslation(id, code, "translated");

        this.statusMap.save();
        targetLang.save();

        return { text };
    }
}
