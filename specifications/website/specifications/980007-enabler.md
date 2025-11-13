# Character Editing Wizard Implementation

## Metadata

- **Name**: Character Editing Wizard Implementation
- **Type**: Enabler
- **ID**: ENB-980007
- **Approval**: Approved
- **Capability ID**: CAP-980006
- **Owner**: Development Team
- **Status**: Implemented
- **Priority**: High
- **Analysis Review**: Not Required
- **Code Review**: Not Required

## Technical Overview
### Purpose
Implement a comprehensive character editing wizard that mirrors the character creation process but pre-populates fields with existing character data. The editing wizard allows modifications to any aspect of the character while maintaining the same validation rules, change tracking, and user experience as the creation wizard.

## Functional Requirements

| ID | Name | Requirement | Priority | Status | Approval |
|----|------|-------------|----------|--------|----------|
| FR-980027 | Character Loading | Load and pre-populate wizard with existing character data | Must Have | Implemented | Approved |
| FR-980028 | Edit Basic Info | Modify character name, player name, race, and subrace with validation | Must Have | Implemented | Approved |
| FR-980029 | Edit Class | Change primary class, subclass, and multiclass options | Must Have | Implemented | Approved |
| FR-980030 | Edit Ability Scores | Adjust ability scores within point buy constraints | Must Have | Implemented | Approved |
| FR-980031 | Edit Background | Update background, alignment, level, and experience points | Must Have | Implemented | Approved |
| FR-980032 | Change Tracking | Track modified fields and show change summary | Must Have | Implemented | Approved |
| FR-980032 | Validation Consistency | Apply identical validation rules as character creation with automatic validation-based progression | Must Have | Implemented | Approved |
| FR-980034 | Edit Confirmation | Require confirmation for significant changes before saving | Should Have | Implemented | Approved |
| FR-980035 | Cancel Protection | Warn about unsaved changes when canceling edit | Should Have | Implemented | Approved |
| FR-980036 | Concurrent Edit Handling | Handle conflicts when character is edited by multiple users | Should Have | Implemented | Approved |
| FR-980037 | Dark Mode Section Backgrounds | Implement dark backgrounds for wizard sections in dark mode instead of white backgrounds | Must Have | Implemented | Approved |
| FR-980038 | Dark Mode Header Styling | Implement lighter header text colors in dark mode for better readability and contrast | Must Have | Implemented | Approved |

## Non-Functional Requirements

| ID | Name | Type | Requirement | Priority | Status | Approval |
|----|------|------|-------------|----------|--------|----------|
| NFR-980032 | Loading Performance | Performance | Load character data within 2 seconds | Must Have | Implemented | Approved |
| NFR-980033 | Edit Responsiveness | Performance | Real-time validation completes within 100ms | Must Have | Implemented | Approved |
| NFR-980034 | Mobile Editing | Usability | Full editing capability on mobile devices (320px+ width) | Must Have | Implemented | Approved |
| NFR-980035 | Accessibility | Usability | WCAG 2.1 AA compliance for editing interface | Must Have | Implemented | Approved |
| NFR-980036 | Data Safety | Reliability | Prevent data loss during editing with rollback capability | Must Have | Implemented | Approved |
| NFR-980037 | Test Coverage | Reliability | 95%+ test coverage for editing components and logic | Must Have | Implemented | Approved |

## Component Specifications

### CharacterEditWizard Component

#### Props Interface
```typescript
interface CharacterEditWizardProps {
  characterId: string;
  onComplete: (updatedCharacter: Character) => void;
  onCancel: () => void;
  enableChangeTracking?: boolean;
  requireConfirmation?: boolean;
  className?: string;
}
```

