# Character List Component Implementation

## Metadata

- **Name**: Character List Component Implementation
- **Type**: Enabler
- **ID**: ENB-980003
- **Approval**: Approved
- **Capability ID**: CAP-980002
- **Owner**: Development Team
- **Status**: Ready for Implementation
- **Priority**: High
- **Analysis Review**: Not Required
- **Code Review**: Not Required

## Technical Overview
### Purpose
Implement a responsive, tiled character list component that displays all player characters with pagination by 20, showing basic character information in each tile with edit links, and integrates with the PC Website API Client for data fetching.

## Functional Requirements

| ID | Name | Requirement | Priority | Status | Approval |
|----|------|-------------|----------|--------|----------|
| FR-980004 | Character List Component | Create main CharacterList React component with props for pageSize and onCharacterEdit callback | Must Have | Ready for Implementation | Approved |
| FR-980005 | Character Tile Component | Implement CharacterTile component displaying name, race, class, level with edit button | Must Have | Ready for Implementation | Approved |
| FR-980006 | Pagination Component | Create Pagination component with Previous/Next buttons and page indicators | Must Have | Ready for Implementation | Approved |
| FR-980007 | API Integration Hook | Implement useCharacterList custom hook using CharacterAPIClient for data fetching | Must Have | Ready for Implementation | Approved |
| FR-980008 | Loading States | Add skeleton loading component and loading state management | Must Have | Ready for Implementation | Approved |
| FR-980009 | Error Handling | Implement error display and retry functionality for API failures | Must Have | Ready for Implementation | Approved |
| FR-980010 | Empty State | Create empty state component when no characters exist | Should Have | Ready for Implementation | Approved |
| FR-980011 | Responsive Grid | Implement CSS Grid layout adapting to mobile/tablet/desktop breakpoints | Must Have | Ready for Implementation | Approved |
| FR-980012 | Accessibility | Add ARIA labels, keyboard navigation, and screen reader support | Must Have | Ready for Implementation | Approved |
| FR-980013 | Edit Navigation | Implement character edit link/button with proper routing integration | Must Have | Ready for Implementation | Approved |

## Non-Functional Requirements

| ID | Name | Type | Requirement | Priority | Status | Approval |
|----|------|------|-------------|----------|--------|----------|
| NFR-980014 | Performance | Performance | Component renders within 100ms with 20 character tiles | Must Have | Ready for Implementation | Approved |
| NFR-980015 | Responsive Design | Usability | Adapts properly to screen sizes from 320px to 1920px+ | Must Have | Ready for Implementation | Approved |
| NFR-980016 | Test Coverage | Reliability | 90%+ test coverage for all components and hooks | Must Have | Ready for Implementation | Approved |
| NFR-980017 | Bundle Size | Performance | Component bundle under 50KB including dependencies | Should Have | Ready for Implementation | Approved |
| NFR-980018 | Browser Support | Compatibility | Works in Chrome, Firefox, Safari, Edge (latest 2 versions) | Must Have | Ready for Implementation | Approved |

## Component Specifications

### CharacterList Component

#### Props Interface
```typescript
interface CharacterListProps {
  pageSize?: number;                    // Default: 20
  onCharacterEdit?: (characterId: string) => void;
  className?: string;                   // Additional CSS classes
}
```

#### State Management
```typescript
interface CharacterListState {
  currentPage: number;
  characters: Character[];
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
}
```

#### Component Structure
```typescript
const CharacterList: React.FC<CharacterListProps> = ({
  pageSize = 20,
  onCharacterEdit,
  className
}) => {
  const { characters, pagination, loading, error, refetch } = useCharacterList(currentPage, pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCharacterEdit = (characterId: string) => {
    onCharacterEdit?.(characterId);
  };

  if (loading) return <LoadingSkeleton count={pageSize} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (characters.length === 0) return <EmptyState />;

  return (
    <div className={`character-list ${className}`}>
      <div className="character-grid">
        {characters.map(character => (
          <CharacterTile
            key={character.id}
            character={character}
            onEdit={handleCharacterEdit}
          />
        ))}
      </div>
      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pageSize)}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};
```

### CharacterTile Component

#### Props Interface
```typescript
interface CharacterTileProps {
  character: Character;
  onEdit: (characterId: string) => void;
  className?: string;
}
```

#### Component Implementation
```typescript
const CharacterTile: React.FC<CharacterTileProps> = ({
  character,
  onEdit,
  className
}) => {
  return (
    <article
      className={`character-tile ${className}`}
      role="article"
      aria-labelledby={`character-${character.id}-name`}
    >
      <div className="character-info">
        <h3 id={`character-${character.id}-name`}>
          {character.name}
        </h3>
        <div className="character-details">
          <span className="character-race">{character.race}</span>
          <span className="character-class">{character.class}</span>
          <span className="character-level">Level {character.level}</span>
        </div>
        {character.background && (
          <p className="character-background">{character.background}</p>
        )}
      </div>
      <div className="character-actions">
        <button
          className="edit-button"
          onClick={() => onEdit(character.id!)}
          aria-label={`Edit ${character.name}`}
        >
          Edit Character
        </button>
      </div>
    </article>
  );
};
```

### Pagination Component

