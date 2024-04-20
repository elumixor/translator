import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { Api } from "./api";
import { Server } from "./server";
import { yellow } from "@elumixor/frontils";

// Create our server
const server = new Server({ port: 4201 });

// Create a handler and register it
const handler = new Api();
server.registerConnections(handler);

// Include angular stuff, but not in dev mode
if (!process.env["NG_DEV"]) {
    const { APP_BASE_HREF } = await import("@angular/common");
    const { CommonEngine } = await import("@angular/ssr");
    const { default: bootstrap } = await import("../src/main.server");

    const serverDistFolder = dirname(fileURLToPath(import.meta.url));
    const browserDistFolder = resolve(serverDistFolder, "../browser");
    const indexHtml = join(serverDistFolder, "index.server.html");

    const commonEngine = new CommonEngine();

    server.server.set("view engine", "html");
    server.server.set("views", browserDistFolder);

    server.server.use(express.static("server/public"));
    server.server.use(express.static(browserDistFolder));

    // Serve static files from /browser
    server.server.get(
        "*.*",
        express.static(browserDistFolder, {
            maxAge: "1y",
        }),
    );

    // All regular routes use the Angular engine
    server.server.get("*", (req, res, next) => {
        const { protocol, originalUrl, baseUrl, headers } = req;

        commonEngine
            .render({
                bootstrap,
                documentFilePath: indexHtml,
                url: `${protocol}://${headers.host}${originalUrl}`,
                publicPath: browserDistFolder,
                providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
            })
            .then((html) => res.send(html))
            .catch((err) => next(err));
    });
} else {
    // eslint-disable-next-line no-console
    console.log(yellow("[DEV MODE]: Skipping Angular SSR"));
}

// Start the server
server.start();
