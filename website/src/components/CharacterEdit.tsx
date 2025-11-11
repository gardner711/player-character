import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { characterAPI } from '../services/characterAPI';
import { Character, CharacterCreationData } from '../types/character';
import { basicInfoSchema, classSchema, abilityScoresSchema, backgroundSchema } from '../utils/validationSchemas';
import { BasicInfoStep } from './wizard/BasicInfoStep';
import { ClassStep } from './wizard/ClassStep';
import { AbilityScoresStep } from './wizard/AbilityScoresStep';
import { BackgroundStep } from './wizard/BackgroundStep';
import { ProgressIndicator } from './wizard/ProgressIndicator';
import { StepNavigation } from './wizard/StepNavigation';
import { JsonEditPreviewPanel } from './wizard/JsonEditPreviewPanel';
import { logger } from '../utils/logger';

const CharacterEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [originalCharacter, setOriginalCharacter] = useState<Character | null>(null);
    const [characterData, setCharacterData] = useState<Partial<CharacterCreationData>>({});
    const [stepValidity, setStepValidity] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
    const [showJsonPreview, setShowJsonPreview] = useState(false);

    const steps = [
        { component: BasicInfoStep, title: 'Basic Information', validationSchema: basicInfoSchema },
        { component: ClassStep, title: 'Class Selection', validationSchema: classSchema },
        { component: AbilityScoresStep, title: 'Ability Scores', validationSchema: abilityScoresSchema },
        { component: BackgroundStep, title: 'Background & Details', validationSchema: backgroundSchema }
    ];

    // Load character data on mount
    useEffect(() => {
        const loadCharacter = async () => {
            if (!id) return;

            try {
                logger.debug('Loading character for editing', { characterId: id });
                const character = await characterAPI.getCharacter(id);
                setOriginalCharacter(character);
                // Convert Character to CharacterCreationData format
                setCharacterData({
                    characterName: character.characterName,
                    playerName: character.playerName,
                    race: character.race,
                    subrace: character.subrace,
                    class: character.class,
                    subclass: character.subclass,
                    multiclass: character.multiclass,
                    level: character.level,
                    experiencePoints: character.experiencePoints,
                    background: character.background,
                    alignment: character.alignment,
                    abilityScores: {
                        strength: character.abilityScores.strength.score,
                        dexterity: character.abilityScores.dexterity.score,
                        constitution: character.abilityScores.constitution.score,
                        intelligence: character.abilityScores.intelligence.score,
                        wisdom: character.abilityScores.wisdom.score,
                        charisma: character.abilityScores.charisma.score
                    }
                });
                logger.debug('Character loaded for editing', { characterId: id, characterName: character.characterName });
                setIsLoading(false);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to load character';
                logger.error('Failed to load character for editing', error as Error, { characterId: id, errorMessage });
                setApiError(errorMessage);
                setIsLoading(false);
            }
        };

        loadCharacter();
    }, [id]);

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const canProceed = stepValidity[currentStep] || false;
    const hasChanges = modifiedFields.size > 0;

    const getModifiedFields = (original: Character, current: Partial<CharacterCreationData>): Set<string> => {
        const changes = new Set<string>();

        // Check basic info
        if (current.characterName !== original.characterName) changes.add('characterName');
        if (current.playerName !== original.playerName) changes.add('playerName');
        if (current.race !== original.race) changes.add('race');
        if (current.subrace !== original.subrace) changes.add('subrace');

        // Check class
        if (current.class !== original.class) changes.add('class');
        if (current.subclass !== original.subclass) changes.add('subclass');
        if (JSON.stringify(current.multiclass) !== JSON.stringify(original.multiclass)) changes.add('multiclass');

        // Check ability scores
        if (JSON.stringify(current.abilityScores) !== JSON.stringify(original.abilityScores)) changes.add('abilityScores');

        // Check background
        if (current.background !== original.background) changes.add('background');
        if (current.alignment !== original.alignment) changes.add('alignment');
        if (current.level !== original.level) changes.add('level');
        if (current.experiencePoints !== original.experiencePoints) changes.add('experiencePoints');

        return changes;
    };

    const handleStepComplete = (stepData: Partial<CharacterCreationData>) => {
        const newData = { ...characterData, ...stepData };
        setCharacterData(newData);
        setApiError(null);

        // Track changes
        if (originalCharacter) {
            const changes = getModifiedFields(originalCharacter, newData);
            setModifiedFields(changes);
        }
    };

    const handleStepValidityChange = (stepIndex: number, isValid: boolean) => {
        setStepValidity(prev => ({ ...prev, [stepIndex]: isValid }));
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
        if (!canProceed || !isLastStep || !id) return;

        setIsSubmitting(true);
        setApiError(null);

        try {
            logger.info('Updating character', { characterId: id, modifiedFields: Array.from(modifiedFields) });
            const updatedCharacter = await characterAPI.updateCharacter(id, characterData);
            logger.info('Character update successful', { characterId: id, characterName: updatedCharacter.characterName });
            navigate('/', { state: { successMessage: `Character "${updatedCharacter.characterName}" updated successfully!` } });
        } catch (error) {
            if (error instanceof Error && 'status' in error && error.status === 409) {
                const errorMessage = 'Character was modified by another user. Please refresh and try again.';
                logger.warn('Character update conflict', { characterId: id, error: error.message });
                setApiError(errorMessage);
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Failed to update character';
                logger.error('Character update failed', error as Error, { characterId: id, errorMessage });
                setApiError(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (hasChanges) {
            const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
            if (!confirmed) return;
        }
        navigate('/');
    };

    const CurrentStepComponent = currentStepData.component;

    if (isLoading) {
        return (
            <div className="character-edit">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-gray-600">Loading character...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!originalCharacter) {
        return (
            <div className="character-edit">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Character Not Found</h2>
                        <p className="text-gray-600 mb-6">The character you're trying to edit could not be found.</p>
                        <button
                            onClick={() => navigate('/characters')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Back to Characters
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="character-edit">
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Character</h1>
                <p className="text-gray-600 mb-8">
                    {originalCharacter.characterName} - Level {originalCharacter.level} {originalCharacter.race} {originalCharacter.class}
                </p>

                <ProgressIndicator
                    currentStep={currentStep}
                    totalSteps={steps.length}
                    stepTitles={steps.map(s => s.title)}
                />

                <div className="wizard-content bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <CurrentStepComponent
                        data={characterData}
                        onComplete={handleStepComplete}
                        onValidityChange={(isValid: boolean) => handleStepValidityChange(currentStep, isValid)}
                        validationSchema={currentStepData.validationSchema}
                    />
                </div>

                {apiError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error updating character</h3>
                                <div className="mt-2 text-sm text-red-700">{apiError}</div>
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

                <JsonEditPreviewPanel
                    originalCharacter={originalCharacter}
                    currentData={characterData}
                    modifiedFields={modifiedFields}
                    isVisible={showJsonPreview}
                    onToggleVisibility={() => setShowJsonPreview(!showJsonPreview)}
                />
            </div>
        </div>
    );
};

export default CharacterEdit;