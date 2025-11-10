package integration_tests

import (
	"os"
	"testing"
)

const (
	testBaseURL    = "http://localhost:8765"
	testMongoURI   = "mongodb://localhost:27017"
	testDatabase   = "playercharacter"
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

	// Clear collection before each test to ensure isolation
	if err := client.ClearCollection(); err != nil {
		t.Fatalf("Failed to clear collection: %v", err)
	}

	return client
}

func TestCharacterCreate(t *testing.T) {
	client := setupTestClient(t)
	defer client.Close()

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
}

func TestCharacterList(t *testing.T) {
	client := setupTestClient(t)
	defer client.Close()

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
