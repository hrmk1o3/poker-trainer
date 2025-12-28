"""
Pydantic models for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal
from enum import Enum


class ActionType(str, Enum):
    """Poker action types."""
    FOLD = "fold"
    CHECK = "check"
    CALL = "call"
    RAISE = "raise"
    BET = "bet"
    ALL_IN = "all_in"


class GamePhase(str, Enum):
    """Game phases in Texas Hold'em."""
    WAITING = "waiting"
    PREFLOP = "preflop"
    FLOP = "flop"
    TURN = "turn"
    RIVER = "river"
    SHOWDOWN = "showdown"
    FINISHED = "finished"


class CreateTableRequest(BaseModel):
    """Request to create a new poker table."""
    small_blind: int = Field(default=5, ge=1)
    big_blind: int = Field(default=10, ge=2)
    starting_stack: int = Field(default=1000, ge=100)


class PlayerAction(BaseModel):
    """Player action in the game."""
    player_id: str
    action_type: ActionType
    amount: Optional[int] = 0


class PlayerState(BaseModel):
    """State of a player at the table."""
    player_id: str
    name: str
    stack: int
    bet: int
    position: int
    is_active: bool
    is_dealer: bool
    is_small_blind: bool
    is_big_blind: bool
    hole_cards: Optional[List[str]] = None
    has_folded: bool = False
    is_all_in: bool = False


class GameStateResponse(BaseModel):
    """Complete game state response."""
    table_id: str
    phase: GamePhase
    players: List[PlayerState]
    community_cards: List[str]
    pot: int
    current_bet: int
    current_player_id: Optional[str]
    dealer_position: int
    small_blind: int
    big_blind: int
    winners: Optional[List[Dict]] = None


class HandHistoryEntry(BaseModel):
    """Hand history entry for database storage."""
    hand_id: str
    table_id: str
    timestamp: str
    players: List[str]
    community_cards: List[str]
    pot: int
    winner: str
    actions: List[Dict]
