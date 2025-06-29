package logger

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// LogLevel represents the logging level
type LogLevel string

const (
	LevelDebug LogLevel = "debug"
	LevelInfo  LogLevel = "info"
	LevelWarn  LogLevel = "warn"
	LevelError LogLevel = "error"
	LevelFatal LogLevel = "fatal"
)

// Logger wraps zerolog.Logger with additional functionality
type Logger struct {
	logger zerolog.Logger
}

// Config holds logger configuration
type Config struct {
	Level      LogLevel `json:"level"`
	Format     string   `json:"format"` // "json" or "console"
	TimeFormat string   `json:"time_format"`
}

// DefaultConfig returns default logger configuration
func DefaultConfig() *Config {
	return &Config{
		Level:      LevelInfo,
		Format:     "console",
		TimeFormat: time.RFC3339,
	}
}

// New creates a new logger instance
func New(config *Config) *Logger {
	if config == nil {
		config = DefaultConfig()
	}

	// Set global log level
	level := parseLogLevel(config.Level)
	zerolog.SetGlobalLevel(level)

	// Configure time format
	zerolog.TimeFieldFormat = config.TimeFormat

	var logger zerolog.Logger

	if config.Format == "json" {
		logger = zerolog.New(os.Stdout).With().Timestamp().Logger()
	} else {
		// Modern console format with better readability
		output := zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: "15:04:05",
			NoColor:    false, // Enable colors for better visibility
			FormatLevel: func(i interface{}) string {
				level := strings.ToUpper(fmt.Sprintf("%s", i))
				switch level {
				case "DEBUG":
					return "\033[36mDEBUG\033[0m" // Cyan
				case "INFO":
					return "\033[32mINFO \033[0m" // Green
				case "WARN":
					return "\033[33mWARN \033[0m" // Yellow
				case "ERROR":
					return "\033[31mERROR\033[0m" // Red
				case "FATAL":
					return "\033[35mFATAL\033[0m" // Magenta
				default:
					return fmt.Sprintf("%-5s", level)
				}
			},
			FormatMessage: func(i interface{}) string {
				return fmt.Sprintf("%s", i)
			},
			FormatFieldName: func(i interface{}) string {
				return fmt.Sprintf("\033[36m%s\033[0m=", i) // Cyan field names
			},
			FormatFieldValue: func(i interface{}) string {
				return fmt.Sprintf("\033[37m%s\033[0m", i) // White field values
			},
		}
		logger = zerolog.New(output).With().Timestamp().Logger()
	}

	return &Logger{logger: logger}
}

// parseLogLevel converts string level to zerolog level
func parseLogLevel(level LogLevel) zerolog.Level {
	switch level {
	case LevelDebug:
		return zerolog.DebugLevel
	case LevelInfo:
		return zerolog.InfoLevel
	case LevelWarn:
		return zerolog.WarnLevel
	case LevelError:
		return zerolog.ErrorLevel
	case LevelFatal:
		return zerolog.FatalLevel
	default:
		return zerolog.InfoLevel
	}
}

// WithContext adds context to logger
func (l *Logger) WithContext(ctx context.Context) *Logger {
	return &Logger{logger: l.logger.With().Ctx(ctx).Logger()}
}

// WithField adds a field to logger
func (l *Logger) WithField(key string, value interface{}) *Logger {
	return &Logger{logger: l.logger.With().Interface(key, value).Logger()}
}

// WithFields adds multiple fields to logger
func (l *Logger) WithFields(fields map[string]interface{}) *Logger {
	logger := l.logger.With()
	for k, v := range fields {
		logger = logger.Interface(k, v)
	}
	return &Logger{logger: logger.Logger()}
}

// WithError adds error to logger
func (l *Logger) WithError(err error) *Logger {
	return &Logger{logger: l.logger.With().Err(err).Logger()}
}

// Debug logs a debug message
func (l *Logger) Debug(msg string) {
	l.logger.Debug().Msg(msg)
}

// Debugf logs a formatted debug message
func (l *Logger) Debugf(format string, args ...interface{}) {
	l.logger.Debug().Msgf(format, args...)
}

// Info logs an info message
func (l *Logger) Info(msg string) {
	l.logger.Info().Msg(msg)
}

