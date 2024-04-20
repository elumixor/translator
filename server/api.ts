import type { IEntity } from "@domain";
import { request } from "./server";

export class Api {
    @request("echo")
    echo({ data }: IEntity): IEntity {
        return { data };
    }
}
