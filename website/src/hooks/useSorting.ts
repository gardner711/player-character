import { useState, useCallback } from 'react';
import { SortField, SortDirection } from './useCharacterList';

export interface UseSortingResult {
    sortField: SortField;
    sortDirection: SortDirection;
    setSorting: (field: SortField, direction: SortDirection) => void;
}

export const useSorting = (
    initialField: SortField = 'createdAt',
    initialDirection: SortDirection = 'desc'
): UseSortingResult => {
    const [sortField, setSortField] = useState<SortField>(initialField);
    const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

    const setSorting = useCallback((field: SortField, direction: SortDirection) => {
        setSortField(field);
        setSortDirection(direction);
    }, []);

    return {
        sortField,
        sortDirection,
        setSorting
    };
};