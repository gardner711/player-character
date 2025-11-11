import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CharacterCreationData } from '../../types/character';
import { getSubraces } from '../../utils/validationSchemas';

interface BasicInfoStepProps {
    data: Partial<CharacterCreationData>;
    onComplete: (data: Partial<CharacterCreationData>) => void;
    onValidityChange?: (isValid: boolean) => void;
    validationSchema: z.ZodSchema;
}

type BasicInfoFormData = {
    characterName: string;
    playerName?: string;
    race: string;
    subrace?: string;
};

const raceOptions = [
    'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn',
    'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'
];

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
    data,
    onComplete,
    onValidityChange,
    validationSchema
}) => {
    const [availableSubraces, setAvailableSubraces] = useState<string[]>([]);

    const {
        register,
        watch,
        setValue,
        formState: { errors, isValid }
    } = useForm<BasicInfoFormData>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            characterName: data.characterName || '',
            playerName: data.playerName || '',
            race: data.race || '',
            subrace: data.subrace || ''
        },
        mode: 'onChange'
    });

    const watchedRace = watch('race');

    // Call onValidityChange when form validity changes
    useEffect(() => {
        onValidityChange?.(isValid);
    }, [isValid, onValidityChange]);

    // Call onComplete when form becomes valid
    useEffect(() => {
        if (isValid) {
            const formData = watch();
            onComplete({
                characterName: formData.characterName,
                playerName: formData.playerName,
                race: formData.race,
                subrace: formData.subrace
            });
        }
    }, [isValid, watch, onComplete]);

    useEffect(() => {
        if (watchedRace) {
            const subraces = getSubraces(watchedRace);
            setAvailableSubraces(subraces);

            // Clear subrace if it's not valid for the new race
            if (watch('subrace') && !subraces.includes(watch('subrace')!)) {
                setValue('subrace', '');
            }
        }
    }, [watchedRace, watch, setValue]);

    return (
        <div className="basic-info-step">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Basic Information</h2>

            <div className="space-y-6">
                <div>
                    <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Character Name *
                    </label>
                    <input
                        type="text"
                        id="characterName"
                        {...register('characterName')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.characterName ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                        placeholder="Enter character name"
                    />
                    {errors.characterName && (
                        <p className="mt-1 text-sm text-red-600">{errors.characterName.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Player Name
                    </label>
                    <input
                        type="text"
                        id="playerName"
                        {...register('playerName')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.playerName ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                        placeholder="Enter player name (optional)"
                    />
                    {errors.playerName && (
                        <p className="mt-1 text-sm text-red-600">{errors.playerName.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="race" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Race *
                    </label>
                    <select
                        id="race"
                        {...register('race')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.race ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                    >
                        <option value="">Select a race</option>
                        {raceOptions.map((race) => (
                            <option key={race} value={race}>
                                {race}
                            </option>
                        ))}
                    </select>
                    {errors.race && (
                        <p className="mt-1 text-sm text-red-600">{errors.race.message}</p>
                    )}
                </div>

                {availableSubraces.length > 0 && (
                    <div>
                        <label htmlFor="subrace" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Subrace
                        </label>
                        <select
                            id="subrace"
                            {...register('subrace')}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.subrace ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        >
                            <option value="">Select a subrace (optional)</option>
                            {availableSubraces.map((subrace) => (
                                <option key={subrace} value={subrace}>
                                    {subrace}
                                </option>
                            ))}
                        </select>
                        {errors.subrace && (
                            <p className="mt-1 text-sm text-red-600">{errors.subrace.message}</p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};