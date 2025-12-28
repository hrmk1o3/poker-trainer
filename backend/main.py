"""
Main FastAPI application for 9-max No Limit Hold'em poker game.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Set
import json
import uuid
from datetime import datetime

from game.poker_game import PokerGame
from models.game_state import GameStateResponse, PlayerAction, CreateTableRequest

app = FastAPI(title="Poker Trainer API", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active games and WebSocket connections
active_games: Dict[str, PokerGame] = {}
active_connections: Dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    """Manage WebSocket connections for real-time game updates."""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, table_id: str):
        await websocket.accept()
        if table_id not in self.active_connections:
            self.active_connections[table_id] = []
        self.active_connections[table_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, table_id: str):
        if table_id in self.active_connections:
            self.active_connections[table_id].remove(websocket)
    
    async def broadcast(self, message: dict, table_id: str):
        """Broadcast message to all connected clients at a table."""
        if table_id in self.active_connections:
            for connection in self.active_connections[table_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass


manager = ConnectionManager()


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Poker Trainer API"}


@app.post("/api/tables/create")
async def create_table(request: CreateTableRequest):
    """Create a new 9-max poker table."""
    table_id = str(uuid.uuid4())
    
    game = PokerGame(
        table_id=table_id,
        max_players=9,
        small_blind=request.small_blind,
        big_blind=request.big_blind,
        starting_stack=request.starting_stack
    )
    
    active_games[table_id] = game
    
    return {
        "table_id": table_id,
        "status": "created",
        "config": {
            "max_players": 9,
            "small_blind": request.small_blind,
            "big_blind": request.big_blind,
            "starting_stack": request.starting_stack
        }
    }


@app.get("/api/tables/{table_id}/state")
async def get_table_state(table_id: str):
    """Get current state of a poker table."""
    if table_id not in active_games:
        raise HTTPException(status_code=404, detail="Table not found")
    
    game = active_games[table_id]
    return game.get_state()


@app.post("/api/tables/{table_id}/join")
async def join_table(table_id: str, player_name: str):
    """Join a poker table as a new player."""
    if table_id not in active_games:
        raise HTTPException(status_code=404, detail="Table not found")
    
    game = active_games[table_id]
    player_id = game.add_player(player_name)
    
    if player_id is None:
        raise HTTPException(status_code=400, detail="Table is full")
    
    # Broadcast updated state to all connected clients
    await manager.broadcast({
        "type": "player_joined",
        "player_name": player_name,
        "player_id": player_id,
        "state": game.get_state()
    }, table_id)
    
    return {"player_id": player_id, "table_id": table_id}


@app.post("/api/tables/{table_id}/action")
async def player_action(table_id: str, action: PlayerAction):
    """Process a player action (fold, call, raise, check)."""
    if table_id not in active_games:
        raise HTTPException(status_code=404, detail="Table not found")
    
    game = active_games[table_id]
    
    try:
        result = game.process_action(
            player_id=action.player_id,
            action_type=action.action_type,
            amount=action.amount
        )
        
        # Broadcast updated state to all connected clients
        await manager.broadcast({
            "type": "action_processed",
            "action": action.dict(),
            "state": game.get_state()
        }, table_id)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/tables/{table_id}/start")
async def start_game(table_id: str):
    """Start a new hand at the table."""
    if table_id not in active_games:
        raise HTTPException(status_code=404, detail="Table not found")
    
    game = active_games[table_id]
    
    try:
        game.start_new_hand()
        
        # Broadcast updated state to all connected clients
        await manager.broadcast({
            "type": "hand_started",
            "state": game.get_state()
        }, table_id)
        
        return {"status": "hand_started", "state": game.get_state()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.websocket("/ws/{table_id}")
async def websocket_endpoint(websocket: WebSocket, table_id: str):
    """WebSocket endpoint for real-time game updates."""
    await manager.connect(websocket, table_id)
    
    try:
        # Send initial state
        if table_id in active_games:
            game = active_games[table_id]
            await websocket.send_json({
                "type": "connected",
                "table_id": table_id,
                "state": game.get_state()
            })
        
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            elif message.get("type") == "action":
                # Process action and broadcast to all
                if table_id in active_games:
                    game = active_games[table_id]
                    try:
                        result = game.process_action(
                            player_id=message["player_id"],
                            action_type=message["action_type"],
                            amount=message.get("amount", 0)
                        )
                        await manager.broadcast({
                            "type": "action_processed",
                            "action": message,
                            "state": game.get_state()
                        }, table_id)
                    except Exception as e:
                        await websocket.send_json({
                            "type": "error",
                            "message": str(e)
                        })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, table_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, table_id)


@app.delete("/api/tables/{table_id}")
async def delete_table(table_id: str):
    """Delete a poker table."""
    if table_id not in active_games:
        raise HTTPException(status_code=404, detail="Table not found")
    
    del active_games[table_id]
    
    # Disconnect all WebSocket connections
    if table_id in manager.active_connections:
        for connection in manager.active_connections[table_id]:
            await connection.close()
        del manager.active_connections[table_id]
    
    return {"status": "deleted", "table_id": table_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