#### Component Implementation
```typescript
const CharacterEditWizard: React.FC<CharacterEditWizardProps> = ({
  characterId,
  onComplete,
  onCancel,
  enableChangeTracking = true,
  requireConfirmation = true,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [originalCharacter, setOriginalCharacter] = useState<Character | null>(null);
  const [editedCharacter, setEditedCharacter] = useState<Partial<CharacterEditData>>({});
  const [stepValidities, setStepValidities] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  const steps = [
    { component: EditBasicInfoStep, title: 'Basic Information', validationSchema: basicInfoSchema },
    { component: EditClassStep, title: 'Class Selection', validationSchema: classSchema },
    { component: EditAbilityScoresStep, title: 'Ability Scores', validationSchema: abilityScoresSchema },
    { component: EditBackgroundStep, title: 'Background & Details', validationSchema: backgroundSchema }
  ];

  // Load character data on mount
  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const client = new CharacterAPIClient(API_BASE_URL);
        const character = await client.getCharacter(characterId);
        setOriginalCharacter(character);
        setEditedCharacter(character);
        setIsLoading(false);
      } catch (error) {
        setApiError('Failed to load character data');
        setIsLoading(false);
      }
    };
    loadCharacter();
  }, [characterId]);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = stepValidities[currentStep] || false;
  const hasChanges = modifiedFields.size > 0;

  const handleStepDataChange = (stepData: Partial<CharacterEditData>) => {
    setEditedCharacter(prev => ({ ...prev, ...stepData }));

    // Track changes
    if (enableChangeTracking && originalCharacter) {
      const changes = getModifiedFields(originalCharacter, { ...editedCharacter, ...stepData });
      setModifiedFields(changes);
    }
  };

  const handleStepValidityChange = (stepIndex: number, isValid: boolean) => {
    setStepValidities(prev => ({ ...prev, [stepIndex]: isValid }));
  };

  const handleNext = () => {
    if (canProceed && !isLastStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (requireConfirmation && hasSignificantChanges(modifiedFields)) {
      const confirmed = await showConfirmationDialog(getChangeSummary(modifiedFields, originalCharacter, editedCharacter));
      if (!confirmed) return;
    }

    try {
      const client = new CharacterAPIClient(API_BASE_URL);
      const updatedCharacter = await client.updateCharacter(characterId, editedCharacter as Character);
      // Navigate to character list with success message
      navigate('/', { state: { successMessage: `Character "${updatedCharacter.characterName}" updated successfully!` } });
    } catch (error) {
      if (error.status === 409) {
        setConflictError('Character was modified by another user. Please refresh and try again.');
      } else {
        setApiError(error.message);
      }
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    onCancel();
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading character...</div>;
  }

  if (!originalCharacter) {
    return <div className="error-message">Failed to load character</div>;
  }

  const CurrentStepComponent = currentStepData.component;

  return (
    <div className={`character-edit-wizard ${className}`}>
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
        stepTitles={steps.map(s => s.title)}
      />

      {enableChangeTracking && hasChanges && (
        <ChangeIndicator
          modifiedFields={modifiedFields}
          changeCount={modifiedFields.size}
        />
      )}

      <div className="wizard-content">
        <CurrentStepComponent
          originalData={originalCharacter}
          editedData={editedCharacter}
          onDataChange={handleStepDataChange}
          onValidityChange={(isValid) => handleStepValidityChange(currentStep, isValid)}
          validationSchema={currentStepData.validationSchema}
        />
      </div>

      <StepNavigation
        onPrevious={currentStep > 0 ? handlePrevious : undefined}
        onNext={canProceed && !isLastStep ? handleNext : undefined}
        onSubmit={canProceed && isLastStep ? handleSubmit : undefined}
        onCancel={handleCancel}
        canProceed={canProceed}
        isLastStep={isLastStep}
        hasChanges={hasChanges}
      />
    </div>
  );
};
```

### Edit Step Components Implementation

#### EditBasicInfoStep Component
```typescript
interface EditBasicInfoStepProps {
  originalData: Character;
  editedData: Partial<CharacterEditData>;
  onComplete: (data: Partial<CharacterEditData>) => void;
  validationSchema: z.ZodSchema;
}

const EditBasicInfoStep: React.FC<EditBasicInfoStepProps> = ({
  originalData,
  editedData,
  onComplete,
  validationSchema
}) => {
  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      characterName: editedData.characterName || originalData.characterName || '',
      playerName: editedData.playerName || originalData.playerName || '',
      race: editedData.race || originalData.race || '',
      subrace: editedData.subrace || originalData.subrace || ''
    }
  });

  const watchedRace = watch('race');
  const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];

  const getSubraces = (race: string) => {
    const subraceMap: Record<string, string[]> = {
      'Elf': ['High Elf', 'Wood Elf', 'Dark Elf'],
      'Dwarf': ['Hill Dwarf', 'Mountain Dwarf'],
      'Halfling': ['Lightfoot', 'Stout'],
      'Gnome': ['Forest Gnome', 'Rock Gnome']
    };
    return subraceMap[race] || [];
  };

  const onSubmit = (formData: any) => {
    onComplete(formData);
  };

  return (
    <WizardStep
      title="Edit Basic Information"
      description="Update your character's fundamental details"
      isValid={isValid}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="basic-info-form">
        <div className="form-group">
          <label htmlFor="characterName">Character Name *</label>
          <input
            id="characterName"
            {...register('characterName')}
            placeholder="Enter your character's name"
          />
          {errors.characterName && (
            <span className="error-message">{errors.characterName.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="playerName">Player Name</label>
          <input
            id="playerName"
            {...register('playerName')}
            placeholder="Enter your name (optional)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="race">Race *</label>
          <select id="race" {...register('race')}>
            <option value="">Select a race</option>
            {races.map(race => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>
          {errors.race && (
            <span className="error-message">{errors.race.message}</span>
          )}
        </div>

        {getSubraces(watchedRace || '').length > 0 && (
          <div className="form-group">
            <label htmlFor="subrace">Subrace</label>
            <select id="subrace" {...register('subrace')}>
              <option value="">Select a subrace (optional)</option>
              {getSubraces(watchedRace || '').map(subrace => (
                <option key={subrace} value={subrace}>{subrace}</option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" disabled={!isValid} className="step-submit-btn">
          Continue to Class Selection
        </button>
      </form>
    </WizardStep>
  );
};
```

