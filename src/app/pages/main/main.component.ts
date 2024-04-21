import { Component, inject } from "@angular/core";
import { DataService } from "@services";
import { EditableComponent } from "../../editable/editable.component";

@Component({
    selector: "app-main",
    standalone: true,
    imports: [EditableComponent],
    templateUrl: "./main.component.html",
    styleUrl: "./main.component.scss",
})
export class MainComponent {
    readonly data = inject(DataService);
}
