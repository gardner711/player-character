package main

import (
	"context"
	"log"
	"os"

	_ "player-character/docs"
	"player-character/internal/api"
	"player-character/pkg/database"
	"player-character/pkg/logging"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title Player Character API
// @version 1.0
// @description A RESTful API for managing D&D 5e player characters
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8765
// @BasePath /

// @externalDocs.description OpenAPI
// @externalDocs.url https://swagger.io/resources/open-api/
func main() {
	// Get port from environment variable, default to 8765
	port := os.Getenv("PORT")
	if port == "" {
		port = "8765"
	}

	// Get log level from environment variable, default to info
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}

	// Get log format from environment variable, default to json
	logFormat := os.Getenv("LOG_FORMAT")
	if logFormat == "" {
		logFormat = "json"
	}

	// Get MongoDB connection details from environment variables
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	mongoDatabase := os.Getenv("MONGODB_DATABASE")
	if mongoDatabase == "" {
		mongoDatabase = "playercharacter"
	}

	mongoCollection := os.Getenv("MONGODB_COLLECTION")
	if mongoCollection == "" {
		mongoCollection = "playercharacters"
	}

	// Initialize logger
	loggerConfig := logging.Config{
		Level:      logLevel,
		Format:     logFormat,
		Output:     "console",
		MaxSize:    100,
		MaxAge:     30,
		MaxBackups: 5,
		Compress:   true,
	}
	logger := logging.NewLogger(loggerConfig)

	// Initialize database
	store, err := database.NewMongoStore(mongoURI, mongoDatabase, mongoCollection)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer store.Disconnect(context.Background())

	// Initialize handlers
	characterHandler := api.NewCharacterHandler(store, logger)

	// Initialize Gin router
	r := gin.New() // Use gin.New() instead of gin.Default() to avoid default logging

	// Add custom logging middleware
	r.Use(logger.Middleware())

	// CORS middleware
	r.Use(cors.Default())

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// API v1 routes
	v1 := r.Group("/api")
	{
		characters := v1.Group("/characters")
		{
			characters.POST("", characterHandler.CreateCharacter)
			characters.GET("", characterHandler.ListCharacters)
			characters.GET("/:id", characterHandler.GetCharacter)
			characters.PUT("/:id", characterHandler.UpdateCharacter)
			characters.DELETE("/:id", characterHandler.DeleteCharacter)
		}
	}

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	log.Printf("Server starting on :%s", port)
	log.Printf("Swagger documentation available at: http://localhost:%s/swagger/index.html", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
