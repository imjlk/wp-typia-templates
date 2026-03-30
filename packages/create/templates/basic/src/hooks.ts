import { useCallback, useEffect, useState } from '@wordpress/element';
import {
  type TypiaValidationError,
  type ValidationResult,
  formatValidationErrors,
  toValidationState,
} from '@wp-typia/create/runtime/validation';

export {
  formatValidationError,
  formatValidationErrors,
  toValidationState,
} from '@wp-typia/create/runtime/validation';
export type {
  TypiaValidationError,
  ValidationResult,
} from '@wp-typia/create/runtime/validation';

export function useTypiaValidation<T>(
  attributes: T,
  validator: (value: T) => ValidationResult<T>
) {
  const [errors, setErrors] = useState<TypiaValidationError[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const result = toValidationState(validator(attributes));
    setErrors(result.errors);
    setErrorMessages(result.errorMessages);
    setIsValid(result.isValid);
  }, [attributes, validator]);

  return { errors, errorMessages, isValid };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}
