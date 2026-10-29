type ValidationErrorLike = {
    property: string;
    constraints?: Record<string, string>;
    children?: ValidationErrorLike[];
};
export declare function validationMessages(errors: ValidationErrorLike[], parent?: string): string[];
export {};
