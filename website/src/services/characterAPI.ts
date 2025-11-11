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
import { logger } from '../utils/logger';

export class CharacterAPIClient {
    private client: AxiosInstance;
    private requestTimings: Map<string, number> = new Map();

    constructor(baseURL: string = API_BASE_URL) {
        this.client = axios.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        logger.info('CharacterAPI client initialized', { baseURL });

        // Add request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                const startTime = Date.now();
                const requestId = `${config.method}-${config.url}-${startTime}`;
                this.requestTimings.set(requestId, startTime);
                (config as any).requestId = requestId;
                logger.logApiRequest(config.method?.toUpperCase() || 'GET', config.url || '', {
                    baseURL: config.baseURL,
                    timeout: config.timeout
                });
                return config;
            },
            (error) => {
                logger.error('API Request failed', error, { url: error.config?.url });
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling and logging
        this.client.interceptors.response.use(
            (response) => {
                const requestId = (response.config as any).requestId;
                const startTime = requestId ? this.requestTimings.get(requestId) : undefined;
                const duration = startTime ? Date.now() - startTime : undefined;
                if (requestId) this.requestTimings.delete(requestId);
                logger.logApiResponse(
                    response.config.method?.toUpperCase() || 'GET',
                    response.config.url || '',
                    response.status,
                    duration,
                    { baseURL: response.config.baseURL }
                );
                return response;
            },
            (error) => {
                const requestId = (error.config as any)?.requestId;
                const startTime = requestId ? this.requestTimings.get(requestId) : undefined;
                const duration = startTime ? Date.now() - startTime : undefined;
                if (requestId) this.requestTimings.delete(requestId);

                // Log validation errors as per ENB-980001
                if (error.response?.status === 400 && error.response?.data?.errors) {
                    logger.warn('API validation errors', {
                        errors: error.response.data.errors,
                        url: error.config?.url,
                        method: error.config?.method?.toUpperCase(),
                        duration
                    });
                } else {
                    logger.error('API request failed', error, {
                        url: error.config?.url,
                        method: error.config?.method?.toUpperCase(),
                        status: error.response?.status,
                        duration
                    });
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
            logger.debug('Fetching characters', { params });
            const response: AxiosResponse<PaginatedResponse<Character>> = await this.client.get('/api/characters', {
                params
            });
            logger.debug('Characters fetched successfully', { count: response.data.data?.length });
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch characters', error as Error, { params });
            throw error;
        }
    }

    // Get a single character by ID
    async getCharacter(id: string): Promise<Character> {
        try {
            logger.debug('Fetching character', { characterId: id });
            const response: AxiosResponse<ApiResponse<Character>> = await this.client.get(`/api/characters/${id}`);
            logger.debug('Character fetched successfully', { characterId: id, characterName: response.data.data?.characterName });
            return response.data.data;
        } catch (error) {
            logger.error('Failed to fetch character', error as Error, { characterId: id });
            throw error;
        }
    }

    // Create a new character
    async createCharacter(characterData: CharacterCreationData): Promise<Character> {
        try {
            logger.debug('Creating character', { characterName: characterData.characterName, race: characterData.race, class: characterData.class });

            // Validate that required data is present
            if (!characterData.characterName || !characterData.race || !characterData.class || !characterData.abilityScores) {
                logger.error('Missing required character data', new Error('Validation failed'), { characterData });
                throw new Error('Missing required character data');
            }

            // Validate ability scores are reasonable
            const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            for (const ability of abilities) {
                const score = characterData.abilityScores[ability as keyof typeof characterData.abilityScores];
                if (!score || score < 1 || score > 20) {
                    logger.error(`Invalid ${ability} score`, new Error('Validation failed'), { ability, score });
                    throw new Error(`Invalid ${ability} score: ${score}`);
                }
            }

            // Transform the creation data to match the API schema
            const transformedData = this.transformCreationData(characterData);

            const response: AxiosResponse<ApiResponse<Character>> = await this.client.post('/api/characters', transformedData);
            logger.info('Character created successfully', { characterId: response.data.data?.id, characterName: response.data.data?.characterName });
            return response.data.data;
        } catch (error) {
            logger.error('Failed to create character', error as Error, { characterName: characterData?.characterName });
            throw error;
        }
    }

    // Update an existing character
    async updateCharacter(id: string, characterData: Partial<CharacterCreationData>): Promise<Character> {
        try {
            logger.debug('Updating character', { characterId: id, updates: Object.keys(characterData) });

            // Transform the update data to match the API schema
            const transformedData = this.transformUpdateData(characterData);

            const response: AxiosResponse<ApiResponse<Character>> = await this.client.put(`/api/characters/${id}`, transformedData);
            logger.info('Character updated successfully', { characterId: id, characterName: response.data.data?.characterName });
            return response.data.data;
        } catch (error) {
            logger.error('Failed to update character', error as Error, { characterId: id });
            throw error;
        }
    }

    // Delete a character
    async deleteCharacter(id: string): Promise<void> {
        try {
            logger.debug('Deleting character', { characterId: id });
            await this.client.delete(`/api/characters/${id}`);
            logger.info('Character deleted successfully', { characterId: id });
        } catch (error) {
            logger.error('Failed to delete character', error as Error, { characterId: id });
            throw error;
        }
    }

    // Health check endpoint
    async healthCheck(): Promise<{ status: string }> {
        try {
            logger.debug('Performing health check');
            const response: AxiosResponse<{ status: string }> = await this.client.get('/health');
            logger.debug('Health check completed', { status: response.data.status });
            return response.data;
        } catch (error) {
            logger.error('Health check failed', error as Error);
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