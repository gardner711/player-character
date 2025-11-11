package database

import (
	"context"
	"errors"
	"time"

	"player-character/internal/models"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoStore implements MongoDB-based character storage
type MongoStore struct {
	client     *mongo.Client
	database   *mongo.Database
	collection *mongo.Collection
}

// NewMongoStore creates a new MongoDB store
func NewMongoStore(connectionString, databaseName, collectionName string) (*MongoStore, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(connectionString))
	if err != nil {
		return nil, err
	}

	// Ping the database to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	database := client.Database(databaseName)
	collection := database.Collection(collectionName)

	return &MongoStore{
		client:     client,
		database:   database,
		collection: collection,
	}, nil
}

// Disconnect closes the MongoDB connection
func (s *MongoStore) Disconnect(ctx context.Context) error {
	return s.client.Disconnect(ctx)
}

// Create stores a new character
func (s *MongoStore) Create(character *models.Character) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Generate ID if not provided
	if character.ID == "" {
		character.ID = uuid.New().String()
	}

	// Set timestamps
	now := time.Now()
	character.CreatedAt = now
	character.UpdatedAt = now

	_, err := s.collection.InsertOne(ctx, character)
	return err
}

// Get retrieves a character by ID
func (s *MongoStore) Get(id string) (*models.Character, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var character models.Character
	filter := bson.M{"id": id}

	err := s.collection.FindOne(ctx, filter).Decode(&character)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("character not found")
		}
		return nil, err
	}

	return &character, nil
}

// List retrieves characters with pagination, sorting, and search
func (s *MongoStore) List(page, limit int, sortBy, sortOrder, search string) ([]models.Character, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Build filter for search
	filter := bson.M{}
	if search != "" {
		// Case-insensitive regex search on characterName, race, and class
		regexPattern := bson.M{"$regex": search, "$options": "i"}
		filter = bson.M{
			"$or": []bson.M{
				{"characterName": regexPattern},
				{"race": regexPattern},
				{"class": regexPattern},
			},
		}
	}

	// Get total count with filter
	total, err := s.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Calculate skip
	skip := (page - 1) * limit

	// Build sort document
	sortDoc := bson.M{}
	switch sortBy {
	case "characterName":
		sortDoc["characterName"] = getSortValue(sortOrder)
	case "level":
		sortDoc["level"] = getSortValue(sortOrder)
	case "race":
		sortDoc["race"] = getSortValue(sortOrder)
	case "class":
		sortDoc["class"] = getSortValue(sortOrder)
	case "createdAt":
		sortDoc["createdAt"] = getSortValue(sortOrder)
	default:
		// Default sort by createdAt descending
		sortDoc["createdAt"] = -1
	}

	// Find documents with pagination and sorting
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(sortDoc)

	cursor, err := s.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var characters []models.Character
	if err = cursor.All(ctx, &characters); err != nil {
		return nil, 0, err
	}

	// Ensure we return an empty slice instead of nil when no results
	if characters == nil {
		characters = []models.Character{}
	}

	return characters, int(total), nil
}

// getSortValue converts sort order string to MongoDB sort value
func getSortValue(sortOrder string) int {
	if sortOrder == "desc" {
		return -1
	}
	return 1
}

// Update modifies an existing character
func (s *MongoStore) Update(id string, character *models.Character) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"id": id}

	// Preserve original ID and creation time, update timestamp
	character.ID = id
	character.UpdatedAt = time.Now()

	update := bson.M{"$set": character}

	result, err := s.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("character not found")
	}

	return nil
}

// Delete removes a character
func (s *MongoStore) Delete(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"id": id}

	result, err := s.collection.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("character not found")
	}

	return nil
}
