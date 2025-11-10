import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacterList, SortField, SortDirection } from '../hooks/useCharacterList';
import { useSearch } from '../hooks/useSearch';
import { useSorting } from '../hooks/useSorting';
import { SearchBar } from './SearchBar';
import { SortDropdown } from './SortDropdown';
import { CharacterTile } from './CharacterTile';
import { Pagination } from './Pagination';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorState, EmptyState, EmptySearchState } from './StateComponents';
import '../CharacterList.css';

export interface CharacterListProps {
    pageSize?: number;
    onCharacterEdit?: (characterId: string) => void;
    className?: string;
    enableSearch?: boolean;
    enableSorting?: boolean;
    defaultSortField?: SortField;
    defaultSortDirection?: SortDirection;
}

export const CharacterList: React.FC<CharacterListProps> = ({
    pageSize = 20,
    onCharacterEdit,
    className,
    enableSearch = true,
    enableSorting = true,
    defaultSortField = 'createdAt',
    defaultSortDirection = 'desc'
}) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const { searchTerm, setSearchTerm, debouncedSearchTerm } = useSearch('');
    const { sortField, sortDirection, setSorting } = useSorting(defaultSortField, defaultSortDirection);

    const { characters, pagination, loading, error, refetch } = useCharacterList(
        currentPage,
        pageSize,
        debouncedSearchTerm,
        sortField,
        sortDirection
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleCharacterEdit = (characterId: string) => {
        if (onCharacterEdit) {
            onCharacterEdit(characterId);
        } else {
            navigate(`/edit/${characterId}`);
        }
    };

    const handleSortChange = (field: SortField, direction: SortDirection) => {
        setSorting(field, direction);
        setCurrentPage(1); // Reset to first page when sorting changes
    };

    if (loading) return <LoadingSkeleton count={pageSize} />;
    if (error) return <ErrorState error={error} onRetry={refetch} />;
    if (characters.length === 0 && !searchTerm) return <EmptyState />;

    return (
        <div className={`character-list ${className || ''}`}>
            <div className="character-list-controls">
                {enableSearch && (
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search characters by name..."
                    />
                )}
                {enableSorting && (
                    <SortDropdown
                        currentField={sortField}
                        currentDirection={sortDirection}
                        onSortChange={handleSortChange}
                    />
                )}
            </div>

            {characters.length === 0 && searchTerm ? (
                <EmptySearchState
                    searchTerm={searchTerm}
                    onClearSearch={() => setSearchTerm('')}
                />
            ) : (
                <>
                    <div className="character-grid">
                        {characters.map(character => (
                            <CharacterTile
                                key={character.id}
                                character={character}
                                onEdit={handleCharacterEdit}
                            />
                        ))}
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
};