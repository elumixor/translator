import { yellow } from "@elumixor/frontils";
import { Api } from "./api";
import { Server } from "./server";
import { program } from "commander";

async function run(path: string, options: Parameters<(typeof Api)["from"]>[1] & { port?: string }) {
    // Create our server
    const server = new Server({ port: Number(options.port ?? 3300) });

    // Create a handler and register it
    const handler = await Api.from(path, options);
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
    .option("-p, --port <number>", "port to run the editor on. Default: 3300")
    .action(run);

program.parse();