// Infof logs a formatted info message
func (l *Logger) Infof(format string, args ...interface{}) {
	l.logger.Info().Msgf(format, args...)
}

// Warn logs a warning message
func (l *Logger) Warn(msg string) {
	l.logger.Warn().Msg(msg)
}

// Warnf logs a formatted warning message
func (l *Logger) Warnf(format string, args ...interface{}) {
	l.logger.Warn().Msgf(format, args...)
}

// Error logs an error message
func (l *Logger) Error(msg string) {
	l.logger.Error().Msg(msg)
}

// Errorf logs a formatted error message
func (l *Logger) Errorf(format string, args ...interface{}) {
	l.logger.Error().Msgf(format, args...)
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(msg string) {
	l.logger.Fatal().Msg(msg)
}

// Fatalf logs a formatted fatal message and exits
func (l *Logger) Fatalf(format string, args ...interface{}) {
	l.logger.Fatal().Msgf(format, args...)
}

// HTTP request logging with cleaner format
func (l *Logger) LogHTTPRequest(method, path, userAgent, clientIP string, statusCode int, duration time.Duration) {
	event := l.logger.Info()
	if statusCode >= 400 {
		event = l.logger.Error()
	}

	// Create a more readable message
	msg := fmt.Sprintf("%s %s → %d", method, path, statusCode)

	event.
		Str("method", method).
		Str("path", path).
		Int("status", statusCode).
		Str("duration", fmt.Sprintf("%.2fms", float64(duration.Nanoseconds())/1e6)).
		Str("ip", clientIP).
		Str("user_agent", truncateUserAgent(userAgent)).
		Msg(msg)
}

// Database operation logging
func (l *Logger) LogDBOperation(operation, table string, duration time.Duration, err error) {
	event := l.logger.Info()
	if err != nil {
		event = l.logger.Error().Err(err)
	}

	msg := fmt.Sprintf("DB %s on %s", operation, table)

	event.
		Str("operation", operation).
		Str("table", table).
		Str("duration", fmt.Sprintf("%.2fms", float64(duration.Nanoseconds())/1e6)).
		Msg(msg)
}

// Service operation logging
func (l *Logger) LogServiceOperation(service, operation string, duration time.Duration, err error) {
	event := l.logger.Info()
	if err != nil {
		event = l.logger.Error().Err(err)
	}

	msg := fmt.Sprintf("%s.%s", service, operation)

	event.
		Str("service", service).
		Str("operation", operation).
		Str("duration", fmt.Sprintf("%.2fms", float64(duration.Nanoseconds())/1e6)).
		Msg(msg)
}

// Helper function to truncate user agent for cleaner logs
func truncateUserAgent(userAgent string) string {
	if len(userAgent) > 60 {
		return userAgent[:57] + "..."
	}
	return userAgent
}

// Global logger instance
var globalLogger *Logger

// Initialize sets up the global logger
func Initialize(config *Config) {
	globalLogger = New(config)
	log.Logger = globalLogger.logger
}

// Get returns the global logger instance
func Get() *Logger {
	if globalLogger == nil {
		Initialize(DefaultConfig())
	}
	return globalLogger
}

// Global convenience functions
func Debug(msg string) {
	Get().Debug(msg)
}

func Debugf(format string, args ...interface{}) {
	Get().Debugf(format, args...)
}

func Info(msg string) {
	Get().Info(msg)
}

func Infof(format string, args ...interface{}) {
	Get().Infof(format, args...)
}

func Warn(msg string) {
	Get().Warn(msg)
}

func Warnf(format string, args ...interface{}) {
	Get().Warnf(format, args...)
}

func Error(msg string) {
	Get().Error(msg)
}

func Errorf(format string, args ...interface{}) {
	Get().Errorf(format, args...)
}

func Fatal(msg string) {
	Get().Fatal(msg)
}

func Fatalf(format string, args ...interface{}) {
	Get().Fatalf(format, args...)
}

func WithField(key string, value interface{}) *Logger {
	return Get().WithField(key, value)
}

func WithFields(fields map[string]interface{}) *Logger {
	return Get().WithFields(fields)
}

func WithError(err error) *Logger {
	return Get().WithError(err)
}
