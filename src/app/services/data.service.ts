import { Injectable, inject, signal, type WritableSignal } from "@angular/core";
import type { Status } from "../../../cli/status-map";
import { NetworkService } from "./network.service";

function fromPromise<T>(promise: PromiseLike<T>, defaultValue: T): WritableSignal<T>;
function fromPromise<T>(promise: PromiseLike<T>): WritableSignal<T | undefined>;
function fromPromise<T>(promise: PromiseLike<T>, defaultValue?: T) {
    const sig = signal<T | undefined>(defaultValue);
    void promise.then((value) => sig.set(value));
    return sig;
}

@Injectable({
    providedIn: "root",
})
export class DataService {
    private readonly network = inject(NetworkService);
    private readonly timeouts = new Map<string, number>();
    readonly codes = fromPromise(this.network.post<string[]>("codes"), []);
    readonly statusMap = fromPromise(
        this.network.post<
            {
                id: string;
                source: string;
                translations: Record<string, { approval: Status; translation: string | undefined }>;
            }[]
        >("statusMap"),
    );

    update(id: string, code: string, value: string) {
        clearTimeout(this.timeouts.get(id));
        this.timeouts.set(
            id,
            window.setTimeout(() => {
                this.timeouts.delete(id);

                this.statusMap.update((map) => {
                    const item = map!.find((item) => item.id === id);
                    if (!item) throw new Error(`Item with ID ${id} not found`);

                    if (code === "source") item.source = value;
                    else {
                        if (item.translations[code].approval !== "approved")
                            item.translations[code].approval = "translated";
                        item.translations[code].translation = value;
                    }
                    return map;
                });

                void this.network.post("update", { id, code, value });
            }, 1000),
        );
    }

    approve(id: string, code: string, approval: Status) {
        approval = approval === "translated" ? "approved" : "translated";

        this.statusMap.update((map) => {
            const item = map!.find((item) => item.id === id);
            if (!item) throw new Error(`Item with ID ${id} not found`);
            item.translations[code].approval = approval;
            return map;
        });

        void this.network.post("approve", { id, code, approval });
    }

    async autoTranslate(id: string, code: string) {
        const { text } = await this.network.post<{ text: string }>("autoTranslate", { id, code });
        this.statusMap.update((map) => {
            const item = map!.find((item) => item.id === id);
            if (!item) throw new Error(`Item with ID ${id} not found`);
            item.translations[code].approval = "translated";
            item.translations[code].translation = text;
            return map;
        });
    }
}
