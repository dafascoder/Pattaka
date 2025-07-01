package actions

import (
	"backend/internal/workflow/interfaces"
	"context"
	"fmt"
	"log"
	"strings"
	"time"
)

// LogAction implements logging action for debugging workflows
type LogAction struct{}

// NewLogAction creates a new log action
func NewLogAction() interfaces.Action {
	return &LogAction{}
}

// GetType returns the action type
func (a *LogAction) GetType() string {
	return "log"
}

// Execute logs a message
func (a *LogAction) Execute(ctx context.Context, config map[string]interface{}, input map[string]interface{}) (map[string]interface{}, error) {
	// Parse configuration
	message, ok := config["message"].(string)
	if !ok {
		message = "Log action executed"
	}

	level, ok := config["level"].(string)
	if !ok {
		level = "info"
	}
	level = strings.ToLower(level)

	// Substitute variables in message
	processedMessage := a.substituteVariables(message, input)

	// Add timestamp and workflow context
	timestamp := time.Now().Format(time.RFC3339)
	logMessage := fmt.Sprintf("[%s] %s", timestamp, processedMessage)

	// Log based on level
	switch level {
	case "debug":
		log.Printf("DEBUG: %s", logMessage)
	case "info":
		log.Printf("INFO: %s", logMessage)
	case "warn", "warning":
		log.Printf("WARN: %s", logMessage)
	case "error":
		log.Printf("ERROR: %s", logMessage)
	default:
		log.Printf("LOG: %s", logMessage)
	}

	// Prepare output
	output := map[string]interface{}{
		"logged_message": processedMessage,
		"log_level":      level,
		"timestamp":      timestamp,
		"success":        true,
	}

	// Include input variables in output for debugging
	if includeInput, ok := config["include_input"].(bool); ok && includeInput {
		output["input_variables"] = input
	}

	return output, nil
}

// Validate checks the action configuration
func (a *LogAction) Validate(config map[string]interface{}) error {
	if level, ok := config["level"]; ok {
		if _, ok := level.(string); !ok {
			return fmt.Errorf("level must be a string")
		}

		validLevels := []string{"debug", "info", "warn", "warning", "error"}
		levelStr := strings.ToLower(level.(string))
		valid := false
		for _, l := range validLevels {
			if l == levelStr {
				valid = true
				break
			}
		}
		if !valid {
			return fmt.Errorf("invalid log level: %s", level)
		}
	}

	if includeInput, ok := config["include_input"]; ok {
		if _, ok := includeInput.(bool); !ok {
			return fmt.Errorf("include_input must be a boolean")
		}
	}

	return nil
}

// substituteVariables replaces template variables in strings
func (a *LogAction) substituteVariables(template string, variables map[string]interface{}) string {
	result := template
	for key, value := range variables {
		placeholder := fmt.Sprintf("{{%s}}", key)
		replacement := fmt.Sprintf("%v", value)
		result = strings.ReplaceAll(result, placeholder, replacement)
	}
	return result
}
