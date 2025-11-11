import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CharacterCreationData } from '../../types/character';
import { calculatePointCost } from '../../utils/validationSchemas';

interface AbilityScoresStepProps {
    data: Partial<CharacterCreationData>;
    onComplete: (data: Partial<CharacterCreationData>) => void;
    onValidityChange?: (isValid: boolean) => void;
    validationSchema: z.ZodSchema;
}

type AbilityScoresFormData = {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
};

const abilities = [
    { key: 'strength', label: 'Strength', abbr: 'STR' },
    { key: 'dexterity', label: 'Dexterity', abbr: 'DEX' },
    { key: 'constitution', label: 'Constitution', abbr: 'CON' },
    { key: 'intelligence', label: 'Intelligence', abbr: 'INT' },
    { key: 'wisdom', label: 'Wisdom', abbr: 'WIS' },
    { key: 'charisma', label: 'Charisma', abbr: 'CHA' }
] as const;

const pointCosts = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 7, 9];

export const AbilityScoresStep: React.FC<AbilityScoresStepProps> = ({
    data,
    onComplete,
    onValidityChange,
    validationSchema
}) => {
    const [pointTotal, setPointTotal] = useState(0);

    const {
        register,
        watch,
        formState: { errors, isValid }
    } = useForm<AbilityScoresFormData>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            strength: data.abilityScores?.strength || 8,
            dexterity: data.abilityScores?.dexterity || 8,
            constitution: data.abilityScores?.constitution || 8,
            intelligence: data.abilityScores?.intelligence || 8,
            wisdom: data.abilityScores?.wisdom || 8,
            charisma: data.abilityScores?.charisma || 8
        },
        mode: 'onChange'
    });

    const watchedScores = watch();

    useEffect(() => {
        const total = calculatePointCost(watchedScores);
        setPointTotal(total);
    }, [watchedScores]);

    // Call onValidityChange when form validity changes
    useEffect(() => {
        onValidityChange?.(isValid);
    }, [isValid, onValidityChange]);

    // Call onComplete when form becomes valid
    useEffect(() => {
        if (isValid) {
            const formData = watch();
            onComplete({
                abilityScores: {
                    strength: formData.strength,
                    dexterity: formData.dexterity,
                    constitution: formData.constitution,
                    intelligence: formData.intelligence,
                    wisdom: formData.wisdom,
                    charisma: formData.charisma
                }
            });
        }
    }, [isValid, watch, onComplete]);

    const getModifier = (score: number) => {
        return Math.floor((score - 10) / 2);
    };

    const getPointCost = (score: number) => {
        return pointCosts[score] || 0;
    };

    return (
        <div className="ability-scores-step">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ability Scores</h2>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">Point Buy Total:</span>
                    <span className={`text-lg font-bold ${pointTotal > 27 ? 'text-red-600' : 'text-blue-600'}`}>
                        {pointTotal} / 27 points
                    </span>
                </div>
                {pointTotal > 27 && (
                    <p className="mt-2 text-sm text-red-600">
                        You have exceeded the 27 point limit. Please adjust your scores.
                    </p>
                )}
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {abilities.map((ability) => {
                        const score = watchedScores[ability.key as keyof AbilityScoresFormData] || 8;
                        const modifier = getModifier(score);
                        const cost = getPointCost(score);

                        return (
                            <div key={ability.key} className="ability-score-card p-4 border border-gray-200 rounded-md">
                                <div className="text-center mb-3">
                                    <h3 className="text-sm font-medium text-gray-700">{ability.label}</h3>
                                    <span className="text-xs text-gray-500">{ability.abbr}</span>
                                </div>

                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentValue = watch(ability.key as keyof AbilityScoresFormData) || 8;
                                            if (currentValue > 8) {
                                                // This is a simplified approach - in a real app you'd use setValue
                                                const input = document.getElementById(ability.key) as HTMLInputElement;
                                                if (input) {
                                                    input.value = (currentValue - 1).toString();
                                                    input.dispatchEvent(new Event('input', { bubbles: true }));
                                                }
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium"
                                    >
                                        -
                                    </button>

                                    <input
                                        type="number"
                                        id={ability.key}
                                        {...register(ability.key as keyof AbilityScoresFormData, { valueAsNumber: true })}
                                        min="8"
                                        max="20"
                                        className={`w-16 text-center px-2 py-1 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[ability.key as keyof AbilityScoresFormData] ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentValue = watch(ability.key as keyof AbilityScoresFormData) || 8;
                                            if (currentValue < 20) {
                                                const input = document.getElementById(ability.key) as HTMLInputElement;
                                                if (input) {
                                                    input.value = (currentValue + 1).toString();
                                                    input.dispatchEvent(new Event('input', { bubbles: true }));
                                                }
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="text-center">
                                    <div className="text-sm text-gray-600">Modifier: {modifier >= 0 ? '+' : ''}{modifier}</div>
                                    <div className="text-xs text-gray-500">Cost: {cost} points</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="text-sm text-red-600 text-center">
                        Please ensure all ability scores are between 8 and 20, and total point cost does not exceed 27.
                    </div>
                )}

            </div>
        </div>
    );
};