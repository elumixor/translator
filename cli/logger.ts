/* eslint-disable no-console */
import util from "util";

interface ILogger {
    (...args: unknown[]): void;
    error(...args: unknown[]): void;
    warn(...args: unknown[]): void;
}

export const log = ((...args: unknown[]) => console.log(...args)) as ILogger;

Reflect.defineProperty(log, "error", {
    value(...args: unknown[]) {
        process.stderr.write(util.format.apply(this, args) + "\n");
    },
});

Reflect.defineProperty(log, "warn", {
    value(...args: unknown[]) {
        process.stderr.write(util.format.apply(this, args) + "\n");
    },
});
