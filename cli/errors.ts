import c from "chalk";
import { log } from "./logger";

export class AppError extends Error {
    constructor(
        message: string,
        readonly type = "AppError",
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export async function handleErrors(action: () => void | PromiseLike<void>) {
    try {
        await action();
    } catch (error) {
        const type = error instanceof AppError ? error.type : "RuntimeError";
        const message = error instanceof AppError ? error.message : "An error occurred";
        const stack = error instanceof Error ? error.stack : undefined;

        log.error(c.bold(c.red(`[${type}]:`)) + c.redBright(` ${message}`));

        if (!(error instanceof AppError) && stack) log.error(stack);
        else if (stack) log.error(stack.split("\n").slice(1).join("\n"));
    }
}
