import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCharacterList, SortField, SortDirection } from '../hooks/useCharacterList';
import { useSearch } from '../hooks/useSearch';
import { useSorting } from '../hooks/useSorting';
import { SearchBar } from './SearchBar';
import { SortToggleButtons } from './SortToggleButtons';
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
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState(1);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { searchTerm, setSearchTerm, debouncedSearchTerm } = useSearch('');
    const { sortField, sortDirection, setSorting } = useSorting(defaultSortField, defaultSortDirection);

    const { characters, pagination, loading, error, refetch } = useCharacterList(
        currentPage,
        pageSize,
        debouncedSearchTerm,
        sortField,
        sortDirection
    );

    // Handle success message from navigation state
    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMessage(location.state.successMessage);
            // Clear the state to prevent showing the message again on refresh
            window.history.replaceState({}, document.title);
            // Auto-hide the message after 5 seconds
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [location.state]);

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
            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md flex items-center justify-between">
                    <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {successMessage}
                    </span>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="ml-4 text-green-700 hover:text-green-900"
                        aria-label="Dismiss success message"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
            <div className="character-list-controls">
                {enableSearch && (
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search characters by name..."
                    />
                )}
                {enableSorting && (
                    <SortToggleButtons
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