package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"player-character/internal/models"
	"player-character/pkg/database"
	"player-character/pkg/logging"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// TestCreateCharacter_Success tests successful character creation
func TestCreateCharacter_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := database.NewMemoryStore()
	logger := logging.NewLogger(logging.Config{
		Level:  "error",
		Format: "json",
		Output: "console",
	})
	handler := NewCharacterHandler(store, logger)
	router := gin.New()
	router.Use(logger.Middleware())

	// Setup routes
	v1 := router.Group("/api")
	{
		characters := v1.Group("/characters")
		{
			characters.POST("", handler.CreateCharacter)
		}
	}

	character := models.Character{
		CharacterName: "Test Character",
		Race:          "Human",
		Class:         "Fighter",
		Level:         1,
		AbilityScores: models.AbilityScores{
			Strength:     models.AbilityScore{Base: 15},
			Dexterity:    models.AbilityScore{Base: 14},
			Constitution: models.AbilityScore{Base: 13},
			Intelligence: models.AbilityScore{Base: 12},
			Wisdom:       models.AbilityScore{Base: 10},
			Charisma:     models.AbilityScore{Base: 8},
		},
	}

	jsonData, _ := json.Marshal(character)
	req, _ := http.NewRequest("POST", "/api/characters", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d", http.StatusCreated, w.Code)
	}

	var response models.Character
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Errorf("Failed to unmarshal response: %v", err)
	}

	if response.CharacterName != character.CharacterName {
		t.Errorf("Expected character name %s, got %s", character.CharacterName, response.CharacterName)
	}
	if response.Race != character.Race {
		t.Errorf("Expected race %s, got %s", character.Race, response.Race)
	}
	if response.Class != character.Class {
		t.Errorf("Expected class %s, got %s", character.Class, response.Class)
	}
	if response.ID == uuid.Nil {
		t.Error("Expected non-nil ID")
	}
}

// TestCreateCharacter_ValidationError tests character creation with validation errors
func TestCreateCharacter_ValidationError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := database.NewMemoryStore()
	logger := logging.NewLogger(logging.Config{
		Level:  "error",
		Format: "json",
		Output: "console",
	})
	handler := NewCharacterHandler(store, logger)
	router := gin.New()
	router.Use(logger.Middleware())

	// Setup routes
	v1 := router.Group("/api")
	{
		characters := v1.Group("/characters")
		{
			characters.POST("", handler.CreateCharacter)
		}
	}

	character := models.Character{
		CharacterName: "", // Invalid: empty name
		Race:          "Human",
		Class:         "Fighter",
		Level:         25, // Invalid: level too high
	}

	jsonData, _ := json.Marshal(character)
	req, _ := http.NewRequest("POST", "/api/characters", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var response models.ValidationErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Errorf("Failed to unmarshal response: %v", err)
	}
	if len(response.Errors) == 0 {
		t.Error("Expected validation errors")
	}
}

// TestGetCharacter_Success tests successful character retrieval
func TestGetCharacter_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := database.NewMemoryStore()
	logger := logging.NewLogger(logging.Config{
		Level:  "error",
		Format: "json",
		Output: "console",
	})
	handler := NewCharacterHandler(store, logger)
	router := gin.New()
	router.Use(logger.Middleware())

	// Setup routes
	v1 := router.Group("/api")
	{
		characters := v1.Group("/characters")
		{
			characters.GET("/:id", handler.GetCharacter)
		}
	}

	// First create a character
	character := models.Character{
		CharacterName: "Test Character",
		Race:          "Human",
		Class:         "Fighter",
		Level:         1,
		AbilityScores: models.AbilityScores{
			Strength:     models.AbilityScore{Base: 15},
			Dexterity:    models.AbilityScore{Base: 14},
			Constitution: models.AbilityScore{Base: 13},
			Intelligence: models.AbilityScore{Base: 12},
			Wisdom:       models.AbilityScore{Base: 10},
			Charisma:     models.AbilityScore{Base: 8},
		},
	}

	err := store.Create(&character)
	if err != nil {
		t.Fatalf("Failed to create character: %v", err)
	}

	// Now retrieve it
	req, _ := http.NewRequest("GET", "/api/characters/"+character.ID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response models.Character
	err = json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Errorf("Failed to unmarshal response: %v", err)
	}
	if response.ID != character.ID {
		t.Errorf("Expected ID %s, got %s", character.ID, response.ID)
	}
	if response.CharacterName != character.CharacterName {
		t.Errorf("Expected character name %s, got %s", character.CharacterName, response.CharacterName)
	}
}

