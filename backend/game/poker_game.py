"""
Core poker game logic for 9-max No Limit Hold'em.
"""
import random
import uuid
from typing import List, Dict, Optional
from datetime import datetime

from models.game_state import (
    GamePhase, ActionType, PlayerState, GameStateResponse
)


class Card:
    """Represents a playing card."""
    RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
    SUITS = ['c', 'd', 'h', 's']  # clubs, diamonds, hearts, spades
    
    def __init__(self, rank: str, suit: str):
        self.rank = rank
        self.suit = suit
    
    def __str__(self):
        return f"{self.rank}{self.suit}"
    
    def __repr__(self):
        return str(self)


class Deck:
    """52-card deck."""
    
    def __init__(self):
        self.cards = [Card(rank, suit) for suit in Card.SUITS for rank in Card.RANKS]
        self.shuffle()
    
    def shuffle(self):
        random.shuffle(self.cards)
    
    def deal(self, n: int = 1) -> List[Card]:
        """Deal n cards from the deck."""
        if n > len(self.cards):
            raise ValueError("Not enough cards in deck")
        dealt = self.cards[:n]
        self.cards = self.cards[n:]
        return dealt


class Player:
    """Represents a player at the poker table."""
    
    def __init__(self, player_id: str, name: str, stack: int, position: int):
        self.player_id = player_id
        self.name = name
        self.stack = stack
        self.position = position
        self.hole_cards: List[Card] = []
        self.bet = 0
        self.is_active = True
        self.has_folded = False
        self.is_all_in = False
    
    def reset_for_new_hand(self):
        """Reset player state for a new hand."""
        self.hole_cards = []
        self.bet = 0
        self.has_folded = False
        self.is_all_in = False
        if self.stack > 0:
            self.is_active = True
    
    def to_dict(self, show_cards: bool = False) -> Dict:
        """Convert player to dictionary."""
        return {
            "player_id": self.player_id,
            "name": self.name,
            "stack": self.stack,
            "bet": self.bet,
            "position": self.position,
            "is_active": self.is_active,
            "hole_cards": [str(card) for card in self.hole_cards] if show_cards else None,
            "has_folded": self.has_folded,
            "is_all_in": self.is_all_in
        }


