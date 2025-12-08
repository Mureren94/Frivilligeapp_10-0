import React, { useState, useCallback } from 'react';

// ========= CUSTOM HOOK =========
export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
        try {
            // Pass a function to setStoredValue. This function will receive the up-to-date state.
            setStoredValue(currentStoredValue => {
                // Resolve the new value. If 'value' is a function, call it with the current state.
                const valueToStore =
                    value instanceof Function ? value(currentStoredValue) : value;
                // Save to local storage
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                // Return the new state
                return valueToStore;
            });
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key]);

    return [storedValue, setValue];
}
