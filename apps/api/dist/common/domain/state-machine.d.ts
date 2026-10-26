export type TransitionCheck = {
    ok: true;
} | {
    ok: false;
    reason: string;
};
