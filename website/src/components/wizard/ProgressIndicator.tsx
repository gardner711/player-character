import React from 'react';

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
    stepTitles: string[];
    className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    currentStep,
    totalSteps,
    stepTitles,
    className = ''
}) => {
    const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className={`progress-indicator mb-8 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                {stepTitles.map((title, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${index < currentStep
                                    ? 'bg-green-500 text-white'
                                    : index === currentStep
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                }`}
                        >
                            {index < currentStep ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                index + 1
                            )}
                        </div>
                        <span className={`text-xs text-center ${index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'
                            }`}>
                            {title}
                        </span>
                    </div>
                ))}
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>

            <div className="text-center mt-2">
                <span className="text-sm text-gray-600">
                    Step {currentStep + 1} of {totalSteps}
                </span>
            </div>
        </div>
    );
};