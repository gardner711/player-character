package models

import (
	"time"
)

// Character represents a D&D 5e player character
type Character struct {
	ID               string            `json:"id" bson:"id" swaggo:"unique"`
	CharacterName    string            `json:"characterName" bson:"characterName" validate:"required" swaggo:"required"`
	PlayerName       string            `json:"playerName" bson:"playerName,omitempty"`
	Race             string            `json:"race" bson:"race" validate:"required" swaggo:"required"`
	Subrace          string            `json:"subrace" bson:"subrace,omitempty"`
	Class            string            `json:"class" bson:"class" validate:"required" swaggo:"required"`
	Subclass         string            `json:"subclass" bson:"subclass,omitempty"`
	Multiclass       []MulticlassEntry `json:"multiclass" bson:"multiclass,omitempty"`
	Level            int               `json:"level" bson:"level" validate:"required,min=1,max=20" swaggo:"required,minimum=1,maximum=20"`
	ExperiencePoints int               `json:"experiencePoints" bson:"experiencePoints,omitempty" validate:"min=0"`
	Background       string            `json:"background" bson:"background,omitempty"`
	Alignment        string            `json:"alignment" bson:"alignment,omitempty" validate:"omitempty,oneof=Lawful Good Neutral Good Chaotic Good Lawful Neutral True Neutral Chaotic Neutral Lawful Evil Neutral Evil Chaotic Evil"`
	AbilityScores    AbilityScores     `json:"abilityScores" bson:"abilityScores" validate:"required" swaggo:"required"`
	CreatedAt        time.Time         `json:"createdAt" bson:"createdAt"`
	UpdatedAt        time.Time         `json:"updatedAt" bson:"updatedAt"`
}

// MulticlassEntry represents a multiclass entry
type MulticlassEntry struct {
	Class    string `json:"class" bson:"class" validate:"required"`
	Subclass string `json:"subclass" bson:"subclass,omitempty"`
	Level    int    `json:"level" bson:"level" validate:"required,min=1,max=20"`
}

// AbilityScores represents the six ability scores
type AbilityScores struct {
	Strength     AbilityScore `json:"strength" bson:"strength" validate:"required"`
	Dexterity    AbilityScore `json:"dexterity" bson:"dexterity" validate:"required"`
	Constitution AbilityScore `json:"constitution" bson:"constitution" validate:"required"`
	Intelligence AbilityScore `json:"intelligence" bson:"intelligence" validate:"required"`
	Wisdom       AbilityScore `json:"wisdom" bson:"wisdom" validate:"required"`
	Charisma     AbilityScore `json:"charisma" bson:"charisma" validate:"required"`
}

// AbilityScore represents a single ability score with base value
type AbilityScore struct {
	Base int `json:"base" bson:"base" validate:"min=1,max=20"`
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
