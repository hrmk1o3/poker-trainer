# API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Currently no authentication is required. This is a development/training application.

## Endpoints

### Health Check

#### GET /
Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Poker Trainer API"
}
```

---

### Create Table

#### POST /api/tables/create
Create a new 9-max poker table.

**Request Body:**
```json
{
  "small_blind": 5,
  "big_blind": 10,
  "starting_stack": 1000
}
```

**Response:**
```json
{
  "table_id": "uuid-string",
  "status": "created",
  "config": {
    "max_players": 9,
    "small_blind": 5,
    "big_blind": 10,
    "starting_stack": 1000
  }
}
```

---

### Get Table State

#### GET /api/tables/{table_id}/state
Get the current state of a poker table.

**Response:**
```json
{
  "table_id": "uuid-string",
  "phase": "waiting|preflop|flop|turn|river|showdown|finished",
  "players": [
    {
      "player_id": "uuid-string",
      "name": "Player1",
      "stack": 1000,
      "bet": 0,
      "position": 0,
      "is_active": true,
      "is_dealer": false,
      "is_small_blind": false,
      "is_big_blind": false,
      "hole_cards": null,
      "has_folded": false,
      "is_all_in": false
    }
  ],
  "community_cards": ["As", "Kh", "Qd"],
  "pot": 150,
  "current_bet": 50,
  "current_player_id": "uuid-string",
  "dealer_position": 0,
  "small_blind": 5,
  "big_blind": 10,
  "winners": null
}
```

---

### Join Table

#### POST /api/tables/{table_id}/join?player_name={name}
Join a poker table as a new player.

**Query Parameters:**
- `player_name`: Name of the player (string)

**Response:**
```json
{
  "player_id": "uuid-string",
  "table_id": "uuid-string"
}
```

---

### Player Action

#### POST /api/tables/{table_id}/action
Process a player action.

**Request Body:**
```json
{
  "player_id": "uuid-string",
  "action_type": "fold|check|call|raise|bet|all_in",
  "amount": 50
}
```

**Response:**
```json
{
  "status": "success",
  "state": {
    // Full game state object
  }
}
```

---

### Start Hand

#### POST /api/tables/{table_id}/start
Start a new hand at the table.

**Response:**
```json
{
  "status": "hand_started",
  "state": {
    // Full game state object
  }
}
```

---

### Delete Table

#### DELETE /api/tables/{table_id}
Delete a poker table and disconnect all players.

**Response:**
```json
{
  "status": "deleted",
  "table_id": "uuid-string"
}
```

---

## WebSocket

### Connect to Table

#### WS /ws/{table_id}
Connect to a table for real-time updates.

**Connection URL:**
```
ws://localhost:8000/ws/{table_id}
```

**Message Types:**

#### Received from Server

1. **Connected**
```json
{
  "type": "connected",
  "table_id": "uuid-string",
  "state": {
    // Full game state object
  }
}
```

2. **Player Joined**
```json
{
  "type": "player_joined",
  "player_name": "Player1",
  "player_id": "uuid-string",
  "state": {
    // Full game state object
  }
}
```

3. **Action Processed**
```json
{
  "type": "action_processed",
  "action": {
    "player_id": "uuid-string",
    "action_type": "raise",
    "amount": 50
  },
  "state": {
    // Full game state object
  }
}
```

4. **Hand Started**
```json
{
  "type": "hand_started",
  "state": {
    // Full game state object
  }
}
```

5. **Error**
```json
{
  "type": "error",
  "message": "Error description"
}
```

6. **Pong** (response to ping)
```json
{
  "type": "pong"
}
```

#### Sent to Server

1. **Ping**
```json
{
  "type": "ping"
}
```

2. **Action**
```json
{
  "type": "action",
  "player_id": "uuid-string",
  "action_type": "raise",
  "amount": 50
}
```

---

## Game Flow

1. **Create a table** using POST /api/tables/create
2. **Join the table** using POST /api/tables/{table_id}/join
3. **Connect via WebSocket** to ws://localhost:8000/ws/{table_id}
4. **Start a hand** using POST /api/tables/{table_id}/start
5. **Play actions** via WebSocket or REST API
6. **Receive real-time updates** via WebSocket

---

## Error Responses

All endpoints return standard HTTP error codes:

- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Table or resource not found
- `500 Internal Server Error`: Server error

Example error response:
```json
{
  "detail": "Error description"
}
```

---

## Interactive Documentation

Visit http://localhost:8000/docs for interactive Swagger UI documentation with the ability to test all endpoints.

Alternative documentation: http://localhost:8000/redoc
