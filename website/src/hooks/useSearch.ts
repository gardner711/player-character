import { useState, useEffect } from 'react';

export interface UseSearchResult {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    debouncedSearchTerm: string;
}

export const useSearch = (initialValue: string = '', debounceMs: number = 300): UseSearchResult => {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs]);

    return {
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm
    };
};