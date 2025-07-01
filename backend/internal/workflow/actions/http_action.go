package actions

import (
	"backend/internal/workflow/interfaces"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// HTTPAction implements HTTP request action
type HTTPAction struct {
	client *http.Client
}

// NewHTTPAction creates a new HTTP action
func NewHTTPAction() interfaces.Action {
	return &HTTPAction{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetType returns the action type
func (a *HTTPAction) GetType() string {
	return "http"
}

// Execute performs an HTTP request
func (a *HTTPAction) Execute(ctx context.Context, config map[string]interface{}, input map[string]interface{}) (map[string]interface{}, error) {
	// Parse configuration
	url, ok := config["url"].(string)
	if !ok {
		return nil, fmt.Errorf("url is required for HTTP action")
	}

	method, ok := config["method"].(string)
	if !ok {
		method = "GET" // Default method
	}
	method = strings.ToUpper(method)

	// Parse headers
	headers := make(map[string]string)
	if headersConfig, ok := config["headers"].(map[string]interface{}); ok {
		for k, v := range headersConfig {
			if strVal, ok := v.(string); ok {
				headers[k] = strVal
			}
		}
	}

	// Parse timeout
	timeout := 30 * time.Second // Default timeout
	if timeoutConfig, ok := config["timeout"].(float64); ok {
		timeout = time.Duration(timeoutConfig) * time.Second
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: timeout,
	}

	// Prepare request body
	var requestBody io.Reader
	var contentType string

	if body, ok := config["body"]; ok {
		switch bodyType := body.(type) {
		case string:
			requestBody = strings.NewReader(bodyType)
			if headers["Content-Type"] == "" {
				contentType = "text/plain"
			}
		case map[string]interface{}:
			jsonBody, err := json.Marshal(bodyType)
			if err != nil {
				return nil, fmt.Errorf("failed to marshal JSON body: %w", err)
			}
			requestBody = bytes.NewReader(jsonBody)
			if headers["Content-Type"] == "" {
				contentType = "application/json"
			}
		default:
			return nil, fmt.Errorf("unsupported body type: %T", bodyType)
		}
	}

	// Handle template substitution in URL and body
	url = a.substituteVariables(url, input)

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, method, url, requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Set headers
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	for k, v := range headers {
		req.Header.Set(k, a.substituteVariables(v, input))
	}

	// Execute request
	startTime := time.Now()
	resp, err := client.Do(req)
	duration := time.Since(startTime)

	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Parse response based on Content-Type
	var responseData interface{}
	contentType = resp.Header.Get("Content-Type")

	if strings.Contains(contentType, "application/json") {
		var jsonData map[string]interface{}
		if err := json.Unmarshal(responseBody, &jsonData); err != nil {
			// If JSON parsing fails, return as string
			responseData = string(responseBody)
		} else {
			responseData = jsonData
		}
	} else {
		responseData = string(responseBody)
	}

	// Prepare output
	output := map[string]interface{}{
		"status_code": resp.StatusCode,
		"status_text": resp.Status,
		"headers":     resp.Header,
		"body":        responseData,
		"duration_ms": duration.Milliseconds(),
		"success":     resp.StatusCode >= 200 && resp.StatusCode < 300,
	}

	// Check if request was successful
	if resp.StatusCode >= 400 {
		return output, fmt.Errorf("HTTP request failed with status %d: %s", resp.StatusCode, resp.Status)
	}

	return output, nil
}

// Validate checks the action configuration
func (a *HTTPAction) Validate(config map[string]interface{}) error {
	if _, ok := config["url"]; !ok {
		return fmt.Errorf("url is required for HTTP action")
	}

	if method, ok := config["method"]; ok {
		if _, ok := method.(string); !ok {
			return fmt.Errorf("method must be a string")
		}

		validMethods := []string{"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}
		methodStr := strings.ToUpper(method.(string))
		valid := false
		for _, m := range validMethods {
			if m == methodStr {
				valid = true
				break
			}
		}
		if !valid {
			return fmt.Errorf("invalid HTTP method: %s", method)
		}
	}

	if timeout, ok := config["timeout"]; ok {
		if _, ok := timeout.(float64); !ok {
			return fmt.Errorf("timeout must be a number")
		}
	}

	if headers, ok := config["headers"]; ok {
		if _, ok := headers.(map[string]interface{}); !ok {
			return fmt.Errorf("headers must be an object")
		}
	}

	return nil
}

// substituteVariables replaces template variables in strings
func (a *HTTPAction) substituteVariables(template string, variables map[string]interface{}) string {
	result := template
	for key, value := range variables {
		placeholder := fmt.Sprintf("{{%s}}", key)
		replacement := fmt.Sprintf("%v", value)
		result = strings.ReplaceAll(result, placeholder, replacement)
	}
	return result
}
