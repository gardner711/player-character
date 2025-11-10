package validation

import (
	"encoding/json"
	"fmt"
	"strings"

	"player-character/internal/models"

	"github.com/go-playground/validator/v10"
)

// ValidateCharacter validates a character against business rules and schema
func ValidateCharacter(character *models.Character) []models.ValidationError {
	var errors []models.ValidationError

	// Use struct validation
	validate := validator.New()
	err := validate.Struct(character)
	if err != nil {
		for _, err := range err.(validator.ValidationErrors) {
			field := strings.ToLower(err.Field())
			if field == "id" {
				continue // Skip ID validation for new characters
			}

			var message string
			switch err.Tag() {
			case "required":
				message = fmt.Sprintf("%s is required", field)
			case "min":
				message = fmt.Sprintf("%s must be at least %s", field, err.Param())
			case "max":
				message = fmt.Sprintf("%s must be at most %s", field, err.Param())
			case "oneof":
				message = fmt.Sprintf("%s must be one of: %s", field, err.Param())
			default:
				message = fmt.Sprintf("%s is invalid", field)
			}

			errors = append(errors, models.ValidationError{
				Field:   field,
				Message: message,
				Code:    "VALIDATION_ERROR",
			})
		}
	}

	// Business rule validations
	errors = append(errors, validateBusinessRules(character)...)

	return errors
}

// validateBusinessRules performs D&D 5e specific business rule validation
func validateBusinessRules(character *models.Character) []models.ValidationError {
	var errors []models.ValidationError

	// Validate race
	validRaces := []string{
		"Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Gnome",
		"Half-Elf", "Half-Orc", "Tiefling",
	}
	if !contains(validRaces, character.Race) {
		errors = append(errors, models.ValidationError{
			Field:   "race",
			Message: "Invalid race. Must be one of: " + strings.Join(validRaces, ", "),
			Code:    "INVALID_RACE",
		})
	}

	// Validate class
	validClasses := []string{
		"Fighter", "Wizard", "Rogue", "Cleric", "Barbarian", "Bard",
		"Druid", "Monk", "Paladin", "Ranger", "Sorcerer", "Warlock",
	}
	if !contains(validClasses, character.Class) {
		errors = append(errors, models.ValidationError{
			Field:   "class",
			Message: "Invalid class. Must be one of: " + strings.Join(validClasses, ", "),
			Code:    "INVALID_CLASS",
		})
	}

	// Validate multiclass levels
	totalLevel := character.Level
	for i, mc := range character.Multiclass {
		if !contains(validClasses, mc.Class) {
			errors = append(errors, models.ValidationError{
				Field:   fmt.Sprintf("multiclass[%d].class", i),
				Message: "Invalid multiclass. Must be one of: " + strings.Join(validClasses, ", "),
				Code:    "INVALID_MULTICLASS",
			})
		}
		totalLevel += mc.Level
	}

	// Total level should not exceed reasonable bounds (allowing for epic level play)
	if totalLevel > 30 {
		errors = append(errors, models.ValidationError{
			Field:   "level",
			Message: "Total character level exceeds maximum allowed",
			Code:    "LEVEL_TOO_HIGH",
		})
	}

	return errors
}

// ValidateCharacterJSON validates character data from JSON
func ValidateCharacterJSON(jsonData []byte) ([]models.ValidationError, error) {
	var character models.Character
	if err := json.Unmarshal(jsonData, &character); err != nil {
		return []models.ValidationError{{
			Field:   "json",
			Message: "Invalid JSON format: " + err.Error(),
			Code:    "INVALID_JSON",
		}}, nil
	}

	return ValidateCharacter(&character), nil
}

// contains checks if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
