package database

import (
	"errors"
	"sync"
	"time"

	"player-character/internal/models"

	"github.com/google/uuid"
)

// MemoryStore implements an in-memory character storage
type MemoryStore struct {
	characters map[string]models.Character
	mutex      sync.RWMutex
}

// NewMemoryStore creates a new in-memory store
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		characters: make(map[string]models.Character),
	}
}

// Create stores a new character
func (s *MemoryStore) Create(character *models.Character) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Generate ID if not provided
	if character.ID == uuid.Nil {
		character.ID = uuid.New()
	}

	// Check if ID already exists
	idStr := character.ID.String()
	if _, exists := s.characters[idStr]; exists {
		return errors.New("character with this ID already exists")
	}

	// Set timestamps
	now := time.Now()
	character.CreatedAt = now
	character.UpdatedAt = now

	s.characters[idStr] = *character
	return nil
}

// Get retrieves a character by ID
func (s *MemoryStore) Get(id uuid.UUID) (*models.Character, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	character, exists := s.characters[id.String()]
	if !exists {
		return nil, errors.New("character not found")
	}

	return &character, nil
}

// List retrieves characters with pagination
func (s *MemoryStore) List(page, limit int) ([]models.Character, int, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Convert map to slice
	var allCharacters []models.Character
	for _, char := range s.characters {
		allCharacters = append(allCharacters, char)
	}

	total := len(allCharacters)

	// Calculate pagination
	start := (page - 1) * limit
	if start >= total {
		return []models.Character{}, total, nil
	}

	end := start + limit
	if end > total {
		end = total
	}

	return allCharacters[start:end], total, nil
}

// Update modifies an existing character
func (s *MemoryStore) Update(id uuid.UUID, character *models.Character) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	idStr := id.String()
	existing, exists := s.characters[idStr]
	if !exists {
		return errors.New("character not found")
	}

	// Preserve original ID and creation time
	character.ID = id
	character.CreatedAt = existing.CreatedAt
	character.UpdatedAt = time.Now()

	s.characters[idStr] = *character
	return nil
}

// Delete removes a character
func (s *MemoryStore) Delete(id uuid.UUID) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	idStr := id.String()
	if _, exists := s.characters[idStr]; !exists {
		return errors.New("character not found")
	}

	delete(s.characters, idStr)
	return nil
}

// CharacterStore interface defines the contract for character storage
type CharacterStore interface {
	Create(character *models.Character) error
	Get(id uuid.UUID) (*models.Character, error)
	List(page, limit int) ([]models.Character, int, error)
	Update(id uuid.UUID, character *models.Character) error
	Delete(id uuid.UUID) error
}
