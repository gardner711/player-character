package integration_tests

import (
	"os"
	"testing"
)

const (
	testBaseURL    = "http://localhost:8766"
	testMongoURI   = "mongodb://localhost:27018"
	testDatabase   = "playercharacter_test"
	testCollection = "playercharacters"
)

func TestMain(m *testing.M) {
	// Setup code if needed
	code := m.Run()
	// Cleanup code if needed
	os.Exit(code)
}

func setupTestClient(t *testing.T) *TestClient {
	client, err := NewTestClient(testBaseURL, testMongoURI, testDatabase, testCollection)
	if err != nil {
		t.Fatalf("Failed to create test client: %v", err)
	}

	// Clear collection before each test
	if err := client.ClearCollection(); err != nil {
		t.Fatalf("Failed to clear collection: %v", err)
	}

	return client
}

func TestCharacterCRUDIntegration(t *testing.T) {
	client := setupTestClient(t)
	defer client.Close()

	t.Run("CreateCharacter", func(t *testing.T) {
		// Create a character
		createdCharacter, err := client.CreateCharacter(&TestCharacterData)
		if err != nil {
			t.Fatalf("Failed to create character: %v", err)
		}

		if createdCharacter.ID == "" {
			t.Error("Created character should have an ID")
		}

		if createdCharacter.CharacterName != TestCharacterData.CharacterName {
			t.Errorf("Expected character name %s, got %s", TestCharacterData.CharacterName, createdCharacter.CharacterName)
		}

		// Verify in MongoDB
		mongoCharacter, err := client.GetCharacterFromMongo(createdCharacter.ID)
		if err != nil {
			t.Fatalf("Failed to get character from MongoDB: %v", err)
		}

		if mongoCharacter == nil {
			t.Fatal("Character not found in MongoDB")
		}

		if mongoCharacter.CharacterName != TestCharacterData.CharacterName {
			t.Errorf("MongoDB character name mismatch: expected %s, got %s", TestCharacterData.CharacterName, mongoCharacter.CharacterName)
		}

		if mongoCharacter.Level != TestCharacterData.Level {
			t.Errorf("MongoDB character level mismatch: expected %d, got %d", TestCharacterData.Level, mongoCharacter.Level)
		}
	})

	t.Run("GetCharacter", func(t *testing.T) {
		// First create a character
		createdCharacter, err := client.CreateCharacter(&TestCharacterData)
		if err != nil {
			t.Fatalf("Failed to create character: %v", err)
		}

		// Retrieve the character
		retrievedCharacter, err := client.GetCharacter(createdCharacter.ID)
		if err != nil {
			t.Fatalf("Failed to get character: %v", err)
		}

		if retrievedCharacter == nil {
			t.Fatal("Character not found")
		}

		if retrievedCharacter.ID != createdCharacter.ID {
			t.Errorf("Retrieved character ID mismatch: expected %s, got %s", createdCharacter.ID, retrievedCharacter.ID)
		}

		if retrievedCharacter.CharacterName != TestCharacterData.CharacterName {
			t.Errorf("Retrieved character name mismatch: expected %s, got %s", TestCharacterData.CharacterName, retrievedCharacter.CharacterName)
		}
	})

	t.Run("ListCharacters", func(t *testing.T) {
		// Create multiple characters
		var createdIDs []string
		for _, char := range TestCharactersData {
			created, err := client.CreateCharacter(&char)
			if err != nil {
				t.Fatalf("Failed to create character: %v", err)
			}
			createdIDs = append(createdIDs, created.ID)
		}

		// Get all characters
		paginationResponse, err := client.GetCharacters(1, 10)
		if err != nil {
			t.Fatalf("Failed to get characters: %v", err)
		}

		if len(paginationResponse.Data) != len(TestCharactersData) {
			t.Errorf("Expected %d characters, got %d", len(TestCharactersData), len(paginationResponse.Data))
		}

		if paginationResponse.Pagination.Total != len(TestCharactersData) {
			t.Errorf("Expected total %d, got %d", len(TestCharactersData), paginationResponse.Pagination.Total)
		}

		// Verify pagination metadata
		if paginationResponse.Pagination.Page != 1 {
			t.Errorf("Expected page 1, got %d", paginationResponse.Pagination.Page)
		}

		if paginationResponse.Pagination.Limit != 10 {
			t.Errorf("Expected limit 10, got %d", paginationResponse.Pagination.Limit)
		}
	})

	t.Run("UpdateCharacter", func(t *testing.T) {
		// Create a character
		createdCharacter, err := client.CreateCharacter(&TestCharacterData)
		if err != nil {
			t.Fatalf("Failed to create character: %v", err)
		}

		// Update the character
		UpdatedTestCharacterData.ID = createdCharacter.ID // Set the ID for update
		updatedCharacter, err := client.UpdateCharacter(createdCharacter.ID, &UpdatedTestCharacterData)
		if err != nil {
			t.Fatalf("Failed to update character: %v", err)
		}

		if updatedCharacter.CharacterName != UpdatedTestCharacterData.CharacterName {
			t.Errorf("Expected updated name %s, got %s", UpdatedTestCharacterData.CharacterName, updatedCharacter.CharacterName)
		}

		if updatedCharacter.Level != UpdatedTestCharacterData.Level {
			t.Errorf("Expected updated level %d, got %d", UpdatedTestCharacterData.Level, updatedCharacter.Level)
		}

		// Verify in MongoDB
		mongoCharacter, err := client.GetCharacterFromMongo(createdCharacter.ID)
		if err != nil {
			t.Fatalf("Failed to get updated character from MongoDB: %v", err)
		}

		if mongoCharacter.CharacterName != UpdatedTestCharacterData.CharacterName {
			t.Errorf("MongoDB updated character name mismatch: expected %s, got %s", UpdatedTestCharacterData.CharacterName, mongoCharacter.CharacterName)
		}
	})

	t.Run("DeleteCharacter", func(t *testing.T) {
		// Create a character
		createdCharacter, err := client.CreateCharacter(&TestCharacterData)
		if err != nil {
			t.Fatalf("Failed to create character: %v", err)
		}

		// Delete the character
		err = client.DeleteCharacter(createdCharacter.ID)
		if err != nil {
			t.Fatalf("Failed to delete character: %v", err)
		}

		// Verify it's deleted from API
		retrievedCharacter, err := client.GetCharacter(createdCharacter.ID)
		if err != nil {
			t.Fatalf("Failed to check deleted character: %v", err)
		}

		if retrievedCharacter != nil {
			t.Error("Character should not be found after deletion")
		}

		// Verify it's deleted from MongoDB
		mongoCharacter, err := client.GetCharacterFromMongo(createdCharacter.ID)
		if err != nil {
			t.Fatalf("Failed to check deleted character in MongoDB: %v", err)
		}

		if mongoCharacter != nil {
			t.Error("Character should not be found in MongoDB after deletion")
		}
	})

	t.Run("ErrorScenarios", func(t *testing.T) {
		t.Run("GetNonExistentCharacter", func(t *testing.T) {
			character, err := client.GetCharacter("non-existent-id")
			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}

			if character != nil {
				t.Error("Should return nil for non-existent character")
			}
		})

		t.Run("UpdateNonExistentCharacter", func(t *testing.T) {
			_, err := client.UpdateCharacter("non-existent-id", &TestCharacterData)
			if err == nil {
				t.Error("Should return error for updating non-existent character")
			}
		})

		t.Run("DeleteNonExistentCharacter", func(t *testing.T) {
			err := client.DeleteCharacter("non-existent-id")
			if err == nil {
				t.Error("Should return error for deleting non-existent character")
			}
		})
	})

	t.Run("DataConsistency", func(t *testing.T) {
		// Create a character
		createdCharacter, err := client.CreateCharacter(&TestCharacterData)
		if err != nil {
			t.Fatalf("Failed to create character: %v", err)
		}

		// Get from API
		apiCharacter, err := client.GetCharacter(createdCharacter.ID)
		if err != nil {
			t.Fatalf("Failed to get character from API: %v", err)
		}

		// Get from MongoDB
		mongoCharacter, err := client.GetCharacterFromMongo(createdCharacter.ID)
		if err != nil {
			t.Fatalf("Failed to get character from MongoDB: %v", err)
		}

		// Compare key fields
		if apiCharacter.ID != mongoCharacter.ID {
			t.Errorf("ID mismatch: API=%s, MongoDB=%s", apiCharacter.ID, mongoCharacter.ID)
		}

		if apiCharacter.CharacterName != mongoCharacter.CharacterName {
			t.Errorf("Name mismatch: API=%s, MongoDB=%s", apiCharacter.CharacterName, mongoCharacter.CharacterName)
		}

		if apiCharacter.Level != mongoCharacter.Level {
			t.Errorf("Level mismatch: API=%d, MongoDB=%d", apiCharacter.Level, mongoCharacter.Level)
		}

		if apiCharacter.AbilityScores.Strength.Base != mongoCharacter.AbilityScores.Strength.Base {
			t.Errorf("Strength mismatch: API=%d, MongoDB=%d", apiCharacter.AbilityScores.Strength.Base, mongoCharacter.AbilityScores.Strength.Base)
		}
	})
}

