package models

import (
	"time"

	"github.com/google/uuid"
)

// Character represents a D&D 5e player character
type Character struct {
	ID               uuid.UUID         `json:"id" swaggo:"unique"`
	CharacterName    string            `json:"characterName" validate:"required" swaggo:"required"`
	PlayerName       string            `json:"playerName,omitempty"`
	Race             string            `json:"race" validate:"required" swaggo:"required"`
	Subrace          string            `json:"subrace,omitempty"`
	Class            string            `json:"class" validate:"required" swaggo:"required"`
	Subclass         string            `json:"subclass,omitempty"`
	Multiclass       []MulticlassEntry `json:"multiclass,omitempty"`
	Level            int               `json:"level" validate:"required,min=1,max=20" swaggo:"required,minimum=1,maximum=20"`
	ExperiencePoints int               `json:"experiencePoints,omitempty" validate:"min=0"`
	Background       string            `json:"background,omitempty"`
	Alignment        string            `json:"alignment,omitempty" validate:"omitempty,oneof=Lawful Good Neutral Good Chaotic Good Lawful Neutral True Neutral Chaotic Neutral Lawful Evil Neutral Evil Chaotic Evil"`
	AbilityScores    AbilityScores     `json:"abilityScores" validate:"required" swaggo:"required"`
	CreatedAt        time.Time         `json:"createdAt"`
	UpdatedAt        time.Time         `json:"updatedAt"`
}

// MulticlassEntry represents a multiclass entry
type MulticlassEntry struct {
	Class    string `json:"class" validate:"required"`
	Subclass string `json:"subclass,omitempty"`
	Level    int    `json:"level" validate:"required,min=1,max=20"`
}

// AbilityScores represents the six ability scores
type AbilityScores struct {
	Strength     AbilityScore `json:"strength" validate:"required"`
	Dexterity    AbilityScore `json:"dexterity" validate:"required"`
	Constitution AbilityScore `json:"constitution" validate:"required"`
	Intelligence AbilityScore `json:"intelligence" validate:"required"`
	Wisdom       AbilityScore `json:"wisdom" validate:"required"`
	Charisma     AbilityScore `json:"charisma" validate:"required"`
}

// AbilityScore represents a single ability score with base value
type AbilityScore struct {
	Base int `json:"base" validate:"min=1,max=20"`
}

// PaginationResponse represents a paginated response
type PaginationResponse struct {
	Data       []Character `json:"data"`
	Pagination Pagination  `json:"pagination"`
}

// Pagination represents pagination metadata
type Pagination struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int  `json:"total"`
	TotalPages int  `json:"totalPages"`
	HasNext    bool `json:"hasNext"`
	HasPrev    bool `json:"hasPrev"`
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Code    string `json:"code"`
}

// ValidationErrorResponse represents validation error response
type ValidationErrorResponse struct {
	Errors []ValidationError `json:"errors"`
}
