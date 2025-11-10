import { useState, useEffect, useCallback } from 'react';
import { characterAPI } from '../services/characterAPI';
import { Character, CharacterListParams } from '../types/character';

export type SortField = 'characterName' | 'level' | 'race' | 'class' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface UseCharacterListResult {
    characters: Character[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useCharacterList = (
    page: number,
    limit: number,
    searchTerm: string = '',
    sortField: SortField = 'createdAt',
    sortDirection: SortDirection = 'desc'
): UseCharacterListResult => {
    const [state, setState] = useState({
        characters: [] as Character[],
        pagination: null as PaginationInfo | null,
        loading: true,
        error: null as string | null
    });

    const fetchCharacters = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const params: CharacterListParams = {
                page,
                limit,
                search: searchTerm || undefined,
                sortBy: sortField,
                sortOrder: sortDirection
            };

            const result = await characterAPI.getCharacters(params);

            setState({
                characters: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages
                },
                loading: false,
                error: null
            });
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to load characters'
            }));
        }
    }, [page, limit, searchTerm, sortField, sortDirection]);

    useEffect(() => {
        fetchCharacters();
    }, [fetchCharacters]);

    return {
        ...state,
        refetch: fetchCharacters
    };
};