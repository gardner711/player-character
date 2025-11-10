import { z } from 'zod';

// Basic Info Schema
export const basicInfoSchema = z.object({
    characterName: z.string()
        .min(1, "Character name is required")
        .max(50, "Character name must be 50 characters or less")
        .regex(/^[a-zA-Z\s'-]+$/, "Character name can only contain letters, spaces, hyphens, and apostrophes"),

    playerName: z.string()
        .max(50, "Player name must be 50 characters or less")
        .optional()
        .or(z.literal("")),

    race: z.enum([
        'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn',
        'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'
    ], { message: "Please select a valid race" }),

    subrace: z.string().optional()
}).refine((data) => {
    // Validate subrace compatibility with race
    if (data.subrace && !getSubraces(data.race).includes(data.subrace)) {
        return false;
    }
    return true;
}, {
    message: "Selected subrace is not compatible with chosen race",
    path: ["subrace"]
});

// Class Schema
export const classSchema = z.object({
    class: z.enum([
        'Fighter', 'Wizard', 'Rogue', 'Cleric', 'Barbarian',
        'Bard', 'Druid', 'Monk', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock'
    ], { message: "Please select a valid class" }),

    subclass: z.string().optional(),

    multiclass: z.array(z.object({
        class: z.string(),
        subclass: z.string().optional(),
        level: z.number().min(1).max(20)
    })).optional()
}).refine((data) => {
    // Validate total level doesn't exceed 20
    const multiclassLevels = data.multiclass?.reduce((sum, mc) => sum + mc.level, 0) || 0;
    return multiclassLevels <= 19; // Leave room for primary class
}, {
    message: "Total multiclass levels cannot exceed 19",
    path: ["multiclass"]
});

// Ability Scores Schema
export const abilityScoresSchema = z.object({
    strength: z.number().min(8).max(20),
    dexterity: z.number().min(8).max(20),
    constitution: z.number().min(8).max(20),
    intelligence: z.number().min(8).max(20),
    wisdom: z.number().min(8).max(20),
    charisma: z.number().min(8).max(20)
}).refine((scores) => {
    const totalCost = calculatePointCost(scores);
    return totalCost <= 27;
}, {
    message: "Ability score combination exceeds 27 point buy limit",
    path: ["strength"] // Will show on first field
});

// Background Schema
export const backgroundSchema = z.object({
    background: z.enum([
        'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier'
    ]).optional(),

    alignment: z.enum([
        'Lawful Good', 'Neutral Good', 'Chaotic Good',
        'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
        'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
    ]).optional(),

    level: z.number().min(1).max(20).default(1),
    experiencePoints: z.number().min(0).default(0)
});

// Complete Character Creation Schema
export const characterCreationSchema = z.object({
    characterName: z.string()
        .min(1, "Character name is required")
        .max(50, "Character name must be 50 characters or less")
        .regex(/^[a-zA-Z\s'-]+$/, "Character name can only contain letters, spaces, hyphens, and apostrophes"),

    playerName: z.string()
        .max(50, "Player name must be 50 characters or less")
        .optional()
        .or(z.literal("")),

    race: z.enum([
        'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn',
        'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'
    ], { message: "Please select a valid race" }),

    subrace: z.string().optional(),

    class: z.enum([
        'Fighter', 'Wizard', 'Rogue', 'Cleric', 'Barbarian',
        'Bard', 'Druid', 'Monk', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock'
    ], { message: "Please select a valid class" }),

    subclass: z.string().optional(),

    multiclass: z.array(z.object({
        class: z.string(),
        subclass: z.string().optional(),
        level: z.number().min(1).max(20)
    })).optional(),

    level: z.number().min(1).max(20).default(1),

    experiencePoints: z.number().min(0).default(0),

    background: z.enum([
        'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier'
    ]).optional(),

    alignment: z.enum([
        'Lawful Good', 'Neutral Good', 'Chaotic Good',
        'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
        'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
    ]).optional(),

    abilityScores: z.object({
        strength: z.number().min(8).max(20),
        dexterity: z.number().min(8).max(20),
        constitution: z.number().min(8).max(20),
        intelligence: z.number().min(8).max(20),
        wisdom: z.number().min(8).max(20),
        charisma: z.number().min(8).max(20)
    })
}).refine((data) => {
    // Validate subrace compatibility with race
    if (data.subrace && !getSubraces(data.race).includes(data.subrace)) {
        return false;
    }
    return true;
}, {
    message: "Selected subrace is not compatible with chosen race",
    path: ["subrace"]
}).refine((data) => {
    // Validate total level doesn't exceed 20
    const multiclassLevels = data.multiclass?.reduce((sum, mc) => sum + mc.level, 0) || 0;
    return multiclassLevels <= 19;
}, {
    message: "Total multiclass levels cannot exceed 19",
    path: ["multiclass"]
}).refine((data) => {
    // Validate ability scores point buy
    const totalCost = calculatePointCost(data.abilityScores);
    return totalCost <= 27;
}, {
    message: "Ability score combination exceeds 27 point buy limit",
    path: ["abilityScores", "strength"]
});

// Utility functions
export function getSubraces(race: string): string[] {
    const subraceMap: Record<string, string[]> = {
        'Elf': ['High Elf', 'Wood Elf', 'Dark Elf'],
        'Dwarf': ['Hill Dwarf', 'Mountain Dwarf'],
        'Halfling': ['Lightfoot', 'Stout'],
        'Gnome': ['Forest Gnome', 'Rock Gnome']
    };
    return subraceMap[race] || [];
}

export function calculatePointCost(scores: { [key: string]: number }): number {
    const abilityCosts = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 7, 9];
    return Object.values(scores).reduce((total, score) => {
        return total + (abilityCosts[score] || 0);
    }, 0);
}

export function getRacialBonuses(race: string, subrace?: string): { [key: string]: number } {
    const racialBonuses: Record<string, { [key: string]: number }> = {
        'Human': { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
        'Elf': { dexterity: 2 },
        'Dwarf': { constitution: 2 },
        'Halfling': { dexterity: 2 },
        'Dragonborn': { strength: 2, charisma: 1 },
        'Gnome': { intelligence: 2 },
        'Half-Elf': { charisma: 2 }, // Plus two other ability scores +1
        'Half-Orc': { strength: 2, constitution: 1 },
        'Tiefling': { intelligence: 1, charisma: 2 }
    };

    const baseBonuses = racialBonuses[race] || {};

    // Add subrace bonuses
    if (subrace) {
        const subraceBonuses: Record<string, { [key: string]: number }> = {
            'High Elf': { intelligence: 1 },
            'Wood Elf': { wisdom: 1 },
            'Dark Elf': { charisma: 1 },
            'Hill Dwarf': { wisdom: 1 },
            'Mountain Dwarf': { strength: 2 },
            'Lightfoot': { charisma: 1 },
            'Stout': { constitution: 1 },
            'Forest Gnome': { dexterity: 1 },
            'Rock Gnome': { constitution: 1 }
        };

        const subBonuses = subraceBonuses[subrace] || {};
        Object.entries(subBonuses).forEach(([ability, bonus]) => {
            baseBonuses[ability] = (baseBonuses[ability] || 0) + bonus;
        });
    }

    return baseBonuses;
}