package database

import (
	"errors"
	"sort"
	"strings"
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
	if character.ID == "" {
		character.ID = uuid.New().String()
	}

	// Check if ID already exists
	if _, exists := s.characters[character.ID]; exists {
		return errors.New("character with this ID already exists")
	}

	// Set timestamps
	now := time.Now()
	character.CreatedAt = now
	character.UpdatedAt = now

	s.characters[character.ID] = *character
	return nil
}

// Get retrieves a character by ID
func (s *MemoryStore) Get(id string) (*models.Character, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	character, exists := s.characters[id]
	if !exists {
		return nil, errors.New("character not found")
	}

	return &character, nil
}

// List retrieves characters with pagination and search
func (s *MemoryStore) List(page, limit int, sortBy, sortOrder, search string) ([]models.Character, int, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Convert map to slice
	var allCharacters []models.Character
	for _, char := range s.characters {
		allCharacters = append(allCharacters, char)
	}

	// Filter by search term if provided
	if search != "" {
		searchLower := strings.ToLower(search)
		var filtered []models.Character
		for _, char := range allCharacters {
			if strings.Contains(strings.ToLower(char.CharacterName), searchLower) ||
				strings.Contains(strings.ToLower(char.Race), searchLower) ||
				strings.Contains(strings.ToLower(char.Class), searchLower) {
				filtered = append(filtered, char)
			}
		}
		allCharacters = filtered
	}

	// Sort characters
	sort.Slice(allCharacters, func(i, j int) bool {
		var less bool
		switch sortBy {
		case "characterName":
			less = strings.ToLower(allCharacters[i].CharacterName) < strings.ToLower(allCharacters[j].CharacterName)
		case "level":
			less = allCharacters[i].Level < allCharacters[j].Level
		case "race":
			less = strings.ToLower(allCharacters[i].Race) < strings.ToLower(allCharacters[j].Race)
		case "class":
			less = strings.ToLower(allCharacters[i].Class) < strings.ToLower(allCharacters[j].Class)
		case "createdAt":
			less = allCharacters[i].CreatedAt.Before(allCharacters[j].CreatedAt)
		default:
			// Default sort by createdAt
			less = allCharacters[i].CreatedAt.Before(allCharacters[j].CreatedAt)
		}

		if sortOrder == "desc" {
			return !less
		}
		return less
	})

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
func (s *MemoryStore) Update(id string, character *models.Character) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	existing, exists := s.characters[id]
	if !exists {
		return errors.New("character not found")
	}

	// Preserve original ID and creation time
	character.ID = id
	character.CreatedAt = existing.CreatedAt
	character.UpdatedAt = time.Now()

	s.characters[id] = *character
	return nil
}

// Delete removes a character
func (s *MemoryStore) Delete(id string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if _, exists := s.characters[id]; !exists {
		return errors.New("character not found")
	}

	delete(s.characters, id)
	return nil
}

// CharacterStore interface defines the contract for character storage
type CharacterStore interface {
	Create(character *models.Character) error
	Get(id string) (*models.Character, error)
	List(page, limit int, sortBy, sortOrder, search string) ([]models.Character, int, error)
	Update(id string, character *models.Character) error
	Delete(id string) error
}
