import type { Routes } from "@angular/router";
import { ExamplePageComponent } from "@pages";

export const routes: Routes = [
    {
        path: "example",
        component: ExamplePageComponent,
    },
    {
        path: "**",
        redirectTo: "example",
        pathMatch: "full",
    },
];
