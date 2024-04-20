import { Component, inject, signal } from "@angular/core";
import type { IEntity } from "@domain";
import { NetworkService } from "@services";

@Component({
    selector: "app-example-page",
    standalone: true,
    imports: [],
    templateUrl: "./example-page.component.html",
    styleUrl: "./example-page.component.scss",
})
export class ExamplePageComponent {
    private readonly network = inject(NetworkService);
    readonly data = signal(undefined as string | undefined);
    constructor() {
        void this.network.post<IEntity>("echo", { data: "Hello world!" }).then((entity) => this.data.set(entity.data));
    }
}
