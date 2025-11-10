import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { characterAPI } from '../services/characterAPI';
import { CharacterCreationData } from '../types/character';
import { basicInfoSchema, classSchema, abilityScoresSchema, backgroundSchema } from '../utils/validationSchemas';
import { BasicInfoStep } from './wizard/BasicInfoStep';
import { ClassStep } from './wizard/ClassStep';
import { AbilityScoresStep } from './wizard/AbilityScoresStep';
import { BackgroundStep } from './wizard/BackgroundStep';
import { ProgressIndicator } from './wizard/ProgressIndicator';
import { StepNavigation } from './wizard/StepNavigation';

interface CharacterCreateProps {
    className?: string;
}

const CharacterCreate: React.FC<CharacterCreateProps> = ({ className }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [characterData, setCharacterData] = useState<Partial<CharacterCreationData>>({});
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const steps = [
        { component: BasicInfoStep, title: 'Basic Information', validationSchema: basicInfoSchema },
        { component: ClassStep, title: 'Class Selection', validationSchema: classSchema },
        { component: AbilityScoresStep, title: 'Ability Scores', validationSchema: abilityScoresSchema },
        { component: BackgroundStep, title: 'Background & Details', validationSchema: backgroundSchema }
    ];

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const canProceed = completedSteps.has(currentStep);

    const handleStepComplete = (stepData: Partial<CharacterCreationData>) => {
        setCharacterData(prev => ({ ...prev, ...stepData }));
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setApiError(null);
    };

    const handleNext = () => {
        if (canProceed && !isLastStep) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!canProceed || !isLastStep) return;

        // Validate that all required data is present
        const requiredFields = ['characterName', 'race', 'class', 'level', 'abilityScores'];
        const missingFields = requiredFields.filter(field => {
            if (field === 'abilityScores') {
                return !characterData.abilityScores ||
                    !characterData.abilityScores.strength ||
                    !characterData.abilityScores.dexterity ||
                    !characterData.abilityScores.constitution ||
                    !characterData.abilityScores.intelligence ||
                    !characterData.abilityScores.wisdom ||
                    !characterData.abilityScores.charisma;
            }
            return !characterData[field as keyof typeof characterData];
        });

        if (missingFields.length > 0) {
            setApiError(`Missing required fields: ${missingFields.join(', ')}`);
            return;
        }

        setIsSubmitting(true);
        setApiError(null);

        try {
            const createdCharacter = await characterAPI.createCharacter(characterData as CharacterCreationData);
            navigate(`/characters/${createdCharacter.id}`);
        } catch (error) {
            setApiError(error instanceof Error ? error.message : 'Failed to create character');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/characters');
    };

    const CurrentStepComponent = currentStepData.component;

    return (
        <div className={`character-create ${className}`}>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Create New Character</h1>

                <ProgressIndicator
                    currentStep={currentStep}
                    totalSteps={steps.length}
                    stepTitles={steps.map(s => s.title)}
                />

                <div className="wizard-content bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <CurrentStepComponent
                        data={characterData}
                        onComplete={handleStepComplete}
                        validationSchema={currentStepData.validationSchema}
                    />
                </div>

                {apiError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error creating character</h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-300">{apiError}</div>
                            </div>
                        </div>
                    </div>
                )}

                <StepNavigation
                    onPrevious={currentStep > 0 ? handlePrevious : undefined}
                    onNext={canProceed && !isLastStep ? handleNext : undefined}
                    onSubmit={canProceed && isLastStep ? handleSubmit : undefined}
                    onCancel={handleCancel}
                    canProceed={canProceed}
                    isLastStep={isLastStep}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
};

export default CharacterCreate;