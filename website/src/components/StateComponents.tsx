import React from 'react';

export interface ErrorStateProps {
    error: string;
    onRetry?: () => void;
    className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    error,
    onRetry,
    className
}) => {
    return (
        <div className={`error-state ${className || ''}`} role="alert">
            <div className="error-content">
                <h3 className="error-title">Oops! Something went wrong</h3>
                <p className="error-message">{error}</p>
                {onRetry && (
                    <button
                        className="retry-button"
                        onClick={onRetry}
                        aria-label="Try again"
                    >
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

export interface EmptyStateProps {
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ className }) => {
    return (
        <div className={`empty-state ${className || ''}`}>
            <div className="empty-content">
                <h3 className="empty-title">No characters yet</h3>
                <p className="empty-message">
                    Get started by creating your first D&D character!
                </p>
                <a href="/create" className="create-first-button">
                    Create Your First Character
                </a>
            </div>
        </div>
    );
};

export interface EmptySearchStateProps {
    searchTerm: string;
    onClearSearch: () => void;
    className?: string;
}

export const EmptySearchState: React.FC<EmptySearchStateProps> = ({
    searchTerm,
    onClearSearch,
    className
}) => {
    return (
        <div className={`empty-search-state ${className || ''}`}>
            <div className="empty-content">
                <h3 className="empty-title">No characters found</h3>
                <p className="empty-message">
                    No characters match "{searchTerm}". Try adjusting your search terms.
                </p>
                <button
                    className="clear-search-button"
                    onClick={onClearSearch}
                    aria-label="Clear search and show all characters"
                >
                    Clear Search
                </button>
            </div>
        </div>
    );
};