package api

import (
	"net/http"
	"strconv"

	"player-character/internal/models"
	"player-character/internal/validation"
	"player-character/pkg/database"
	"player-character/pkg/logging"

	"github.com/gin-gonic/gin"
)

// CharacterHandler handles character-related HTTP requests
type CharacterHandler struct {
	store  database.CharacterStore
	logger *logging.Logger
}

// NewCharacterHandler creates a new character handler
func NewCharacterHandler(store database.CharacterStore, logger *logging.Logger) *CharacterHandler {
	return &CharacterHandler{
		store:  store,
		logger: logger,
	}
}

// CreateCharacter handles POST /api/characters
// @Summary Create a new character
// @Description Create a new D&D 5e character with validation
// @Tags characters
// @Accept json
// @Produce json
// @Param character body models.Character true "Character data"
// @Success 201 {object} models.Character
// @Failure 400 {object} models.ValidationErrorResponse
// @Failure 500 {object} map[string]string
// @Router /api/characters [post]
func (h *CharacterHandler) CreateCharacter(c *gin.Context) {
	var character models.Character

	if err := c.ShouldBindJSON(&character); err != nil {
		h.logger.ErrorWithContext(c.Request.Context(), "Invalid JSON in character creation", err,
			"client_ip", c.ClientIP(),
			"user_agent", c.Request.UserAgent())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}

	// Validate character
	if validationErrors := validation.ValidateCharacter(&character); len(validationErrors) > 0 {
		h.logger.Warn("Character validation failed",
			"character_name", character.CharacterName,
			"validation_errors", validationErrors)
		c.JSON(http.StatusBadRequest, models.ValidationErrorResponse{Errors: validationErrors})
		return
	}

	// Create character
	if err := h.store.Create(&character); err != nil {
		h.logger.ErrorWithContext(c.Request.Context(), "Failed to create character", err,
			"character_name", character.CharacterName,
			"character_id", character.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create character: " + err.Error()})
		return
	}

	h.logger.Info("Character created successfully",
		"character_id", character.ID,
		"character_name", character.CharacterName,
		"character_class", character.Class)

	c.JSON(http.StatusCreated, gin.H{
		"data":    character,
		"message": "Character created successfully",
		"success": true,
	})
}

// GetCharacter handles GET /api/characters/{id}
// @Summary Get a character by ID
// @Description Retrieve a specific character by its ID
// @Tags characters
// @Produce json
// @Param id path string true "Character ID"
// @Success 200 {object} models.Character
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/characters/{id} [get]
func (h *CharacterHandler) GetCharacter(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Character ID is required"})
		return
	}

	character, err := h.store.Get(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    character,
		"message": "Character retrieved successfully",
		"success": true,
	})
}

// ListCharacters handles GET /api/characters
// @Summary List characters
// @Description Get a paginated list of characters with optional sorting
// @Tags characters
// @Produce json
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param limit query int false "Items per page (default: 20, max: 100)" minimum(1) maximum(100)
// @Param sortBy query string false "Sort field (characterName, level, race, class, createdAt)" enum(characterName,level,race,class,createdAt)
// @Param sortOrder query string false "Sort order (asc, desc)" enum(asc,desc)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/characters [get]
func (h *CharacterHandler) ListCharacters(c *gin.Context) {
	// Parse pagination parameters
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page parameter"})
		return
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter (1-100)"})
		return
	}

	// Parse sorting parameters
	sortBy := c.DefaultQuery("sortBy", "createdAt")
	sortOrder := c.DefaultQuery("sortOrder", "desc")

	// Validate sortBy parameter
	validSortFields := map[string]bool{
		"characterName": true,
		"level":         true,
		"race":          true,
		"class":         true,
		"createdAt":     true,
	}
	if !validSortFields[sortBy] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sortBy parameter"})
		return
	}

	// Validate sortOrder parameter
	if sortOrder != "asc" && sortOrder != "desc" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sortOrder parameter (must be 'asc' or 'desc')"})
		return
	}

	characters, total, err := h.store.List(page, limit, sortBy, sortOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve characters"})
		return
	}

	// Calculate pagination metadata
	totalPages := (total + limit - 1) / limit // Ceiling division

	c.JSON(http.StatusOK, gin.H{
		"data":       characters,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
} // UpdateCharacter handles PUT /api/characters/{id}
// @Summary Update a character
// @Description Update an existing character by ID
// @Tags characters
// @Accept json
// @Produce json
// @Param id path string true "Character ID"
// @Param character body models.Character true "Updated character data"
// @Success 200 {object} models.Character
// @Failure 400 {object} models.ValidationErrorResponse
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/characters/{id} [put]
func (h *CharacterHandler) UpdateCharacter(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Character ID is required"})
		return
	}

	var character models.Character
	if err := c.ShouldBindJSON(&character); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}

	// Validate character
	if validationErrors := validation.ValidateCharacter(&character); len(validationErrors) > 0 {
		c.JSON(http.StatusBadRequest, models.ValidationErrorResponse{Errors: validationErrors})
		return
	}

	// Update character
	if err := h.store.Update(idStr, &character); err != nil {
		if err.Error() == "character not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update character: " + err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    character,
		"message": "Character updated successfully",
		"success": true,
	})
}

// DeleteCharacter handles DELETE /api/characters/{id}
// @Summary Delete a character
// @Description Delete a character by ID
// @Tags characters
// @Produce json
// @Param id path string true "Character ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/characters/{id} [delete]
func (h *CharacterHandler) DeleteCharacter(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Character ID is required"})
		return
	}

	if err := h.store.Delete(idStr); err != nil {
		if err.Error() == "character not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete character: " + err.Error()})
		}
		return
	}

	c.Status(http.StatusNoContent)
}