func TestPaginationIntegration(t *testing.T) {
	client := setupTestClient(t)
	defer client.Close()

	// Create multiple characters
	for _, char := range TestCharactersData {
		_, err := client.CreateCharacter(&char)
		if err != nil {
			t.Fatalf("Failed to create character: %v", err)
		}
	}

	t.Run("PaginationParameters", func(t *testing.T) {
		// Test page 1, limit 2
		response, err := client.GetCharacters(1, 2)
		if err != nil {
			t.Fatalf("Failed to get characters: %v", err)
		}

		if len(response.Data) != 2 {
			t.Errorf("Expected 2 characters on page 1, got %d", len(response.Data))
		}

		if response.Pagination.Page != 1 {
			t.Errorf("Expected page 1, got %d", response.Pagination.Page)
		}

		if response.Pagination.Limit != 2 {
			t.Errorf("Expected limit 2, got %d", response.Pagination.Limit)
		}

		if !response.Pagination.HasNext {
			t.Error("Should have next page")
		}
	})

	t.Run("LastPage", func(t *testing.T) {
		// Test last page
		response, err := client.GetCharacters(2, 2)
		if err != nil {
			t.Fatalf("Failed to get characters: %v", err)
		}

		if len(response.Data) != 1 { // 3 total characters, page 2 with limit 2 should have 1
			t.Errorf("Expected 1 character on page 2, got %d", len(response.Data))
		}

		if response.Pagination.HasNext {
			t.Error("Should not have next page")
		}

		if !response.Pagination.HasPrev {
			t.Error("Should have previous page")
		}
	})
}
