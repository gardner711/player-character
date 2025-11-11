import React from 'react';
import { SortField, SortDirection } from '../hooks/useCharacterList';

export interface SortOption {
    field: SortField;
    label: string;
}

export interface SortToggleButtonsProps {
    currentField: SortField;
    currentDirection: SortDirection;
    onSortChange: (field: SortField, direction: SortDirection) => void;
    className?: string;
}

export const SortToggleButtons: React.FC<SortToggleButtonsProps> = ({
    currentField,
    currentDirection,
    onSortChange,
    className
}) => {
    const sortOptions: SortOption[] = [
        { field: 'characterName', label: 'Name' },
        { field: 'level', label: 'Level' },
        { field: 'race', label: 'Race' },
        { field: 'class', label: 'Class' },
        { field: 'createdAt', label: 'Date' }
    ];

    const handleSortToggle = (field: SortField) => {
        if (currentField === field) {
            // Toggle direction if same field
            const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
            onSortChange(field, newDirection);
        } else {
            // Switch to new field with ascending direction
            onSortChange(field, 'asc');
        }
    };

    return (
        <div className={`sort-toggle-buttons ${className || ''}`}>
            <span className="sort-label">Sort by:</span>
            <div className="sort-buttons">
                {sortOptions.map(option => {
                    const isActive = currentField === option.field;
                    const directionIcon = isActive
                        ? (currentDirection === 'asc' ? '↑' : '↓')
                        : '';

                    return (
                        <button
                            key={option.field}
                            onClick={() => handleSortToggle(option.field)}
                            className={`sort-button ${isActive ? 'active' : ''}`}
                            aria-label={`Sort by ${option.label} ${isActive ? (currentDirection === 'asc' ? 'ascending' : 'descending') : ''}`}
                        >
                            {option.label}
                            {directionIcon && <span className="direction-icon">{directionIcon}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};