// Environment configuration for the application
// Vite exposes environment variables that start with VITE_

interface AppConfig {
    api: {
        baseURL: string;
    };
    app: {
        name: string;
        version: string;
    };
}

// Default configuration
const defaultConfig: AppConfig = {
    api: {
        baseURL: 'http://localhost:8765'
    },
    app: {
        name: 'PC Character Manager',
        version: '1.0.0'
    }
};

// Get configuration from environment variables
const getConfig = (): AppConfig => {
    return {
        api: {
            baseURL: import.meta.env.VITE_API_BASE_URL || defaultConfig.api.baseURL
        },
        app: {
            name: import.meta.env.VITE_APP_NAME || defaultConfig.app.name,
            version: import.meta.env.VITE_APP_VERSION || defaultConfig.app.version
        }
    };
};

export const config = getConfig();

// Export individual config values for convenience
export const API_BASE_URL = config.api.baseURL;
export const APP_NAME = config.app.name;
export const APP_VERSION = config.app.version;