// TestGetCharacter_NotFound tests character retrieval when character doesn't exist
func TestGetCharacter_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := database.NewMemoryStore()
	logger := logging.NewLogger(logging.Config{
		Level:  "error",
		Format: "json",
		Output: "console",
	})
	handler := NewCharacterHandler(store, logger)
	router := gin.New()
	router.Use(logger.Middleware())

	// Setup routes
	v1 := router.Group("/api")
	{
		characters := v1.Group("/characters")
		{
			characters.GET("/:id", handler.GetCharacter)
		}
	}

	nonExistentID := uuid.New()
	req, _ := http.NewRequest("GET", "/api/characters/"+nonExistentID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestListCharacters tests listing all characters
func TestListCharacters(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := database.NewMemoryStore()
	logger := logging.NewLogger(logging.Config{
		Level:  "error",
		Format: "json",
		Output: "console",
	})
	handler := NewCharacterHandler(store, logger)
	router := gin.New()
	router.Use(logger.Middleware())

	// Setup routes
	v1 := router.Group("/api")
	{
		characters := v1.Group("/characters")
		{
			characters.GET("", handler.ListCharacters)
		}
	}

	// Create a couple of characters
	char1 := models.Character{
		CharacterName: "Character 1",
		Race:          "Human",
		Class:         "Fighter",
		Level:         1,
		AbilityScores: models.AbilityScores{
			Strength:     models.AbilityScore{Base: 15},
			Dexterity:    models.AbilityScore{Base: 14},
			Constitution: models.AbilityScore{Base: 13},
			Intelligence: models.AbilityScore{Base: 12},
			Wisdom:       models.AbilityScore{Base: 10},
			Charisma:     models.AbilityScore{Base: 8},
		},
	}
	char2 := models.Character{
		CharacterName: "Character 2",
		Race:          "Elf",
		Class:         "Wizard",
		Level:         2,
		AbilityScores: models.AbilityScores{
			Strength:     models.AbilityScore{Base: 8},
			Dexterity:    models.AbilityScore{Base: 16},
			Constitution: models.AbilityScore{Base: 12},
			Intelligence: models.AbilityScore{Base: 18},
			Wisdom:       models.AbilityScore{Base: 14},
			Charisma:     models.AbilityScore{Base: 10},
		},
	}

	err := store.Create(&char1)
	if err != nil {
		t.Fatalf("Failed to create character 1: %v", err)
	}
	err = store.Create(&char2)
	if err != nil {
		t.Fatalf("Failed to create character 2: %v", err)
	}

	req, _ := http.NewRequest("GET", "/api/characters", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response models.PaginationResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Errorf("Failed to unmarshal response: %v", err)
	}
	if len(response.Data) != 2 {
		t.Errorf("Expected 2 characters, got %d", len(response.Data))
	}
	if response.Pagination.Total != 2 {
		t.Errorf("Expected total 2, got %d", response.Pagination.Total)
	}
}

// TestUpdateCharacter_Success tests successful character update
func TestUpdateCharacter_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := database.NewMemoryStore()
	logger := logging.NewLogger(logging.Config{
		Level:  "error",
		Format: "json",
		Output: "console",
	})
	handler := NewCharacterHandler(store, logger)
	router := gin.New()
	router.Use(logger.Middleware())

	// Setup routes
	v1 := router.Group("/api")
	{
		characters := v1.Group("/characters")
		{
			characters.PUT("/:id", handler.UpdateCharacter)
		}
	}

	// Create a character
	character := models.Character{
		CharacterName: "Original Name",
		Race:          "Human",
		Class:         "Fighter",
		Level:         1,
		AbilityScores: models.AbilityScores{
			Strength:     models.AbilityScore{Base: 15},
			Dexterity:    models.AbilityScore{Base: 14},
			Constitution: models.AbilityScore{Base: 13},
			Intelligence: models.AbilityScore{Base: 12},
			Wisdom:       models.AbilityScore{Base: 10},
			Charisma:     models.AbilityScore{Base: 8},
		},
	}

	err := store.Create(&character)
	if err != nil {
		t.Fatalf("Failed to create character: %v", err)
	}

	// Update the character
	updatedCharacter := character
	updatedCharacter.CharacterName = "Updated Name"
	updatedCharacter.Level = 2

	jsonData, _ := json.Marshal(updatedCharacter)
	req, _ := http.NewRequest("PUT", "/api/characters/"+character.ID.String(), bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response models.Character
	err = json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Errorf("Failed to unmarshal response: %v", err)
	}
	if response.CharacterName != "Updated Name" {
		t.Errorf("Expected updated name 'Updated Name', got %s", response.CharacterName)
	}
	if response.Level != 2 {
		t.Errorf("Expected updated level 2, got %d", response.Level)
	}
}

