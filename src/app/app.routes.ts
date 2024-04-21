import type { Routes } from "@angular/router";
import { MainComponent } from "@pages";

export const routes: Routes = [
    {
        path: "",
        component: MainComponent,
    },
    {
        path: "**",
        redirectTo: "",
        pathMatch: "full",
    },
];
