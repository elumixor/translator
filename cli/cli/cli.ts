import { Command, program } from "commander";
import { handleErrors } from "../errors";
import { actualize, autoTranslate, checkTranslations, launchEditor } from "./actions";

function withCommon<T extends Command>(p: T): T {
    return p
        .argument("<path>", "path to the source translation file. Example: src/locale/messages.xlf")
        .option("-t, --token <string>", "DeepL API token")
        .option("-a, --actualize", "actualize the status map with the current translations? Default: false")
        .option("--auto-translate", "Automatically translate new terms? Default: false")
        .requiredOption("-l, --languages <codes...>", "languages to check. Example: en,es,fr")
        .option("-f, --file-token <string>", "DeepL API token file");
}

program.name("translator").description("Synchronize and approve your .xlf translations").version("0.0.1");

withCommon(program.command("actualize").description("Actualizes the status map with the current translations")).action(
    actualize as unknown as () => Promise<void>,
);

withCommon(program.command("check").description("Checks if all translations are present and approved")).action(
    checkTranslations,
);

withCommon(program.command("auto-translate").description("Automatically translate new terms")).action(
    autoTranslate as unknown as () => Promise<void>,
);

withCommon(program.command("edit").description("Launches the editor to approve translations")).action(launchEditor);

export function run() {
    void handleErrors(() => void program.parse());
}
