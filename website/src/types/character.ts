// Character types based on D&D 5e character schema

export interface AbilityScore {
    score: number;
    modifier: number;
    savingThrowProficiency: boolean;
}

export interface AbilityScores {
    strength: AbilityScore;
    dexterity: AbilityScore;
    constitution: AbilityScore;
    intelligence: AbilityScore;
    wisdom: AbilityScore;
    charisma: AbilityScore;
}

export interface MulticlassEntry {
    class: string;
    subclass?: string;
    level: number;
}

export interface Character {
    id?: string;
    characterName: string;
    playerName?: string;
    race: string;
    subrace?: string;
    class: string;
    subclass?: string;
    multiclass?: MulticlassEntry[];
    level: number;
    experiencePoints?: number;
    background?: string;
    alignment?: string;
    abilityScores: AbilityScores;
    proficiencyBonus: number;
    createdAt?: string;
    updatedAt?: string;
}

// API Response types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CharacterListParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Form types for character creation/editing
export interface CharacterCreationData {
    characterName: string;
    playerName?: string;
    race: string;
    subrace?: string;
    class: string;
    subclass?: string;
    multiclass?: MulticlassEntry[];
    level: number;
    experiencePoints?: number;
    background?: string;
    alignment?: string;
    abilityScores: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    };
}

export interface CharacterEditData extends Partial<CharacterCreationData> { }

// API Error types
export interface ApiError {
    message: string;
    status: number;
    details?: any;
}