// TestDeleteCharacter_Success tests successful character deletion
func TestDeleteCharacter_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := database.NewMemoryStore()
	logger := logging.NewLogger(logging.Config{
		Level:  "error",
		Format: "json",
		Output: "console",
	})
	handler := NewCharacterHandler(store, logger)
	router := gin.New()
	router.Use(logger.Middleware())

	// Setup routes
	v1 := router.Group("/api")
	{
		characters := v1.Group("/characters")
		{
			characters.DELETE("/:id", handler.DeleteCharacter)
			characters.GET("/:id", handler.GetCharacter)
		}
	}

	// Create a character
	character := models.Character{
		CharacterName: "Test Character",
		Race:          "Human",
		Class:         "Fighter",
		Level:         1,
		AbilityScores: models.AbilityScores{
			Strength:     models.AbilityScore{Base: 15},
			Dexterity:    models.AbilityScore{Base: 14},
			Constitution: models.AbilityScore{Base: 13},
			Intelligence: models.AbilityScore{Base: 12},
			Wisdom:       models.AbilityScore{Base: 10},
			Charisma:     models.AbilityScore{Base: 8},
		},
	}

	err := store.Create(&character)
	if err != nil {
		t.Fatalf("Failed to create character: %v", err)
	}

	// Delete the character
	req, _ := http.NewRequest("DELETE", "/api/characters/"+character.ID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("Expected status %d, got %d", http.StatusNoContent, w.Code)
	}

	// Verify it's deleted
	req2, _ := http.NewRequest("GET", "/api/characters/"+character.ID.String(), nil)
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	if w2.Code != http.StatusNotFound {
		t.Errorf("Expected status %d after deletion, got %d", http.StatusNotFound, w2.Code)
	}
}

// TestDeleteCharacter_NotFound tests deleting a non-existent character
func TestDeleteCharacter_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := database.NewMemoryStore()
	logger := logging.NewLogger(logging.Config{
		Level:  "error",
		Format: "json",
		Output: "console",
	})
	handler := NewCharacterHandler(store, logger)
	router := gin.New()
	router.Use(logger.Middleware())

	// Setup routes
	v1 := router.Group("/api")
	{
		characters := v1.Group("/characters")
		{
			characters.DELETE("/:id", handler.DeleteCharacter)
		}
	}

	nonExistentID := uuid.New()
	req, _ := http.NewRequest("DELETE", "/api/characters/"+nonExistentID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}
