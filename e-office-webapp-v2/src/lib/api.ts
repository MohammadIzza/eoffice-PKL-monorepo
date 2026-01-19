import { treaty } from "@elysiajs/eden"
import type  { App } from "@backend/autogen.routes";

export const client = treaty<App>('localhost:3000');


