import { blue, cyan, green, magenta, red } from "@elumixor/frontils";
import cors from "cors";
import express from "express";
import "reflect-metadata";
import type { RequestMetadata } from "./request-metadata";
import { requestSymbol } from "./request-symbol";

export class Server {
    readonly port;
    readonly server = express();

    constructor({ port = 4201 }: { port?: number } = {}) {
        this.port = process.env["PORT"] ?? port;
        this.server.use(express.json());

        const ip = process.env["IP"];
        if (ip) {
            // eslint-disable-next-line no-console
            console.log(green(`Whitelisting ${ip}`));
            this.server.use(
                cors({
                    origin: `http://${ip}:4200`,
                }),
            );
        }
    }

    start() {
        // eslint-disable-next-line no-console
        this.server.listen(this.port, () => console.log(green(`Listening on http://localhost:${this.port}`)));
    }

    registerConnections(target: object) {
        // Get all the methods, from the request symbol
        const keys = (Reflect.getMetadata(requestSymbol, target) ?? []) as RequestMetadata[];

        for (const { path, propertyKey, method } of keys) {
            // eslint-disable-next-line no-console
            console.log(`Registering path ${method} ` + blue(`/api/${path}`) + ` -> ${String(propertyKey)}()`);

            this.server[method](
                `/api/${path}`,
                (req, res) =>
                    void (async (req, res) => {
                        try {
                            const now = new Date();
                            const date = `[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}]`;

                            const params = req.params;

                            // Replace :param with actual values
                            let substituted = path;
                            for (const [key, value] of Object.entries(params))
                                substituted = substituted.replace(`:${String(key)}`, String(value));

                            // eslint-disable-next-line no-console
                            console.log(cyan(`${date}: API request: ${substituted}`));
                            // eslint-disable-next-line no-console
                            console.dir(req.body, { depth: null, colors: true });

                            res.type("application/json");

                            const handler = (
                                target[propertyKey as keyof typeof target] as (
                                    params: Record<string, unknown>,
                                ) => PromiseLike<unknown>
                            ).bind(target);

                            const p = { ...req.body, ...req.params } as Record<string, unknown>;

                            const result = (await handler(p)) ?? {};
                            // eslint-disable-next-line no-console
                            console.log(magenta(`${date}: API response ${substituted}`));
                            // eslint-disable-next-line no-console
                            console.dir(result, { depth: null, colors: true });
                            res.status(200).send(result);
                        } catch (e) {
                            const message = (e as { message?: string }).message ?? "unknown error";
                            const stackTrace = e instanceof Error ? e.stack ?? "" : "";
                            // eslint-disable-next-line no-console
                            console.error(red(String(e)) + "\n" + stackTrace);

                            res.status(500).send({ message, stackTrace });
                        }
                    })(req, res),
            );
        }
    }
}
