import React from 'react';

interface StepNavigationProps {
    onPrevious?: () => void;
    onNext?: () => void;
    onSubmit?: () => void;
    onCancel: () => void;
    canProceed: boolean;
    isLastStep: boolean;
    isSubmitting?: boolean;
    className?: string;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
    onPrevious,
    onNext,
    onSubmit,
    onCancel,
    canProceed,
    isSubmitting = false,
    className = ''
}) => {
    return (
        <div className={`step-navigation flex justify-between items-center ${className}`}>
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Cancel
            </button>

            <div className="flex space-x-3">
                {onPrevious && (
                    <button
                        type="button"
                        onClick={onPrevious}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Previous
                    </button>
                )}

                {onNext && (
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!canProceed}
                        className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${canProceed
                            ? 'text-white bg-blue-600 hover:bg-blue-700'
                            : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                            }`}
                    >
                        Next
                    </button>
                )}

                {onSubmit && (
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={!canProceed || isSubmitting}
                        className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${canProceed && !isSubmitting
                            ? 'text-white bg-green-600 hover:bg-green-700'
                            : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                            }`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </div>
                        ) : (
                            'Create Character'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};