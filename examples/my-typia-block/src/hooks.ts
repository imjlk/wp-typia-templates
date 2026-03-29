import { useEffect, useState } from '@wordpress/element';

/**
 * Custom hooks for My Typia Block
 */
export * from './hooks/useDebounce';
export * from './hooks/useLocalStorage';

/**
 * Hook for Typia validation with real-time feedback
 */
export function useTypiaValidation<T>(
	data: T,
	validator: (value: T) => { success: boolean; errors?: any[] }
) {
	const [isValid, setIsValid] = useState(true);
	const [errors, setErrors] = useState<any[]>([]);

	useEffect(() => {
		const result = validator(data);
		setIsValid(result.success);
		setErrors(result.errors || []);
	}, [data, validator]);

	return { isValid, errors };
}

/**
 * Hook for generating UUID
 */
export function useUUID() {
	const [uuid] = useState(() => {
		if (typeof crypto !== 'undefined' && crypto.randomUUID) {
			return crypto.randomUUID();
		}
		
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	});

	return uuid;
}

/**
 * Hook for logging attribute changes in development
 */
export function useAttributeLogger(attributes: any) {
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			console.log('My Typia Block attributes changed:', attributes);
		}
	}, [attributes]);
}