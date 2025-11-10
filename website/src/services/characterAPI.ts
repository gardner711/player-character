import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
    Character,
    CharacterCreationData,
    ApiResponse,
    PaginatedResponse,
    CharacterListParams,
    ApiError
} from '../types/character';
import { API_BASE_URL } from '../config/config';

export class CharacterAPIClient {
    private client: AxiosInstance;

    constructor(baseURL: string = API_BASE_URL) {
        this.client = axios.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                // Log validation errors to console as per ENB-980001
                if (error.response?.status === 400 && error.response?.data?.errors) {
                    console.log('Validation errors:', error.response.data.errors);
                }

                const apiError: ApiError = {
                    message: error.response?.data?.message || error.message || 'An unexpected error occurred',
                    status: error.response?.status || 500,
                    details: error.response?.data
                };
                return Promise.reject(apiError);
            }
        );
    }

    // Get all characters with optional filtering, sorting, and pagination
    async getCharacters(params?: CharacterListParams): Promise<PaginatedResponse<Character>> {
        try {
            const response: AxiosResponse<PaginatedResponse<Character>> = await this.client.get('/api/characters', {
                params
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Get a single character by ID
    async getCharacter(id: string): Promise<Character> {
        try {
            const response: AxiosResponse<ApiResponse<Character>> = await this.client.get(`/api/characters/${id}`);
            return response.data.data;
        } catch (error) {
            throw error;
        }
    }

    // Create a new character
    async createCharacter(characterData: CharacterCreationData): Promise<Character> {
        try {
            // Validate that required data is present
            if (!characterData.characterName || !characterData.race || !characterData.class || !characterData.abilityScores) {
                throw new Error('Missing required character data');
            }

            // Validate ability scores are reasonable
            const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            for (const ability of abilities) {
                const score = characterData.abilityScores[ability as keyof typeof characterData.abilityScores];
                if (!score || score < 1 || score > 20) {
                    throw new Error(`Invalid ${ability} score: ${score}`);
                }
            }

            // Transform the creation data to match the API schema
            const transformedData = this.transformCreationData(characterData);

            const response: AxiosResponse<ApiResponse<Character>> = await this.client.post('/api/characters', transformedData);
            return response.data.data;
        } catch (error) {
            throw error;
        }
    }

    // Update an existing character
    async updateCharacter(id: string, characterData: Partial<CharacterCreationData>): Promise<Character> {
        try {
            // Transform the update data to match the API schema
            const transformedData = this.transformUpdateData(characterData);

            const response: AxiosResponse<ApiResponse<Character>> = await this.client.put(`/api/characters/${id}`, transformedData);
            return response.data.data;
        } catch (error) {
            throw error;
        }
    }

    // Delete a character
    async deleteCharacter(id: string): Promise<void> {
        try {
            await this.client.delete(`/api/characters/${id}`);
        } catch (error) {
            throw error;
        }
    }

    // Health check endpoint
    async healthCheck(): Promise<{ status: string }> {
        try {
            const response: AxiosResponse<{ status: string }> = await this.client.get('/health');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Transform creation data to match API schema
    private transformCreationData(data: CharacterCreationData): any {
        const result: any = {
            characterName: data.characterName,
            playerName: data.playerName,
            race: data.race,
            subrace: data.subrace,
            class: data.class,
            subclass: data.subclass,
            multiclass: data.multiclass,
            level: data.level,
            experiencePoints: data.experiencePoints || 0,
            background: data.background,
            abilityScores: {
                strength: {
                    base: data.abilityScores.strength
                },
                dexterity: {
                    base: data.abilityScores.dexterity
                },
                constitution: {
                    base: data.abilityScores.constitution
                },
                intelligence: {
                    base: data.abilityScores.intelligence
                },
                wisdom: {
                    base: data.abilityScores.wisdom
                },
                charisma: {
                    base: data.abilityScores.charisma
                }
            },
            proficiencyBonus: this.calculateProficiencyBonus(data.level)
        };

        // Only include alignment if it's not empty
        if (data.alignment && data.alignment.trim() !== '') {
            result.alignment = data.alignment;
        }

        return result;
    }

    // Transform update data to match API schema
    private transformUpdateData(data: Partial<CharacterCreationData>): any {
        const transformed: any = {};

        if (data.characterName !== undefined) transformed.characterName = data.characterName;
        if (data.playerName !== undefined) transformed.playerName = data.playerName;
        if (data.race !== undefined) transformed.race = data.race;
        if (data.subrace !== undefined) transformed.subrace = data.subrace;
        if (data.class !== undefined) transformed.class = data.class;
        if (data.subclass !== undefined) transformed.subclass = data.subclass;
        if (data.multiclass !== undefined) transformed.multiclass = data.multiclass;
        if (data.level !== undefined) {
            transformed.level = data.level;
            transformed.proficiencyBonus = this.calculateProficiencyBonus(data.level);
        }
        if (data.experiencePoints !== undefined) transformed.experiencePoints = data.experiencePoints;
        if (data.background !== undefined) transformed.background = data.background;
        if (data.alignment !== undefined) transformed.alignment = data.alignment;

        if (data.abilityScores) {
            transformed.abilityScores = {};
            Object.entries(data.abilityScores).forEach(([ability, score]) => {
                transformed.abilityScores[ability] = {
                    base: score
                };
            });
        }

        return transformed;
    }

    // Calculate proficiency bonus based on character level
    private calculateProficiencyBonus(level: number): number {
        if (level >= 17) return 6;
        if (level >= 13) return 5;
        if (level >= 9) return 4;
        if (level >= 5) return 3;
        return 2;
    }

    // Set the authorization token if needed
    setAuthToken(token: string): void {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Remove the authorization token
    removeAuthToken(): void {
        delete this.client.defaults.headers.common['Authorization'];
    }
}

// Export a default instance
export const characterAPI = new CharacterAPIClient();