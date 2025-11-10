package integration_tests

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"player-character/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// TestClient provides utilities for integration testing
type TestClient struct {
	BaseURL     string
	HTTPClient  *http.Client
	MongoClient *mongo.Client
	Database    *mongo.Database
	Collection  *mongo.Collection
}

// NewTestClient creates a new test client for integration testing
func NewTestClient(baseURL, mongoURI, database, collection string) (*TestClient, error) {
	// Setup HTTP client
	httpClient := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Setup MongoDB client
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping MongoDB
	if err := mongoClient.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	db := mongoClient.Database(database)
	coll := db.Collection(collection)

	return &TestClient{
		BaseURL:     baseURL,
		HTTPClient:  httpClient,
		MongoClient: mongoClient,
		Database:    db,
		Collection:  coll,
	}, nil
}

// Close closes the test client connections
func (tc *TestClient) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return tc.MongoClient.Disconnect(ctx)
}

// ClearCollection removes all documents from the test collection
func (tc *TestClient) ClearCollection() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return tc.Collection.Drop(ctx)
}

// CreateCharacter sends a POST request to create a character
func (tc *TestClient) CreateCharacter(character *models.Character) (*models.Character, error) {
	jsonData, err := json.Marshal(character)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal character: %w", err)
	}

	req, err := http.NewRequest("POST", tc.BaseURL+"/api/characters", strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := tc.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}

	var createdCharacter models.Character
	if err := json.NewDecoder(resp.Body).Decode(&createdCharacter); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &createdCharacter, nil
}

// GetCharacters sends a GET request to retrieve all characters
func (tc *TestClient) GetCharacters(page, limit int) (*models.PaginationResponse, error) {
	url := fmt.Sprintf("%s/api/characters?page=%d&limit=%d", tc.BaseURL, page, limit)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := tc.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}

	var paginationResponse models.PaginationResponse
	if err := json.NewDecoder(resp.Body).Decode(&paginationResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &paginationResponse, nil
}

// GetCharacter sends a GET request to retrieve a character by ID
func (tc *TestClient) GetCharacter(id string) (*models.Character, error) {
	req, err := http.NewRequest("GET", tc.BaseURL+"/api/characters/"+id, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := tc.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil // Character not found
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}

	var character models.Character
	if err := json.NewDecoder(resp.Body).Decode(&character); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &character, nil
}

// UpdateCharacter sends a PUT request to update a character
func (tc *TestClient) UpdateCharacter(id string, character *models.Character) (*models.Character, error) {
	jsonData, err := json.Marshal(character)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal character: %w", err)
	}

	req, err := http.NewRequest("PUT", tc.BaseURL+"/api/characters/"+id, strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := tc.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}

	var updatedCharacter models.Character
	if err := json.NewDecoder(resp.Body).Decode(&updatedCharacter); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &updatedCharacter, nil
}

// DeleteCharacter sends a DELETE request to remove a character
func (tc *TestClient) DeleteCharacter(id string) error {
	req, err := http.NewRequest("DELETE", tc.BaseURL+"/api/characters/"+id, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := tc.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

// GetCharacterFromMongo retrieves a character directly from MongoDB
func (tc *TestClient) GetCharacterFromMongo(id string) (*models.Character, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var character models.Character
	err := tc.Collection.FindOne(ctx, bson.M{"id": id}).Decode(&character)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil // Character not found
		}
		return nil, fmt.Errorf("failed to find character in MongoDB: %w", err)
	}

	return &character, nil
}

// CountCharactersInMongo returns the count of characters in MongoDB
func (tc *TestClient) CountCharactersInMongo() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := tc.Collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return 0, fmt.Errorf("failed to count characters in MongoDB: %w", err)
	}

	return count, nil
}
