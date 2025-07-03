package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"backend/internal/events"

	"github.com/coder/websocket"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
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

// WebSocketConnection represents a WebSocket connection
type WebSocketConnection struct {
	conn       *websocket.Conn
	flowRunID  string
	projectID  string
	userID     string
	lastPing   time.Time
	closed     bool
	closeMutex sync.Mutex
}

// WebSocketHub manages WebSocket connections and implements EventBroadcaster
type WebSocketHub struct {
	connections   map[string][]*WebSocketConnection  // flowRunID -> connections
	eventBuffer   map[string][]events.ExecutionEvent // flowRunID -> recent events
	mutex         sync.RWMutex
	broadcast     chan events.ExecutionEvent
	register      chan *WebSocketConnection
	unregister    chan *WebSocketConnection
	maxBufferSize int
}

var (
	wsHub     *WebSocketHub
	hubOnce   sync.Once
	eventChan = make(chan events.ExecutionEvent, 1000) // Buffer for execution events
)

// GetWebSocketHub returns the singleton WebSocket hub
func GetWebSocketHub() *WebSocketHub {
	hubOnce.Do(func() {
		wsHub = &WebSocketHub{
			connections:   make(map[string][]*WebSocketConnection),
			eventBuffer:   make(map[string][]events.ExecutionEvent),
			broadcast:     make(chan events.ExecutionEvent, 1000),
			register:      make(chan *WebSocketConnection),
			unregister:    make(chan *WebSocketConnection),
			maxBufferSize: 1000, // Default maxBufferSize
		}
		go wsHub.run()

		// Set this hub as the global event broadcaster
		events.SetGlobalBroadcaster(wsHub)
	})
	return wsHub
}

// BroadcastEvent implements the EventBroadcaster interface
func (h *WebSocketHub) BroadcastEvent(event events.ExecutionEvent) {
	log.Debug().
		Str("event_type", event.Type).
		Str("flow_run_id", event.FlowRunID).
		Msg("WebSocket hub received event for broadcasting")

	select {
	case h.broadcast <- event:
		log.Debug().
			Str("event_type", event.Type).
			Str("flow_run_id", event.FlowRunID).
			Msg("Event queued for WebSocket broadcast")
	default:
		log.Warn().Msg("WebSocket broadcast channel is full, dropping event")
	}
}

// BroadcastExecutionEvent broadcasts an execution event to all relevant connections
func BroadcastExecutionEvent(event events.ExecutionEvent) {
	select {
	case eventChan <- event:
	default:
		log.Warn().Msg("Execution event channel is full, dropping event")
	}
}

// run manages the WebSocket hub
func (h *WebSocketHub) run() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case conn := <-h.register:
			h.mutex.Lock()
			if _, exists := h.connections[conn.flowRunID]; !exists {
				h.connections[conn.flowRunID] = make([]*WebSocketConnection, 0)
			}
			h.connections[conn.flowRunID] = append(h.connections[conn.flowRunID], conn)

			// Send buffered events to the new connection
			if bufferedEvents, exists := h.eventBuffer[conn.flowRunID]; exists {
				log.Debug().
					Str("flowRunId", conn.flowRunID).
					Int("buffered_events", len(bufferedEvents)).
					Msg("Sending buffered events to new WebSocket connection")

				for _, event := range bufferedEvents {
					if eventData, err := json.Marshal(event); err == nil {
						conn.send(eventData)
					}
				}
			}
			h.mutex.Unlock()

			log.Info().
				Str("flowRunId", conn.flowRunID).
				Str("userId", conn.userID).
				Msg("WebSocket connection registered")

		case conn := <-h.unregister:
			h.removeConnection(conn)

		case event := <-eventChan:
			h.broadcastToFlowRun(event.FlowRunID, event)

		case event := <-h.broadcast:
			h.broadcastToFlowRun(event.FlowRunID, event)

		case <-ticker.C:
			h.cleanupStaleConnections()
		}
	}
}

// removeConnection removes a connection from the hub
func (h *WebSocketHub) removeConnection(conn *WebSocketConnection) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if connections, exists := h.connections[conn.flowRunID]; exists {
		for i, c := range connections {
			if c == conn {
				h.connections[conn.flowRunID] = append(connections[:i], connections[i+1:]...)
				break
			}
		}
		if len(h.connections[conn.flowRunID]) == 0 {
			delete(h.connections, conn.flowRunID)
			// Clean up event buffer when no connections remain
			delete(h.eventBuffer, conn.flowRunID)
		}
	}

	conn.close()
	log.Info().
		Str("flowRunId", conn.flowRunID).
		Str("userId", conn.userID).
		Msg("WebSocket connection unregistered")
}

// broadcastToFlowRun broadcasts an event to all connections for a specific flow run
func (h *WebSocketHub) broadcastToFlowRun(flowRunID string, event events.ExecutionEvent) {
	h.mutex.Lock()

	// Buffer the event for future connections
	if _, exists := h.eventBuffer[flowRunID]; !exists {
		h.eventBuffer[flowRunID] = make([]events.ExecutionEvent, 0)
	}
	h.eventBuffer[flowRunID] = append(h.eventBuffer[flowRunID], event)

	// Limit buffer size to prevent memory leaks
	if len(h.eventBuffer[flowRunID]) > h.maxBufferSize {
		h.eventBuffer[flowRunID] = h.eventBuffer[flowRunID][1:] // Remove oldest event
	}

	connections := h.connections[flowRunID]
	h.mutex.Unlock()

	if len(connections) == 0 {
		log.Debug().
			Str("flow_run_id", flowRunID).
			Msg("No WebSocket connections found for flow run, event buffered")
		return
	}

	log.Debug().
		Str("flow_run_id", flowRunID).
		Int("connection_count", len(connections)).
		Str("event_type", event.Type).
		Msg("Broadcasting event to WebSocket connections")

	eventData, err := json.Marshal(event)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal execution event")
		return
	}

	for i, conn := range connections {
		if err := conn.send(eventData); err != nil {
			log.Error().
				Err(err).
				Str("flowRunId", conn.flowRunID).
				Int("connection_index", i).
				Msg("Failed to send event to WebSocket connection")
			h.unregister <- conn
		} else {
			log.Debug().
				Str("flow_run_id", flowRunID).
				Int("connection_index", i).
				Msg("Event sent successfully to WebSocket connection")
		}
	}
}