#### Props Interface
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;  // Default: 5
}
```

#### Component Implementation
```typescript
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5
}) => {
  const getVisiblePages = () => {
    // Calculate which page numbers to show
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      className="pagination"
      role="navigation"
      aria-label="Character list pagination"
    >
      <button
        className="pagination-button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        Previous
      </button>

      {visiblePages.map(page => (
        <button
          key={page}
          className={`pagination-button ${page === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(page)}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      <button
        className="pagination-button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
};
```

### useCharacterList Hook

#### Hook Interface
```typescript
interface UseCharacterListResult {
  characters: Character[];
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useCharacterList = (
  page: number,
  limit: number
): UseCharacterListResult => {
  // Implementation
};
```

#### Hook Implementation
```typescript
const useCharacterList = (page: number, limit: number) => {
  const [state, setState] = useState({
    characters: [],
    pagination: null,
    loading: true,
    error: null
  });

  const fetchCharacters = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const client = new CharacterAPIClient(API_BASE_URL);
      const result = await client.getCharacters({ page, limit });

      setState({
        characters: result.characters,
        pagination: result.pagination,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [page, limit]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  return {
    ...state,
    refetch: fetchCharacters
  };
};
```

## Styling Implementation

### CSS Grid Layout
```css
.character-list {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .character-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .character-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
```

### Character Tile Styling
```css
.character-tile {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #e1e5e9;
}

.character-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.character-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.character-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.character-details span {
  background: #f7fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #4a5568;
}

.edit-button {
  width: 100%;
  background: #3182ce;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.edit-button:hover {
  background: #2c5282;
}

.edit-button:focus {
  outline: 2px solid #3182ce;
  outline-offset: 2px;
}
```

### Pagination Styling
```css
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  border: 1px solid #e1e5e9;
  background: white;
  color: #4a5568;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-button:hover:not(:disabled) {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.pagination-button.active {
  background: #3182ce;
  color: white;
  border-color: #3182ce;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Testing Implementation

### Unit Tests
```typescript
describe('CharacterList', () => {
  it('renders loading state initially', () => {
    // Test implementation
  });

  it('renders character tiles when data is loaded', () => {
    // Test implementation
  });

  it('handles pagination correctly', () => {
    // Test implementation
  });

  it('calls onCharacterEdit when edit button is clicked', () => {
    // Test implementation
  });
});

describe('CharacterTile', () => {
  it('displays character information correctly', () => {
    // Test implementation
  });

  it('calls onEdit with correct character ID', () => {
    // Test implementation
  });
});

describe('useCharacterList', () => {
  it('fetches characters from API', async () => {
    // Mock API and test hook
  });

  it('handles API errors gracefully', async () => {
    // Test error handling
  });
});
```

### Integration Tests
```typescript
describe('CharacterList Integration', () => {
  it('loads and displays characters from real API', async () => {
    // Full integration test with API
  });
});
```

## Accessibility Implementation

### ARIA Labels and Roles
- **Navigation**: `role="navigation"` for pagination
- **Articles**: `role="article"` for character tiles
- **Labels**: `aria-labelledby` for character names
- **Current Page**: `aria-current="page"` for active pagination button

### Keyboard Navigation
- **Tab Order**: Logical tab order through tiles and pagination
- **Enter/Space**: Activate edit buttons and pagination links
- **Arrow Keys**: Navigate through pagination (future enhancement)

### Screen Reader Support
- **Announcements**: Page change announcements
- **Descriptions**: Descriptive button labels
- **Structure**: Proper heading hierarchy

## Performance Optimization

### React Optimizations
```typescript
// Memoize components to prevent unnecessary re-renders
const CharacterTile = React.memo<CharacterTileProps>(({ character, onEdit }) => {
  // Component implementation
});

// Use callback for event handlers
const handleCharacterEdit = useCallback((characterId: string) => {
  onCharacterEdit?.(characterId);
}, [onCharacterEdit]);
```

### Bundle Optimization
- **Code Splitting**: Lazy load components if needed
- **Tree Shaking**: Ensure unused code is removed
- **Image Optimization**: Compress and lazy load character images (future)

## Error Boundaries

### Error Boundary Component
```typescript
class CharacterListErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('CharacterList error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}
```

## Dependencies

### Internal Upstream Dependency

| Enabler ID | Description |
|------------|-------------|
| ENB-980001 | Website API Client Implementation |

### Internal Downstream Impact

| Enabler ID | Description |
|------------|-------------|
| ENB-847341 | Character Edit Form Component |

### External Dependencies

**External Upstream Dependencies**: React, TypeScript, CSS Modules

**External Downstream Impact**: Website component library, design system

## Implementation Plan

### Phase 1: Core Components
1. Set up component structure and TypeScript interfaces
2. Implement CharacterTile component with basic styling
3. Create useCharacterList hook with API integration
4. Add loading and error states

### Phase 2: Layout and Navigation
1. Implement responsive CSS Grid layout
2. Create Pagination component with proper controls
3. Add CharacterList container component
4. Integrate all components together

### Phase 3: Polish and Testing
1. Add accessibility features and ARIA labels
2. Implement comprehensive unit tests
3. Add integration tests with API client
4. Performance optimization and bundle analysis

### Phase 4: Integration
1. Test integration with routing system
2. Add to website component library
3. Update documentation and usage examples
4. Deploy and monitor performance