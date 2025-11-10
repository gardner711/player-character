# PC Character Manager - Website

A React TypeScript application for managing D&D 5e player characters with a comprehensive character creation and editing wizard.

## Features

- **Character List**: View, search, sort, and paginate through characters
- **Character Creation**: 4-step wizard for creating new characters
- **Character Editing**: Full editing wizard with change tracking
- **Responsive Design**: Mobile-friendly interface
- **Type Safety**: Full TypeScript implementation
- **API Integration**: RESTful API client with configurable base URLs

## Environment Configuration

The application supports configurable API base URLs for different environments:

### Environment Variables

Create the following `.env` files in the root directory:

#### `.env.development` (Development)
```env
VITE_API_BASE_URL=http://localhost:8765
```

#### `.env.test` (Testing)
```env
VITE_API_BASE_URL=http://localhost:8766
```

#### `.env.production` (Production)
```env
VITE_API_BASE_URL=https://api.player-character.com
```

### Available Scripts

```bash
# Development (default)
npm run dev

# Development with explicit mode
npm run dev:staging

# Test environment
npm run dev:test

# Build for production
npm run build:prod

# Build for staging
npm run build:staging

# Build for test
npm run build:test
```

## API Configuration

The `CharacterAPIClient` automatically uses the configured base URL from environment variables. The client is exported as a singleton instance (`characterAPI`) for consistent usage across the application.

### Manual Configuration

If you need to override the base URL programmatically:

```typescript
import { CharacterAPIClient } from './services/characterAPI';

// Create client with custom base URL
const customClient = new CharacterAPIClient('https://custom-api.example.com');
```

## Project Structure

```
src/
├── components/
│   ├── wizard/          # Character creation/editing wizard components
│   ├── CharacterList.tsx
│   ├── CharacterCreate.tsx
│   └── CharacterEdit.tsx
├── services/
│   └── characterAPI.ts  # API client implementation
├── config/
│   └── config.ts        # Environment configuration
├── hooks/
│   ├── useCharacterList.ts
│   ├── useSearch.ts
│   └── useSorting.ts
├── types/
│   └── character.ts     # TypeScript interfaces
└── utils/
    └── validationSchemas.ts
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Building

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## API Requirements

The application expects a REST API with the following endpoints:

- `GET /characters` - List characters with pagination, search, and sorting
- `GET /characters/:id` - Get a specific character
- `POST /characters` - Create a new character
- `PUT /characters/:id` - Update an existing character

See the webservice component for the complete API specification.