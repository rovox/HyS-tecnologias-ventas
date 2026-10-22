// Shared kernel for state machines: the result of checking a transition. Pure TS, no Nest, no Prisma.

export type TransitionCheck = { ok: true } | { ok: false; reason: string };
