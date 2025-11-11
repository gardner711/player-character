# Website API Client Implementation

## Metadata

- **Name**: Website API Client Implementation
- **Type**: Enabler
- **ID**: ENB-980001
- **Approval**: Approved
- **Capability ID**: CAP-980000
- **Owner**: Development Team
- **Status**: Ready for Implementation
- **Priority**: High
- **Analysis Review**: Not Required
- **Code Review**: Not Required

## Technical Overview
### Purpose
Implement a comprehensive TypeScript client library that provides a clean, type-safe interface for the PC website to interact with the webservice REST API, wrapping all character CRUD operations with proper error handling and user feedback.

## Functional Requirements

| ID | Name | Requirement | Priority | Status | Approval |
|----|------|-------------|----------|--------|----------|
| FR-980002 | API Client Class | Create a main CharacterAPIClient class with configurable base URL and HTTP options | Must Have | Ready for Implementation | Approved |
| FR-980003 | Create Character API | Implement createCharacter method wrapping POST /api/characters | Must Have | Ready for Implementation | Approved |
| FR-980004 | Get Character API | Implement getCharacter method wrapping GET /api/characters/{id} | Must Have | Ready for Implementation | Approved |
| FR-980005 | List Characters API | Implement getCharacters method wrapping GET /api/characters with pagination | Must Have | Ready for Implementation | Approved |
| FR-980006 | Update Character API | Implement updateCharacter method wrapping PUT /api/characters/{id} | Must Have | Ready for Implementation | Approved |
| FR-980007 | Delete Character API | Implement deleteCharacter method wrapping DELETE /api/characters/{id} | Must Have | Ready for Implementation | Approved |
| FR-980008 | TypeScript Types | Define comprehensive TypeScript interfaces for all API data structures | Must Have | Ready for Implementation | Approved |
| FR-980009 | Error Handling | Implement consistent error handling with user-friendly messages | Must Have | Ready for Implementation | Approved |
| FR-980010 | HTTP Utilities | Create HTTP utility functions for request/response handling | Must Have | Ready for Implementation | Approved |
| FR-980011 | Request Logging | Add configurable logging for API requests and responses | Should Have | Ready for Implementation | Approved |
| FR-980012 | Timeout Handling | Implement request timeouts and retry logic for failed requests | Should Have | Ready for Implementation | Approved |

## Non-Functional Requirements

| ID | Name | Type | Requirement | Priority | Status | Approval |
|----|------|------|-------------|----------|--------|----------|
| NFR-980013 | Type Safety | Maintainability | Full TypeScript coverage with strict mode enabled | Must Have | Ready for Implementation | Approved |
| NFR-980014 | Test Coverage | Reliability | 90%+ test coverage for all API methods | Must Have | Ready for Implementation | Approved |
| NFR-980015 | Bundle Size | Performance | Client library adds less than 50KB to website bundle | Must Have | Ready for Implementation | Approved |
| NFR-980016 | Browser Support | Compatibility | Support for modern browsers (Chrome, Firefox, Safari, Edge) | Must Have | Ready for Implementation | Approved |
| NFR-980017 | Documentation | Maintainability | Complete API documentation with examples | Should Have | Ready for Implementation | Approved |

## API Operations Implementation

### Create Character
- **Method**: `createCharacter(character: Character): Promise<Character>`
- **HTTP Method**: POST
- **Endpoint**: `/api/characters`
- **Request Body**: Character object (without ID)
- **Response**: Created Character object (with generated ID)
- **Error Handling**: Validation errors, server errors

### Get Character
- **Method**: `getCharacter(id: string): Promise<Character>`
- **HTTP Method**: GET
- **Endpoint**: `/api/characters/{id}`
- **Response**: Character object
- **Error Handling**: Not found (404), server errors

### List Characters
- **Method**: `getCharacters(params?: ListParams): Promise<CharacterList>`
- **HTTP Method**: GET
- **Endpoint**: `/api/characters`
- **Query Parameters**: page, limit, sortBy, sortOrder
- **Response**: Paginated list of characters with sorting applied
- **Error Handling**: Server errors

### Update Character
- **Method**: `updateCharacter(id: string, character: Character): Promise<Character>`
- **HTTP Method**: PUT
- **Endpoint**: `/api/characters/{id}`
- **Request Body**: Updated Character object
- **Response**: Updated Character object
- **Error Handling**: Not found (404), validation errors, server errors

### Delete Character
- **Method**: `deleteCharacter(id: string): Promise<void>`
- **HTTP Method**: DELETE
- **Endpoint**: `/api/characters/{id}`
- **Response**: No content (204)
- **Error Handling**: Not found (404), server errors

