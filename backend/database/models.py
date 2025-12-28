"""
Database models for PostgreSQL using SQLAlchemy.
Optional feature for hand history storage.
"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, Float, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class Table(Base):
    """Poker table record."""
    __tablename__ = "tables"
    
    id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    max_players = Column(Integer, default=9)
    small_blind = Column(Integer)
    big_blind = Column(Integer)
    starting_stack = Column(Integer)
    
    hands = relationship("Hand", back_populates="table")


class Hand(Base):
    """Hand history record."""
    __tablename__ = "hands"
    
    id = Column(String, primary_key=True)
    table_id = Column(String, ForeignKey("tables.id"))
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    dealer_position = Column(Integer)
    small_blind = Column(Integer)
    big_blind = Column(Integer)
    community_cards = Column(JSON)  # ["As", "Kh", "Qd", "Jc", "Ts"]
    pot = Column(Integer)
    
    table = relationship("Table", back_populates="hands")
    actions = relationship("Action", back_populates="hand")
    results = relationship("HandResult", back_populates="hand")


class Action(Base):
    """Player action in a hand."""
    __tablename__ = "actions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    hand_id = Column(String, ForeignKey("hands.id"))
    player_id = Column(String)
    player_name = Column(String)
    phase = Column(String)  # preflop, flop, turn, river
    action_type = Column(String)  # fold, check, call, raise, bet
    amount = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    hand = relationship("Hand", back_populates="actions")


class HandResult(Base):
    """Result of a hand for each player."""
    __tablename__ = "hand_results"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    hand_id = Column(String, ForeignKey("hands.id"))
    player_id = Column(String)
    player_name = Column(String)
    starting_stack = Column(Integer)
    ending_stack = Column(Integer)
    profit = Column(Integer)
    hole_cards = Column(JSON)  # ["As", "Kh"]
    won = Column(Boolean, default=False)
    
    hand = relationship("Hand", back_populates="results")


class Player(Base):
    """Player statistics."""
    __tablename__ = "players"
    
    id = Column(String, primary_key=True)
    name = Column(String)
    hands_played = Column(Integer, default=0)
    total_profit = Column(Integer, default=0)
    vpip = Column(Float, default=0.0)  # Voluntarily Put money In Pot
    pfr = Column(Float, default=0.0)   # Pre-Flop Raise
    aggression_factor = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_played = Column(DateTime, default=datetime.utcnow)
