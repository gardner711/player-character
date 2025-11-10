package integration_tests

import (
	"player-character/webservice/internal/models"
)

// TestCharacterData provides sample character data for integration tests
var TestCharacterData = models.Character{
	CharacterName:    "Integration Test Character",
	PlayerName:       "Test Player",
	Race:             "Human",
	Class:            "Fighter",
	Level:            3,
	Background:       "Soldier",
	Alignment:        "Lawful Good",
	ExperiencePoints: 2700,
	AbilityScores: models.AbilityScores{
		Strength:     models.AbilityScore{Base: 16},
		Dexterity:    models.AbilityScore{Base: 14},
		Constitution: models.AbilityScore{Base: 15},
		Intelligence: models.AbilityScore{Base: 12},
		Wisdom:       models.AbilityScore{Base: 13},
		Charisma:     models.AbilityScore{Base: 10},
	},
}

// UpdatedTestCharacterData provides modified character data for update tests
var UpdatedTestCharacterData = models.Character{
	CharacterName:    "Updated Integration Test Character",
	PlayerName:       "Updated Test Player",
	Race:             "Human",
	Class:            "Fighter",
	Level:            4,
	Background:       "Soldier",
	Alignment:        "Lawful Good",
	ExperiencePoints: 5500,
	AbilityScores: models.AbilityScores{
		Strength:     models.AbilityScore{Base: 17},
		Dexterity:    models.AbilityScore{Base: 14},
		Constitution: models.AbilityScore{Base: 15},
		Intelligence: models.AbilityScore{Base: 12},
		Wisdom:       models.AbilityScore{Base: 13},
		Charisma:     models.AbilityScore{Base: 10},
	},
}

// TestCharactersData provides multiple characters for list testing
var TestCharactersData = []models.Character{
	{
		CharacterName: "Character Alpha",
		Race:          "Elf",
		Class:         "Wizard",
		Level:         5,
		AbilityScores: models.AbilityScores{
			Strength:     models.AbilityScore{Base: 8},
			Dexterity:    models.AbilityScore{Base: 16},
			Constitution: models.AbilityScore{Base: 12},
			Intelligence: models.AbilityScore{Base: 18},
			Wisdom:       models.AbilityScore{Base: 14},
			Charisma:     models.AbilityScore{Base: 10},
		},
	},
	{
		CharacterName: "Character Beta",
		Race:          "Dwarf",
		Class:         "Cleric",
		Level:         4,
		AbilityScores: models.AbilityScores{
			Strength:     models.AbilityScore{Base: 14},
			Dexterity:    models.AbilityScore{Base: 10},
			Constitution: models.AbilityScore{Base: 16},
			Intelligence: models.AbilityScore{Base: 12},
			Wisdom:       models.AbilityScore{Base: 16},
			Charisma:     models.AbilityScore{Base: 13},
		},
	},
	{
		CharacterName: "Character Gamma",
		Race:          "Halfling",
		Class:         "Rogue",
		Level:         6,
		AbilityScores: models.AbilityScores{
			Strength:     models.AbilityScore{Base: 10},
			Dexterity:    models.AbilityScore{Base: 18},
			Constitution: models.AbilityScore{Base: 14},
			Intelligence: models.AbilityScore{Base: 12},
			Wisdom:       models.AbilityScore{Base: 13},
			Charisma:     models.AbilityScore{Base: 15},
		},
	},
}