#### EditClassStep, EditAbilityScoresStep, and EditBackgroundStep Components
Similar implementations to creation steps but with pre-populated data and change tracking.

### Change Tracking Implementation

#### ChangeIndicator Component
```typescript
interface ChangeIndicatorProps {
  modifiedFields: Set<string>;
  changeCount: number;
  className?: string;
}

const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
  modifiedFields,
  changeCount,
  className
}) => {
  return (
    <div className={`change-indicator ${className}`} role="status" aria-live="polite">
      <span className="change-icon">📝</span>
      <span className="change-text">
        {changeCount} field{changeCount !== 1 ? 's' : ''} modified
      </span>
      <button
        type="button"
        className="view-changes-btn"
        onClick={() => showChangeSummary(modifiedFields)}
        aria-label="View detailed changes"
      >
        View Changes
      </button>
    </div>
  );
};
```

#### Change Tracking Utilities
```typescript
export const getModifiedFields = (
  original: Character,
  edited: Partial<Character>
): Set<string> => {
  const modified = new Set<string>();

  Object.keys(edited).forEach(key => {
    if (JSON.stringify(original[key as keyof Character]) !== JSON.stringify(edited[key as keyof Character])) {
      modified.add(key);
    }
  });

  return modified;
};

export const hasSignificantChanges = (modifiedFields: Set<string>): boolean => {
  const significantFields = ['race', 'class', 'level', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  return significantFields.some(field => modifiedFields.has(field));
};

export const getChangeSummary = (
  modifiedFields: Set<string>,
  original: Character | null,
  edited: Partial<Character>
): ChangeSummary => {
  const changes: Array<{ field: string; from: any; to: any }> = [];

  modifiedFields.forEach(field => {
    changes.push({
      field: formatFieldName(field),
      from: original ? original[field as keyof Character] : 'N/A',
      to: edited[field as keyof Character]
    });
  });

  return {
    totalChanges: changes.length,
    significantChanges: hasSignificantChanges(modifiedFields),
    changes
  };
};
```

### Confirmation Dialog Implementation

#### ConfirmationDialog Component
```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  changeSummary: ChangeSummary;
  title?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  changeSummary,
  title = "Confirm Changes"
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay" role="dialog" aria-modal="true">
      <div className="confirmation-dialog">
        <h3>{title}</h3>

        <div className="change-summary">
          <p>You are about to save {changeSummary.totalChanges} change{changeSummary.totalChanges !== 1 ? 's' : ''}:</p>

          <ul className="change-list">
            {changeSummary.changes.map((change, index) => (
              <li key={index} className="change-item">
                <strong>{change.field}:</strong> {change.from} → {change.to}
              </li>
            ))}
          </ul>

          {changeSummary.significantChanges && (
            <div className="significant-warning">
              ⚠️ These changes may significantly affect your character. Please review carefully.
            </div>
          )}
        </div>

        <div className="confirmation-actions">
          <button onClick={onCancel} className="cancel-btn">
            Review Changes
          </button>
          <button onClick={onConfirm} className="confirm-btn">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Validation Implementation

### Edit Validation Schemas
Same schemas as creation wizard - reuse existing validation logic:

```typescript
// Reuse existing schemas from character creation
export const basicInfoSchema = /* same as creation */;
export const classSchema = /* same as creation */;
export const abilityScoresSchema = /* same as creation */;
export const backgroundSchema = /* same as creation */;
```

### Additional Edit Validation
```typescript
// Edit-specific validation for change constraints
export const editConstraintsSchema = z.object({
  // Ensure level progression is valid
  level: z.number().min(1).max(20),
  experiencePoints: z.number().min(0)
}).refine((data) => {
  // Validate XP requirements for level
  const requiredXP = getXPForLevel(data.level);
  return data.experiencePoints >= requiredXP;
}, {
  message: "Experience points do not meet the requirement for this level",
  path: ["experiencePoints"]
});
```

## API Integration

### CharacterAPIClient Edit Methods
```typescript
class CharacterAPIClient {
  // Existing methods...

