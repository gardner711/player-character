import React from 'react';

export interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    placeholder = "Search characters...",
    className
}) => {
    return (
        <div className={`search-bar ${className || ''}`}>
            <div className="search-input-container">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="search-input"
                    aria-label="Search characters"
                />
                <button
                    type="button"
                    className="search-icon"
                    aria-label="Search"
                >
                    🔍
                </button>
                {value && (
                    <button
                        type="button"
                        className="clear-search"
                        onClick={() => onChange('')}
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};