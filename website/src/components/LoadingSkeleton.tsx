import React from 'react';

export interface LoadingSkeletonProps {
    count?: number;
    className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    count = 6,
    className
}) => {
    return (
        <div className={`loading-skeleton ${className || ''}`}>
            <div className="skeleton-header">
                <div className="skeleton-bar skeleton-search"></div>
                <div className="skeleton-bar skeleton-sort"></div>
            </div>
            <div className="skeleton-grid">
                {Array.from({ length: count }, (_, index) => (
                    <div key={index} className="skeleton-tile">
                        <div className="skeleton-bar skeleton-name"></div>
                        <div className="skeleton-bar skeleton-details"></div>
                        <div className="skeleton-bar skeleton-background"></div>
                        <div className="skeleton-bar skeleton-button"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};