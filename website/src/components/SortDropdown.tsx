import React from 'react';
import { SortField, SortDirection } from '../hooks/useCharacterList';

export interface SortOption {
    field: SortField;
    label: string;
}

export interface SortDropdownProps {
    currentField: SortField;
    currentDirection: SortDirection;
    onSortChange: (field: SortField, direction: SortDirection) => void;
    className?: string;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
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
        { field: 'createdAt', label: 'Date Created' }
    ];

    return (
        <div className={`sort-dropdown ${className || ''}`}>
            <label htmlFor="sort-select" className="sort-label">
                Sort by:
            </label>
            <select
                id="sort-select"
                value={`${currentField}-${currentDirection}`}
                onChange={(e) => {
                    const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
                    onSortChange(field, direction);
                }}
                className="sort-select"
                aria-label="Sort characters"
            >
                {sortOptions.map(option => (
                    <React.Fragment key={option.field}>
                        <option value={`${option.field}-asc`}>
                            {option.label} (A-Z)
                        </option>
                        <option value={`${option.field}-desc`}>
                            {option.label} (Z-A)
                        </option>
                    </React.Fragment>
                ))}
            </select>
        </div>
    );
};