## Implementation Details

### Project Structure
```
website/src/api/
├── client.ts              # Main API client class
├── character.ts           # Character API methods
├── types.ts               # TypeScript type definitions
├── errors.ts              # Error handling utilities
└── http.ts                # HTTP client utilities

website/tests/
├── unit/
│   ├── client.test.ts
│   ├── character.test.ts
│   └── errors.test.ts
└── integration/
    └── api-integration.test.ts
```

### TypeScript Interfaces

```typescript
// Character model matching webservice
export interface Character {
  id?: string;
  name: string;
  race: string;
  class: string;
  level: number;
  background?: string;
  // ... other character fields
}

// API response structures
export interface CharacterList {
  characters: Character[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface APIError {
  message: string;
  status: number;
  details?: any;
}

// Client configuration
export interface ClientOptions {
  timeout?: number;
  retries?: number;
  logging?: boolean;
}

export interface ListParams {
  page?: number;
  limit?: number;
}
```

### HTTP Client Implementation

```typescript
class HTTPClient {
  private baseURL: string;
  private defaultOptions: RequestInit;

  constructor(baseURL: string, options: ClientOptions = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config = { ...this.defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new APIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        await response.json().catch(() => null)
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private handleError(error: any): APIError {
    if (error instanceof APIError) {
      return error;
    }

    return new APIError(
      error.message || 'Network error',
      0,
      error
    );
  }
}
```

### Character API Client

```typescript
export class CharacterAPIClient {
  private http: HTTPClient;

  constructor(baseURL: string, options?: ClientOptions) {
    this.http = new HTTPClient(baseURL, options);
  }

  async createCharacter(character: Omit<Character, 'id'>): Promise<Character> {
    return this.http.request<Character>('/api/characters', {
      method: 'POST',
      body: JSON.stringify(character)
    });
  }

  async getCharacter(id: string): Promise<Character> {
    return this.http.request<Character>(`/api/characters/${id}`);
  }

  async getCharacters(params?: ListParams): Promise<CharacterList> {
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return this.http.request<CharacterList>(`/api/characters${query}`);
  }

  async updateCharacter(id: string, character: Character): Promise<Character> {
    return this.http.request<Character>(`/api/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(character)
    });
  }

  async deleteCharacter(id: string): Promise<void> {
    return this.http.request<void>(`/api/characters/${id}`, {
      method: 'DELETE'
    });
  }
}
```

## Testing Strategy

### Unit Tests
- Mock fetch API for isolated testing
- Test all success and error scenarios
- Validate request formatting and response parsing
- Test TypeScript type safety

### Integration Tests
- Test against running webservice instance
- Validate end-to-end API flows
- Test error scenarios with real server responses
- Performance testing for response times

### Test Examples

```typescript
describe('CharacterAPIClient', () => {
  let client: CharacterAPIClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new CharacterAPIClient('http://localhost:8765');
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  });

  describe('createCharacter', () => {
    it('should create a character successfully', async () => {
      const character = { name: 'Test Character', race: 'Human' };
      const createdCharacter = { id: '123', ...character };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => createdCharacter
      } as Response);

      const result = await client.createCharacter(character);
      expect(result).toEqual(createdCharacter);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8765/api/characters',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(character)
        })
      );
    });

    it('should handle validation errors', async () => {
      const character = { name: '', race: 'Human' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Name is required' })
      } as Response);

      await expect(client.createCharacter(character))
        .rejects
        .toThrow(APIError);
    });
  });
});
```

## Dependencies

### Internal Upstream Dependency

| Enabler ID | Description |
|------------|-------------|
| ENB-979958 | Webservice-Object Storage Integration Tests |

### Internal Downstream Impact

| Enabler ID | Description |
|------------|-------------|
| ENB-847341 | Character List Component |

### External Dependencies

**External Upstream Dependencies**: fetch API, TypeScript compiler

**External Downstream Impact**: Website bundle size, browser compatibility

## Implementation Plan

### Phase 1: Core Infrastructure
1. Set up TypeScript project structure
2. Implement HTTP client utilities
3. Define TypeScript interfaces
4. Create error handling system

### Phase 2: API Methods
1. Implement CharacterAPIClient class
2. Add all CRUD operation methods
3. Implement request/response logging
4. Add timeout and retry logic

### Phase 3: Testing & Documentation
1. Write comprehensive unit tests
2. Create integration tests
3. Generate API documentation
4. Performance testing and optimization

### Phase 4: Integration
1. Bundle for web distribution
2. Test integration with website components
3. Environment configuration
4. Deployment preparation