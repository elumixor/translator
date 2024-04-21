import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
    selector: "app-editable",
    standalone: true,
    imports: [FormsModule],
    templateUrl: "./editable.component.html",
    styleUrl: "./editable.component.scss",
})
export class EditableComponent {
    @Output() readonly textChange = new EventEmitter<string>();
    @Input() placeholder = "Placeholder text...";
    @Input() enabled = true;
    focused = false;
    @ViewChild("inputRef") private readonly inputRef?: ElementRef<HTMLInputElement>;

    private _text?: string;

    @Input()
    set text(value: string | undefined) {
        this._text = value;
    }

    get text() {
        return this._text;
    }

    blur() {
        this.focused = false;
        this.inputRef?.nativeElement.blur();
    }

    focus() {
        this.focused = true;
    }

    onInput(event: Event) {
        if (!this.enabled) return;
        this._text = (event.target as HTMLInputElement).value;
        this.sync();
    }

    private sync() {
        this.textChange.emit(this._text);
    }
}
