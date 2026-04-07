import type { IValidation } from "@typia/interface";
export interface ValidationError {
    description?: string;
    expected: string;
    path: string;
    value: unknown;
}
export interface ValidationResult<T> {
    data?: T;
    errors: ValidationError[];
    isValid: boolean;
}
export type ValidationLike<T> = IValidation<T> | {
    data?: unknown;
    errors?: unknown;
    success?: unknown;
};
export interface RawValidationError {
    description?: string;
    expected?: string;
    path?: string;
    value?: unknown;
}
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
export declare function isFormDataLike(value: unknown): value is FormData;
export declare function normalizePath(path: unknown): string;
export declare function normalizeExpected(expected: unknown): string;
export declare function normalizeValidationError(error: unknown): ValidationError;
export declare function isValidationResult<T>(value: unknown): value is ValidationResult<T>;
export declare function toValidationResult<T>(result: ValidationLike<T>): ValidationResult<T>;
