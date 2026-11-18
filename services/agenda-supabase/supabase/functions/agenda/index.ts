import { createHandler } from './gateway.mjs';
Deno.serve(createHandler({ env: Deno.env.toObject() }));