  async getCharacter(id: string): Promise<Character> {
    const response = await this.client.get(`/characters/${id}`);
    return response.data;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
    const response = await this.client.put(`/characters/${id}`, updates);
    return response.data;
  }
}
```

### Conflict Resolution
```typescript
const handleConcurrentEdit = async (characterId: string, currentVersion: number) => {
  try {
    const client = new CharacterAPIClient(API_BASE_URL);
    const updated = await client.updateCharacter(characterId, {
      ...updates,
      version: currentVersion // Optimistic locking
    });
    return updated;
  } catch (error) {
    if (error.status === 409) {
      // Handle version conflict
      const latest = await client.getCharacter(characterId);
      throw new ConcurrentEditError('Character was modified by another user', latest);
    }
    throw error;
  }
};
```

## Styling Implementation

### Edit Wizard Container Styling
```css
.character-edit-wizard {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.wizard-content {
  min-height: 400px;
  padding: 2rem 0;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.1rem;
  color: #666;
}
```

### Change Indicator Styling
```css
.change-indicator {
  background: #fefcbf;
  border: 1px solid #d69e2e;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.change-icon {
  font-size: 1.2rem;
}

.change-text {
  flex: 1;
  font-weight: 500;
  color: #744210;
}

.view-changes-btn {
  background: none;
  border: 1px solid #d69e2e;
  color: #744210;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.875rem;
}

.view-changes-btn:hover {
  background: #d69e2e;
  color: white;
}
```

### Confirmation Dialog Styling
```css
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirmation-dialog {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.confirmation-dialog h3 {
  margin-top: 0;
  color: #2d3748;
}

.change-summary {
  margin: 1.5rem 0;
}

.change-list {
  background: #f7fafc;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.change-item {
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.change-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.significant-warning {
  background: #fed7d7;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-weight: 500;
}

.confirmation-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-btn {
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  background: #3182ce;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:hover {
  background: #2c5282;
}
```

## Testing Implementation

### Unit Tests
```typescript
describe('CharacterEditWizard', () => {
  it('loads and pre-populates character data', async () => {
    // Test data loading and pre-population
  });

  it('tracks modified fields correctly', () => {
    // Test change tracking functionality
  });

  it('shows confirmation dialog for significant changes', () => {
    // Test confirmation workflow
  });

  it('handles concurrent edit conflicts', () => {
    // Test conflict resolution
  });

  it('warns about unsaved changes on cancel', () => {
    // Test cancel protection
  });
});

describe('EditBasicInfoStep', () => {
  it('pre-populates fields with existing data', () => {
    // Test data pre-population
  });

  it('validates changes using same rules as creation', () => {
    // Test validation consistency
  });

  it('tracks field modifications', () => {
    // Test change tracking
  });
});

describe('Change Tracking', () => {
  it('identifies modified fields accurately', () => {
    // Test field comparison logic
  });

  it('flags significant changes correctly', () => {
    // Test significant change detection
  });

  it('generates accurate change summaries', () => {
    // Test summary generation
  });
});
```

### Integration Tests
```typescript
describe('Character Edit Flow', () => {
  it('completes full edit workflow successfully', async () => {
    // Full integration test with mocked API
    // Should navigate to character list with success message
    expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: { successMessage: expect.stringContaining('updated successfully') }
    });
  });

  it('handles validation errors during editing', async () => {
    // Test validation error handling
  });

  it('resolves concurrent edit conflicts', async () => {
    // Test conflict resolution
  });

  it('maintains data consistency across steps', async () => {
    // Test data integrity
  });
});
```

### Conflict Resolution Tests
```typescript
describe('Concurrent Edit Handling', () => {
  it('detects version conflicts', async () => {
    // Test optimistic locking
  });

  it('provides conflict resolution options', () => {
    // Test user choice handling
  });

  it('prevents data loss during conflicts', () => {
    // Test data safety
  });
});
```

## Accessibility Implementation

### ARIA Labels and Roles
- **Change Indicator**: `role="status"` with `aria-live="polite"`
- **Confirmation Dialog**: `role="dialog"` with `aria-modal="true"`
- **Change Summary**: Proper heading hierarchy and list semantics
- **Loading States**: `aria-busy` and `aria-live` for dynamic content

### Keyboard Navigation
- **Tab Order**: Logical navigation through edit fields and controls
- **Escape**: Close confirmation dialog or cancel edit
- **Enter**: Confirm changes in dialog
- **Arrow Keys**: Navigate change summary lists

### Screen Reader Support
- **Change Announcements**: Live regions announce field modifications
- **Dialog Focus**: Focus management in confirmation dialogs
- **Context Help**: Field descriptions and validation messages
- **Progress Feedback**: Step completion and change status updates

## Performance Optimization

### Data Loading Optimization
```typescript
// Lazy load character data
const [characterData, setCharacterData] = useState<Character | null>(null);

useEffect(() => {
  let isMounted = true;

  const loadCharacter = async () => {
    try {
      const data = await characterAPI.getCharacter(id);
      if (isMounted) {
        setCharacterData(data);
      }
    } catch (error) {
      if (isMounted) {
        setError(error);
      }
    }
  };

  loadCharacter();

  return () => {
    isMounted = false;
  };
}, [id]);
```

### Change Tracking Optimization
```typescript
// Memoize change detection
const modifiedFields = useMemo(() => {
  return originalCharacter && editedCharacter
    ? getModifiedFields(originalCharacter, editedCharacter)
    : new Set();
}, [originalCharacter, editedCharacter]);
```

### Validation Debouncing
```typescript
// Debounce validation for performance
const debouncedValidation = useMemo(
  () => debounce(validateStep, 150),
  [validateStep]
);
```

## Error Handling

### Edit-Specific Error Handling
```typescript
const handleEditError = (error: APIError) => {
  switch (error.status) {
    case 404:
      setError('Character not found. It may have been deleted.');
      break;
    case 409:
      setConflictError('Character was modified by another user. Please refresh and try again.');
      break;
    case 422:
      setValidationError('Invalid character data. Please check your changes.');
      break;
    case 500:
      setError('Server error. Please try again later.');
      break;
    default:
      setError('An unexpected error occurred. Please try again.');
  }
};
```

### Conflict Resolution UI
```typescript
const ConflictResolutionDialog: React.FC<ConflictResolutionProps> = ({
  conflict,
  onResolve,
  onCancel
}) => {
  const [resolution, setResolution] = useState<'overwrite' | 'merge' | 'cancel'>('cancel');

  return (
    <div className="conflict-dialog">
      <h3>Edit Conflict Detected</h3>
      <p>This character was modified by another user while you were editing.</p>

      <div className="conflict-options">
        <label>
          <input
            type="radio"
            value="overwrite"
            checked={resolution === 'overwrite'}
            onChange={(e) => setResolution(e.target.value as typeof resolution)}
          />
          Overwrite with my changes
        </label>

        <label>
          <input
            type="radio"
            value="merge"
            checked={resolution === 'merge'}
            onChange={(e) => setResolution(e.target.value as typeof resolution)}
          />
          View differences and merge manually
        </label>

        <label>
          <input
            type="radio"
            value="cancel"
            checked={resolution === 'cancel'}
            onChange={(e) => setResolution(e.target.value as typeof resolution)}
          />
          Cancel my changes
        </label>
      </div>

      <div className="conflict-actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onResolve(resolution)} disabled={resolution === 'cancel'}>
          Resolve
        </button>
      </div>
    </div>
  );
};
```

## Dependencies

### Internal Upstream Dependency

| Enabler ID | Description |
|------------|-------------|
| ENB-980001 | Website API Client Implementation |
| ENB-980003 | Character List Component Implementation |

### Internal Downstream Impact

| Enabler ID | Description |
|------------|-------------|
| ENB-980005 | Character Creation Wizard Implementation |

### External Dependencies

**External Upstream Dependencies**: React Hook Form, Zod, React Router

**External Downstream Impact**: Character management workflow, data consistency

## Implementation Plan

### Phase 1: Core Infrastructure
1. Set up edit wizard component structure and character loading
2. Implement change tracking and field modification detection
3. Create confirmation dialog system for significant changes
4. Set up conflict resolution framework

### Phase 2: Step Implementation
1. Implement EditBasicInfoStep with data pre-population
2. Create EditClassStep with multiclass support
3. Build EditAbilityScoresStep with point buy validation
4. Develop EditBackgroundStep with level/XP validation

### Phase 3: Integration & Polish
1. Integrate with CharacterAPIClient for updates
2. Add comprehensive error handling and conflict resolution
3. Implement accessibility features and keyboard navigation
4. Performance optimization and testing

### Phase 4: Testing & Deployment
1. Comprehensive unit and integration testing
2. User experience testing with conflict scenarios
3. Accessibility audit and mobile compatibility testing
4. Production deployment with feature flags