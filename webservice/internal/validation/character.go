package validation

import (
	"encoding/json"
	"fmt"
	"strings"

	"player-character/internal/models"

	"github.com/go-playground/validator/v10"
)

// validateAlignment validates that the alignment is one of the allowed D&D alignments
func validateAlignment(fl validator.FieldLevel) bool {
	alignment := fl.Field().String()
	if alignment == "" {
		return true // Allow empty alignment
	}

	validAlignments := []string{
		"Lawful Good", "Neutral Good", "Chaotic Good",
		"Lawful Neutral", "True Neutral", "Chaotic Neutral",
		"Lawful Evil", "Neutral Evil", "Chaotic Evil",
	}

	for _, valid := range validAlignments {
		if alignment == valid {
			return true
		}
	}
	return false
}

// ValidateCharacter validates a character against business rules and schema
func ValidateCharacter(character *models.Character) []models.ValidationError {
	var errors []models.ValidationError

	// Use struct validation
	validate := validator.New()

	// Register custom alignment validator
	validate.RegisterValidation("alignment", validateAlignment)

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
				message = fmt.Sprintf("%s must be at least %s, got %v", field, err.Param(), err.Value())
			case "max":
				message = fmt.Sprintf("%s must be at most %s, got %v", field, err.Param(), err.Value())
			case "oneof":
				message = fmt.Sprintf("%s must be one of: %s, got %v", field, err.Param(), err.Value())
			default:
				message = fmt.Sprintf("%s is invalid (value: %v)", field, err.Value())
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
			Message: fmt.Sprintf("Invalid race '%s'. Must be one of: %s", character.Race, strings.Join(validRaces, ", ")),
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
			Message: fmt.Sprintf("Invalid class '%s'. Must be one of: %s", character.Class, strings.Join(validClasses, ", ")),
			Code:    "INVALID_CLASS",
		})
	}

	// Validate multiclass levels
	totalLevel := character.Level
	for i, mc := range character.Multiclass {
		if !contains(validClasses, mc.Class) {
			errors = append(errors, models.ValidationError{
				Field:   fmt.Sprintf("multiclass[%d].class", i),
				Message: fmt.Sprintf("Invalid multiclass class '%s'. Must be one of: %s", mc.Class, strings.Join(validClasses, ", ")),
				Code:    "INVALID_MULTICLASS",
			})
		}
		totalLevel += mc.Level
	}

	// Total level should not exceed reasonable bounds (allowing for epic level play)
	if totalLevel > 30 {
		errors = append(errors, models.ValidationError{
			Field:   "level",
			Message: fmt.Sprintf("Total character level %d exceeds maximum allowed (30)", totalLevel),
			Code:    "LEVEL_TOO_HIGH",
		})
	}

	// Validate ability scores are within valid ranges
	abilityFields := map[string]int{
		"abilityScores.strength":     character.AbilityScores.Strength.Base,
		"abilityScores.dexterity":    character.AbilityScores.Dexterity.Base,
		"abilityScores.constitution": character.AbilityScores.Constitution.Base,
		"abilityScores.intelligence": character.AbilityScores.Intelligence.Base,
		"abilityScores.wisdom":       character.AbilityScores.Wisdom.Base,
		"abilityScores.charisma":     character.AbilityScores.Charisma.Base,
	}

	for field, value := range abilityFields {
		if value < 1 || value > 20 {
			errors = append(errors, models.ValidationError{
				Field:   field,
				Message: fmt.Sprintf("Ability score %s must be between 1 and 20, got %d", strings.TrimPrefix(field, "abilityScores."), value),
				Code:    "INVALID_ABILITY_SCORE",
			})
		}
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