// cleanupStaleConnections removes connections that haven't pinged recently
func (h *WebSocketHub) cleanupStaleConnections() {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	now := time.Now()
	for flowRunID, connections := range h.connections {
		var activeConnections []*WebSocketConnection
		for _, conn := range connections {
			if now.Sub(conn.lastPing) > 60*time.Second {
				conn.close()
				log.Info().
					Str("flowRunId", conn.flowRunID).
					Msg("Cleaning up stale WebSocket connection")
			} else {
				activeConnections = append(activeConnections, conn)
			}
		}
		if len(activeConnections) == 0 {
			delete(h.connections, flowRunID)
		} else {
			h.connections[flowRunID] = activeConnections
		}
	}
}

// send sends data to the WebSocket connection
func (c *WebSocketConnection) send(data []byte) error {
	c.closeMutex.Lock()
	defer c.closeMutex.Unlock()

	if c.closed {
		return fmt.Errorf("connection is closed")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return c.conn.Write(ctx, websocket.MessageText, data)
}

// close closes the WebSocket connection
func (c *WebSocketConnection) close() {
	c.closeMutex.Lock()
	defer c.closeMutex.Unlock()

	if !c.closed {
		c.closed = true
		c.conn.Close(websocket.StatusNormalClosure, "Connection closed")
	}
}

// handleWebSocket handles WebSocket connections for execution updates
func (c *WebSocketConnection) handleWebSocket(ctx context.Context) {
	defer func() {
		GetWebSocketHub().unregister <- c
	}()

	c.lastPing = time.Now()

	// Send initial connection confirmation
	confirmEvent := events.ExecutionEvent{
		Type:      "connection_established",
		Timestamp: time.Now(),
		FlowRunID: c.flowRunID,
	}
	if data, err := json.Marshal(confirmEvent); err == nil {
		c.send(data)
	}

	// Handle incoming messages (mainly pings)
	for {
		_, message, err := c.conn.Read(ctx)
		if err != nil {
			log.Error().
				Err(err).
				Str("flowRunId", c.flowRunID).
				Msg("WebSocket read error")
			break
		}

		// Handle ping messages
		if string(message) == "ping" {
			c.lastPing = time.Now()
			pongData := []byte(`{"type":"pong","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`)
			if err := c.send(pongData); err != nil {
				log.Error().Err(err).Msg("Failed to send pong")
				break
			}
		}
	}
}

// WebSocketHandler creates a WebSocket handler
type WebSocketHandler struct{}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler() *WebSocketHandler {
	return &WebSocketHandler{}
}

// HandleExecutionWebSocket handles WebSocket connections for execution updates
func (h *WebSocketHandler) HandleExecutionWebSocket(w http.ResponseWriter, r *http.Request) {
	// Extract flow run ID from URL
	flowRunID := r.URL.Query().Get("flowRunId")
	if flowRunID == "" {
		http.Error(w, "flowRunId parameter is required", http.StatusBadRequest)
		return
	}

	// Validate flow run ID format
	if _, err := uuid.Parse(flowRunID); err != nil {
		http.Error(w, "Invalid flowRunId format", http.StatusBadRequest)
		return
	}

	// Extract user info from context (set by auth middleware) or token query param
	userID := "anonymous" // Default fallback
	if userCtx := r.Context().Value("user"); userCtx != nil {
		if user, ok := userCtx.(map[string]interface{}); ok {
			if id, exists := user["id"]; exists {
				userID = fmt.Sprintf("%v", id)
			}
		}
	}

	// Also try to get user from JWT claims if available
	if userID == "anonymous" {
		if claims := r.Context().Value("claims"); claims != nil {
			if claimsMap, ok := claims.(map[string]interface{}); ok {
				if id, exists := claimsMap["user_id"]; exists {
					userID = fmt.Sprintf("%v", id)
				} else if sub, exists := claimsMap["sub"]; exists {
					userID = fmt.Sprintf("%v", sub)
				}
			}
		}
	}

	// If still anonymous, try to extract from token query parameter
	if userID == "anonymous" {
		if token := r.URL.Query().Get("token"); token != "" {
			// Here you would validate the token and extract user info
			// For now, we'll just use a placeholder
			userID = "token_user"
		}
	}

	projectID := r.URL.Query().Get("projectId")

	log.Info().
		Str("flow_run_id", flowRunID).
		Str("user_id", userID).
		Str("project_id", projectID).
		Msg("WebSocket connection request received")

	// Accept WebSocket connection
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"*"}, // Allow all origins for development
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to accept WebSocket connection")
		return
	}

	// Create connection wrapper
	wsConn := &WebSocketConnection{
		conn:      conn,
		flowRunID: flowRunID,
		projectID: projectID,
		userID:    userID,
		lastPing:  time.Now(),
		closed:    false,
	}

	// Register connection
	GetWebSocketHub().register <- wsConn

	// Handle the connection
	wsConn.handleWebSocket(r.Context())
}
