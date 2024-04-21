import { yellow } from "@elumixor/frontils";
import { Api } from "./api";
import { Server } from "./server";
import { program } from "commander";

async function run(...args: Parameters<(typeof Api)["from"]>) {
    // Create our server
    const server = new Server({ port: 4000 });

    // Create a handler and register it
    const handler = await Api.from(...args);
    server.registerConnections(handler);

    // Include angular stuff, but not in dev mode
    if (!process.env["NG_DEV"]) {
        const { includeAngular } = await import("./include-angular");
        await includeAngular(server);
    } else {
        // eslint-disable-next-line no-console
        console.log(yellow("[DEV MODE]: Skipping Angular SSR"));
    }

    // Start the server
    server.start();
}

program
    .argument("<path>", "path to the source translation file. Example: src/locale/messages.xlf")
    .option("-t, --token <string>", "DeepL API token")
    .requiredOption("-l, --languages <codes...>", "languages to check. Example: en,es,fr")
    .option("-f, --file-token <string>", "DeepL API token file")
    .action(run);

program.parse();
