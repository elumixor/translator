import { yellow } from "@elumixor/frontils";
import { Api } from "./api";
import { Server } from "./server";

// Create our server
const server = new Server({ port: 4201 });

// Create a handler and register it
const handler = new Api();
server.registerConnections(handler);

void (async () => {
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
})();
