package events

import (
	"time"
)

// ExecutionEvent represents a real-time execution event
type ExecutionEvent struct {
	Type      string                 `json:"type"` // "flow_started", "step_started", "step_completed", "flow_completed", "error"
	Timestamp time.Time              `json:"timestamp"`
	FlowRunID string                 `json:"flowRunId"`
	StepName  string                 `json:"stepName,omitempty"`
	Status    string                 `json:"status,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Error     string                 `json:"error,omitempty"`
	Duration  int64                  `json:"duration,omitempty"` // milliseconds
}

// EventBroadcaster is an interface for broadcasting execution events
type EventBroadcaster interface {
	BroadcastEvent(event ExecutionEvent)
}

// Global broadcaster instance
var globalBroadcaster EventBroadcaster

// SetGlobalBroadcaster sets the global event broadcaster
func SetGlobalBroadcaster(broadcaster EventBroadcaster) {
	globalBroadcaster = broadcaster
}

// BroadcastExecutionEvent broadcasts an execution event using the global broadcaster
func BroadcastExecutionEvent(event ExecutionEvent) {
	if globalBroadcaster != nil {
		globalBroadcaster.BroadcastEvent(event)
	}
}
