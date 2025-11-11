import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CharacterCreationData } from '../../types/character';

interface BackgroundStepProps {
    data: Partial<CharacterCreationData>;
    onComplete: (data: Partial<CharacterCreationData>) => void;
    onValidityChange?: (isValid: boolean) => void;
    validationSchema: z.ZodSchema;
}

type BackgroundFormData = {
    background?: string;
    alignment?: string;
    level: number;
    experiencePoints: number;
};

const backgroundOptions = [
    'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier'
];

const alignmentOptions = [
    'Lawful Good', 'Neutral Good', 'Chaotic Good',
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
];

export const BackgroundStep: React.FC<BackgroundStepProps> = ({
    data,
    onComplete,
    onValidityChange,
    validationSchema
}) => {
    const {
        register,
        watch,
        formState: { errors, isValid }
    } = useForm<BackgroundFormData>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            background: data.background || '',
            alignment: data.alignment || '',
            level: data.level || 1,
            experiencePoints: data.experiencePoints || 0
        },
        mode: 'onChange'
    });

    // Call onValidityChange when form validity changes
    useEffect(() => {
        onValidityChange?.(isValid);
    }, [isValid, onValidityChange]);

    // Call onComplete when form becomes valid
    useEffect(() => {
        if (isValid) {
            const formData = watch();
            onComplete({
                background: formData.background,
                alignment: formData.alignment,
                level: formData.level,
                experiencePoints: formData.experiencePoints
            });
        }
    }, [isValid, watch, onComplete]);

    return (
        <div className="background-step">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Background & Final Details</h2>

            <div className="space-y-6">
                <div>
                    <label htmlFor="background" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Background
                    </label>
                    <select
                        id="background"
                        {...register('background')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.background ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                    >
                        <option value="">Select a background (optional)</option>
                        {backgroundOptions.map((background) => (
                            <option key={background} value={background}>
                                {background}
                            </option>
                        ))}
                    </select>
                    {errors.background && (
                        <p className="mt-1 text-sm text-red-600">{errors.background.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="alignment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Alignment
                    </label>
                    <select
                        id="alignment"
                        {...register('alignment')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.alignment ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                    >
                        <option value="">Select an alignment (optional)</option>
                        {alignmentOptions.map((alignment) => (
                            <option key={alignment} value={alignment}>
                                {alignment}
                            </option>
                        ))}
                    </select>
                    {errors.alignment && (
                        <p className="mt-1 text-sm text-red-600">{errors.alignment.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Level *
                        </label>
                        <input
                            type="number"
                            id="level"
                            {...register('level', { valueAsNumber: true })}
                            min="1"
                            max="20"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.level ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        {errors.level && (
                            <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="experiencePoints" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Experience Points *
                        </label>
                        <input
                            type="number"
                            id="experiencePoints"
                            {...register('experiencePoints', { valueAsNumber: true })}
                            min="0"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.experiencePoints ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        {errors.experiencePoints && (
                            <p className="mt-1 text-sm text-red-600">{errors.experiencePoints.message}</p>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Character Summary</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        You're almost done! Review your character details above and click "Create Character" to save your new character.
                    </p>
                </div>

            </div>
        </div>
    );
};