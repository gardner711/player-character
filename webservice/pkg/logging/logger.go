package logging

import (
	"context"
	"io"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gopkg.in/natefinch/lumberjack.v2"
)

// LogLevel represents the logging level
type LogLevel int

const (
	Debug LogLevel = iota
	Info
	Warn
	Error
	Fatal
)

// Config holds the logging configuration
type Config struct {
	Level      string `json:"level"`
	Format     string `json:"format"`      // "json" or "text"
	Output     string `json:"output"`      // "console", "file", or path to file
	MaxSize    int    `json:"max_size"`    // megabytes
	MaxAge     int    `json:"max_age"`     // days
	MaxBackups int    `json:"max_backups"` // number of backups
	Compress   bool   `json:"compress"`    // compress old log files
}

// Logger wraps slog.Logger with additional functionality
type Logger struct {
	*slog.Logger
	config Config
}

// NewLogger creates a new logger with the given configuration
func NewLogger(config Config) *Logger {
	var writer io.Writer
	var handler slog.Handler

	// Determine output destination
	switch config.Output {
	case "console":
		writer = os.Stdout
	case "file":
		if config.Output == "file" {
			config.Output = "app.log"
		}
		writer = &lumberjack.Logger{
			Filename:   config.Output,
			MaxSize:    config.MaxSize,
			MaxAge:     config.MaxAge,
			MaxBackups: config.MaxBackups,
			Compress:   config.Compress,
		}
	default:
		// Assume it's a file path
		writer = &lumberjack.Logger{
			Filename:   config.Output,
			MaxSize:    config.MaxSize,
			MaxAge:     config.MaxAge,
			MaxBackups: config.MaxBackups,
			Compress:   config.Compress,
		}
	}

	// Determine log level
	level := parseLogLevel(config.Level)

	// Create handler based on format
	opts := &slog.HandlerOptions{
		Level: level,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			// Add timestamp in RFC3339 format
			if a.Key == slog.TimeKey {
				return slog.Attr{
					Key:   "timestamp",
					Value: slog.StringValue(a.Value.Time().Format(time.RFC3339)),
				}
			}
			return a
		},
	}

	if config.Format == "json" {
		handler = slog.NewJSONHandler(writer, opts)
	} else {
		handler = slog.NewTextHandler(writer, opts)
	}

	logger := slog.New(handler)

	return &Logger{
		Logger: logger,
		config: config,
	}
}

// parseLogLevel converts string level to slog.Level
func parseLogLevel(level string) slog.Level {
	switch strings.ToUpper(level) {
	case "DEBUG":
		return slog.LevelDebug
	case "INFO":
		return slog.LevelInfo
	case "WARN", "WARNING":
		return slog.LevelWarn
	case "ERROR":
		return slog.LevelError
	case "FATAL":
		return slog.LevelError + 4 // Custom fatal level
	default:
		return slog.LevelInfo
	}
}

// RequestLogger logs HTTP requests
func (l *Logger) RequestLogger(method, path, clientIP string, statusCode int, duration time.Duration, userAgent string) {
	l.Info("HTTP Request",
		"method", method,
		"path", path,
		"client_ip", clientIP,
		"status_code", statusCode,
		"duration_ms", duration.Milliseconds(),
		"user_agent", userAgent,
	)
}

// Error logs errors with context
func (l *Logger) ErrorWithContext(ctx context.Context, msg string, err error, fields ...any) {
	args := []any{"error", err}
	args = append(args, fields...)
	l.Logger.ErrorContext(ctx, msg, args...)
}

// Fatal logs fatal errors and exits
func (l *Logger) Fatal(msg string, fields ...any) {
	l.Logger.Error(msg, fields...)
	os.Exit(1)
}

// WithContext returns a logger with context
func (l *Logger) WithContext(ctx context.Context) *Logger {
	return &Logger{
		Logger: l.Logger,
		config: l.config,
	}
}

// Middleware returns a Gin middleware for request logging
func (l *Logger) Middleware() gin.HandlerFunc {
	return gin.LoggerWithConfig(gin.LoggerConfig{
		Formatter: func(param gin.LogFormatterParams) string {
			l.RequestLogger(
				param.Method,
				param.Path,
				param.ClientIP,
				param.StatusCode,
				param.Latency,
				param.Request.UserAgent(),
			)
			return "" // Don't write to default logger
		},
		Output: io.Discard, // Disable default logging
	})
}