class PokerGame:
    """Main poker game manager for 9-max NLHE."""
    
    def __init__(self, table_id: str, max_players: int, small_blind: int, 
                 big_blind: int, starting_stack: int):
        self.table_id = table_id
        self.max_players = max_players
        self.small_blind = small_blind
        self.big_blind = big_blind
        self.starting_stack = starting_stack
        
        self.players: List[Player] = []
        self.deck: Optional[Deck] = None
        self.community_cards: List[Card] = []
        self.pot = 0
        self.current_bet = 0
        self.last_raise_size = 0  # Track the size of the last raise (for minimum raise calculation)
        self.phase = GamePhase.WAITING
        self.dealer_position = 0
        self.current_player_index = 0
        self.betting_round_start_index = 0  # Track where betting round started
        self.last_raiser_index = None  # Track the last player who raised/bet (for round completion)
        self.bb_has_acted_preflop = False  # Track if BB has acted in preflop (after posting blind)
        self.hand_id = None
        self.action_history = []
    
    def add_player(self, name: str) -> Optional[str]:
        """Add a new player to the table."""
        if len(self.players) >= self.max_players:
            return None

        player_id = str(uuid.uuid4())
        position = len(self.players)
        player = Player(player_id, name, self.starting_stack, position)

        # If game is in progress, set player as inactive until next hand
        if self.phase != GamePhase.WAITING:
            player.is_active = False

        self.players.append(player)

        return player_id
    
    def start_new_hand(self):
        """Start a new hand."""
        if len(self.players) < 2:
            raise ValueError("Need at least 2 players to start")
        
        # Reset all players for new hand
        for player in self.players:
            player.reset_for_new_hand()
        
        # Initialize deck and shuffle
        self.deck = Deck()
        self.community_cards = []
        self.pot = 0
        self.current_bet = 0
        self.phase = GamePhase.PREFLOP
        self.hand_id = str(uuid.uuid4())
        self.action_history = []
        
        # Move dealer button
        self.dealer_position = (self.dealer_position + 1) % len(self.players)
        
        # Post blinds
        self._post_blinds()
        
        # Initialize last_raise_size to big blind for preflop
        self.last_raise_size = self.big_blind

        # Reset BB action flag for preflop
        self.bb_has_acted_preflop = False

        # Deal hole cards
        self._deal_hole_cards()

        # Set first player to act (after big blind)
        self.current_player_index = (self.dealer_position + 3) % len(self.players)
        # For preflop, betting round completes when action returns to big blind
        # Big blind is at dealer + 2
        bb_index = (self.dealer_position + 2) % len(self.players)
        self.betting_round_start_index = bb_index
        # BB posted blind, so they are the initial "raiser" for preflop
        self.last_raiser_index = bb_index
    
    def _post_blinds(self):
        """Post small and big blinds."""
        active_players = [p for p in self.players if p.is_active]
        if len(active_players) < 2:
            return
        
        # Small blind (dealer + 1)
        sb_index = (self.dealer_position + 1) % len(self.players)
        sb_player = self.players[sb_index]
        sb_amount = min(self.small_blind, sb_player.stack)
        sb_player.stack -= sb_amount
        sb_player.bet = sb_amount
        self.pot += sb_amount
        
        # Big blind (dealer + 2)
        bb_index = (self.dealer_position + 2) % len(self.players)
        bb_player = self.players[bb_index]
        bb_amount = min(self.big_blind, bb_player.stack)
        bb_player.stack -= bb_amount
        bb_player.bet = bb_amount
        self.pot += bb_amount
        
        self.current_bet = self.big_blind
    
    def _deal_hole_cards(self):
        """Deal 2 hole cards to each active player."""
        for player in self.players:
            if player.is_active:
                player.hole_cards = self.deck.deal(2)
    
    def process_action(self, player_id: str, action_type: str, amount: int = 0) -> Dict:
        """Process a player action."""
        # Find player
        player = next((p for p in self.players if p.player_id == player_id), None)
        if not player:
            raise ValueError("Player not found")
        
        if player.has_folded or not player.is_active:
            raise ValueError("Player cannot act")
        
        # Process action
        if action_type == ActionType.FOLD:
            # Rule: Cannot fold if you can check (no additional chips needed to call)
            # If player.bet >= current_bet, they can check, so they cannot fold
            if player.bet >= self.current_bet:
                raise ValueError("Cannot fold when you can check. You must check, bet, or raise.")
            player.has_folded = True
            player.is_active = False
        
        elif action_type == ActionType.CHECK:
            if player.bet < self.current_bet:
                raise ValueError("Cannot check, must call or raise")
            # Post-flop rule: Check is only allowed when no one has bet (current_bet == 0)
            # In preflop, checking is allowed when player has matched the bet
            if self.phase != GamePhase.PREFLOP and self.current_bet > 0:
                raise ValueError("Cannot check when someone has bet. You must fold, call, or raise.")
        
        elif action_type == ActionType.CALL:
            # Post-flop rule: Call is only allowed when someone has bet (current_bet > 0)
            if self.phase != GamePhase.PREFLOP and self.current_bet == 0:
                raise ValueError("Cannot call when no one has bet. You must check or bet.")
            call_amount = min(self.current_bet - player.bet, player.stack)
            player.stack -= call_amount
            player.bet += call_amount
            self.pot += call_amount
            if player.stack == 0:
                player.is_all_in = True
        
        elif action_type == ActionType.RAISE or action_type == ActionType.BET:
            # Post-flop rule: Bet is only allowed when no one has bet (current_bet == 0)
            # Raise is only allowed when someone has bet (current_bet > 0)
            if self.phase != GamePhase.PREFLOP:
                if action_type == ActionType.BET and self.current_bet > 0:
                    raise ValueError("Cannot bet when someone has already bet. You must fold, call, or raise.")
                if action_type == ActionType.RAISE and self.current_bet == 0:
                    raise ValueError("Cannot raise when no one has bet. You must check or bet.")
            
            if self.current_bet > 0:
                # Raise: must be at least the previous bet + the last raise size
                # Or at least 2x the current bet (whichever is larger)
                # For the first raise in a round, last_raise_size is the big blind
                min_raise_amount = max(
                    self.current_bet + (self.last_raise_size if self.last_raise_size > 0 else self.big_blind),
                    self.current_bet * 2
                )
                if amount < min_raise_amount:
                    raise ValueError(f"Raise must be at least {min_raise_amount}")
                
                # Calculate the raise size (amount - current_bet)
                raise_size = amount - self.current_bet
            else:
                # Bet: must be at least the big blind
                if amount < self.big_blind:
                    raise ValueError(f"Bet must be at least {self.big_blind}")
                raise_size = amount
            
            bet_amount = min(amount, player.stack)
            player.stack -= bet_amount
            player.bet += bet_amount
            self.pot += bet_amount
            
            # Update current bet and last raise size
            if player.bet > self.current_bet:
                if self.current_bet > 0:
                    # This is a raise, track the raise size
                    self.last_raise_size = player.bet - self.current_bet
                else:
                    # This is a bet, the raise size is the bet amount
                    self.last_raise_size = player.bet
                self.current_bet = player.bet
                # Track who raised/bet last - everyone else needs to act after this
                self.last_raiser_index = self.current_player_index

            if player.stack == 0:
                player.is_all_in = True
        
        elif action_type == ActionType.ALL_IN:
            all_in_amount = player.stack
            player.stack = 0
            player.bet += all_in_amount
            self.pot += all_in_amount
            player.is_all_in = True
            if player.bet > self.current_bet:
                # Update current bet and last raise size if this is a raise
                if self.current_bet > 0:
                    # This is an all-in raise, track the raise size
                    self.last_raise_size = player.bet - self.current_bet
                else:
                    # This is an all-in bet, the raise size is the bet amount
                    self.last_raise_size = player.bet
                self.current_bet = player.bet
                # Track who raised/bet last - everyone else needs to act after this
                self.last_raiser_index = self.current_player_index
        
        # Track preflop actions for BB option rule
        if self.phase == GamePhase.PREFLOP:
            bb_index = (self.dealer_position + 2) % len(self.players)
            bb_player = self.players[bb_index]

            if player_id == bb_player.player_id:
                # BB has acted (not just posted blind, but took an action)
                # Any action (check, call, raise, fold, all-in) after posting blind counts
                # The blind posting itself doesn't count as an action for betting round completion
                self.bb_has_acted_preflop = True
        
        # Record action
        self.action_history.append({
            "player_id": player_id,
            "action": action_type,
            "amount": amount,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Move to next player or next phase
        self._advance_action()
        
        return {"status": "success", "state": self.get_state()}
    
    def _advance_action(self):
        """Move to next player or next phase."""
        active_players = [p for p in self.players if not p.has_folded and not p.is_all_in]

        if len(active_players) <= 1:
            # Only one player left or everyone all-in, go to showdown
            self._complete_hand()
            return

        # Move to next active player
        self.current_player_index = (self.current_player_index + 1) % len(self.players)

        # Skip folded/all-in players, but don't loop forever
        attempts = 0
        while (self.players[self.current_player_index].has_folded or \
              self.players[self.current_player_index].is_all_in) and \
              attempts < len(self.players):
            self.current_player_index = (self.current_player_index + 1) % len(self.players)
            attempts += 1

        # Check if we've gone through all players (shouldn't happen normally)
        if attempts >= len(self.players):
            # All players are folded or all-in, complete hand
            self._complete_hand()
            return

        # Check if betting round is complete AFTER moving to next player
        # This ensures everyone has had a chance to act before completing
        if self._is_betting_round_complete():
            self._advance_phase()
            return
    
    def _is_betting_round_complete(self) -> bool:
        """Check if current betting round is complete.

        The round is complete when:
        1. All active players have matched the current bet
        2. Action has returned to the player after the last raiser (or betting round start if no raises)
        3. For preflop, BB must have acted (not just posted blind)
        """
        active_players = [p for p in self.players if not p.has_folded and not p.is_all_in]
        if not active_players:
            return True

        if len(active_players) <= 1:
            return True

        # All active players have matched the current bet
        all_matched = all(p.bet == self.current_bet for p in active_players)

        if not all_matched:
            return False

        # Determine the completion point:
        # - If someone raised/bet, everyone after them needs to act, so we check if action returned to them
        # - If no one raised, we check if action returned to the betting round start
        completion_index = self.last_raiser_index if self.last_raiser_index is not None else self.betting_round_start_index

        # Special case for preflop: BB must have acted (not just posted blind)
        if self.phase == GamePhase.PREFLOP:
            bb_index = (self.dealer_position + 2) % len(self.players)
            # If BB is the completion point and they haven't acted yet, round is not complete
            if completion_index == bb_index and not self.bb_has_acted_preflop:
                return False

        # Check if current player is at the completion point
        # This means everyone after the last raiser has had a chance to act
        if self.current_player_index == completion_index:
            return True

        return False
    
    def _advance_phase(self):
        """Advance to next phase of the hand."""
        # Reset bets for next round
        for player in self.players:
            player.bet = 0
        self.current_bet = 0
        self.last_raise_size = 0  # Reset raise size for new betting round
        self.last_raiser_index = None  # Reset last raiser for new betting round
        
        if self.phase == GamePhase.PREFLOP:
            self.phase = GamePhase.FLOP
            self.community_cards.extend(self.deck.deal(3))
        elif self.phase == GamePhase.FLOP:
            self.phase = GamePhase.TURN
            self.community_cards.extend(self.deck.deal(1))
        elif self.phase == GamePhase.TURN:
            self.phase = GamePhase.RIVER
            self.community_cards.extend(self.deck.deal(1))
        elif self.phase == GamePhase.RIVER:
            self._complete_hand()
            return
        
        # Set first player to act (after dealer)
        self.current_player_index = (self.dealer_position + 1) % len(self.players)
        while self.players[self.current_player_index].has_folded or \
              self.players[self.current_player_index].is_all_in:
            self.current_player_index = (self.current_player_index + 1) % len(self.players)
        
        # Track where this betting round started
        self.betting_round_start_index = self.current_player_index
    
    def _complete_hand(self):
        """Complete the hand and determine winner."""
        self.phase = GamePhase.SHOWDOWN
        
        # Simple winner determination (first active player wins for now)
        # In a full implementation, this would evaluate hand strength
        active_players = [p for p in self.players if not p.has_folded]
        if active_players:
            winner = active_players[0]
            winner.stack += self.pot
            self.pot = 0
        
        self.phase = GamePhase.FINISHED
    
    def get_state(self, requesting_player_id: str = None) -> Dict:
        """Get current game state."""
        current_player_id = None
        if self.phase in [GamePhase.PREFLOP, GamePhase.FLOP, GamePhase.TURN, GamePhase.RIVER]:
            if 0 <= self.current_player_index < len(self.players):
                current_player_id = self.players[self.current_player_index].player_id
        
        return {
            "table_id": self.table_id,
            "phase": self.phase.value,
            "players": [
                {
                    **p.to_dict(show_cards=(requesting_player_id == p.player_id)),
                    "is_dealer": i == self.dealer_position,
                    "is_small_blind": i == (self.dealer_position + 1) % len(self.players) if len(self.players) > 1 else False,
                    "is_big_blind": i == (self.dealer_position + 2) % len(self.players) if len(self.players) > 1 else False,
                }
                for i, p in enumerate(self.players)
            ],
            "community_cards": [str(card) for card in self.community_cards],
            "pot": self.pot,
            "current_bet": self.current_bet,
            "last_raise_size": self.last_raise_size,
            "current_player_id": current_player_id,
            "dealer_position": self.dealer_position,
            "small_blind": self.small_blind,
            "big_blind": self.big_blind,
            "winners": None
        }
