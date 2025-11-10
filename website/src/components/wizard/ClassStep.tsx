import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CharacterCreationData } from '../../types/character';

interface ClassStepProps {
    data: Partial<CharacterCreationData>;
    onComplete: (data: Partial<CharacterCreationData>) => void;
    validationSchema: z.ZodSchema;
}

type ClassFormData = {
    class: string;
    subclass?: string;
    multiclass?: Array<{
        class: string;
        subclass?: string;
        level: number;
    }>;
};

const classOptions = [
    'Fighter', 'Wizard', 'Rogue', 'Cleric', 'Barbarian',
    'Bard', 'Druid', 'Monk', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock'
];

// Simple subclass mapping - in a real app this would be more comprehensive
const subclassOptions: Record<string, string[]> = {
    'Fighter': ['Champion', 'Battle Master', 'Eldritch Knight'],
    'Wizard': ['School of Abjuration', 'School of Conjuration', 'School of Divination'],
    'Rogue': ['Thief', 'Assassin', 'Arcane Trickster'],
    'Cleric': ['Knowledge Domain', 'Life Domain', 'Light Domain'],
    'Barbarian': ['Path of the Berserker', 'Path of the Totem Warrior'],
    'Bard': ['College of Lore', 'College of Valor'],
    'Druid': ['Circle of the Land', 'Circle of the Moon'],
    'Monk': ['Way of the Open Hand', 'Way of Shadow'],
    'Paladin': ['Oath of Devotion', 'Oath of the Ancients'],
    'Ranger': ['Hunter', 'Beast Master'],
    'Sorcerer': ['Draconic Bloodline', 'Wild Magic'],
    'Warlock': ['The Fiend', 'The Great Old One']
};

export const ClassStep: React.FC<ClassStepProps> = ({
    data,
    onComplete,
    validationSchema
}) => {
    const [showMulticlass, setShowMulticlass] = useState<boolean>(
        (data.multiclass && data.multiclass.length > 0) || false
    );

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors, isValid }
    } = useForm<ClassFormData>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            class: data.class || '',
            subclass: data.subclass || '',
            multiclass: data.multiclass || []
        },
        mode: 'onChange'
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'multiclass'
    });

    const watchedClass = watch('class');

    const onSubmit = (formData: ClassFormData) => {
        onComplete({
            class: formData.class,
            subclass: formData.subclass,
            multiclass: showMulticlass ? formData.multiclass : undefined
        });
    };

    const addMulticlass = () => {
        append({ class: '', subclass: '', level: 1 });
    };

    const availableSubclasses = watchedClass ? subclassOptions[watchedClass] || [] : [];

    return (
        <div className="class-step">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Class Selection</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Class *
                    </label>
                    <select
                        id="class"
                        {...register('class')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.class ? 'border-red-300' : 'border-gray-300'
                            }`}
                    >
                        <option value="">Select a class</option>
                        {classOptions.map((className) => (
                            <option key={className} value={className}>
                                {className}
                            </option>
                        ))}
                    </select>
                    {errors.class && (
                        <p className="mt-1 text-sm text-red-600">{errors.class.message}</p>
                    )}
                </div>

                {availableSubclasses.length > 0 && (
                    <div>
                        <label htmlFor="subclass" className="block text-sm font-medium text-gray-700 mb-1">
                            Subclass
                        </label>
                        <select
                            id="subclass"
                            {...register('subclass')}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.subclass ? 'border-red-300' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Select a subclass (optional)</option>
                            {availableSubclasses.map((subclass) => (
                                <option key={subclass} value={subclass}>
                                    {subclass}
                                </option>
                            ))}
                        </select>
                        {errors.subclass && (
                            <p className="mt-1 text-sm text-red-600">{errors.subclass.message}</p>
                        )}
                    </div>
                )}

                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={showMulticlass}
                            onChange={(e) => setShowMulticlass(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Multiclass character</span>
                    </label>
                </div>

                {showMulticlass && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Additional Classes</h3>

                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border border-gray-200 rounded-md">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-sm font-medium text-gray-700">Class {index + 2}</h4>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Class
                                        </label>
                                        <select
                                            {...register(`multiclass.${index}.class`)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select class</option>
                                            {classOptions.map((className) => (
                                                <option key={className} value={className}>
                                                    {className}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Level
                                        </label>
                                        <input
                                            type="number"
                                            {...register(`multiclass.${index}.level`, { valueAsNumber: true })}
                                            min="1"
                                            max="20"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Subclass
                                        </label>
                                        <input
                                            type="text"
                                            {...register(`multiclass.${index}.subclass`)}
                                            placeholder="Optional"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addMulticlass}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            + Add Another Class
                        </button>
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!isValid}
                        className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isValid
                                ? 'text-white bg-blue-600 hover:bg-blue-700'
                                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                            }`}
                    >
                        Continue to Ability Scores
                    </button>
                </div>
            </form>
        </div>
    );
};