export type FieldChange = {
    antes: unknown;
    despues: unknown;
};
export declare function fieldChanges(before?: Record<string, unknown> | null, after?: Record<string, unknown> | null): Record<string, FieldChange>;
