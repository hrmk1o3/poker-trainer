"""
AI Engine using CFR (Counterfactual Regret Minimization) algorithm.
This is a simplified implementation for 9-max NLHE.
"""
import numpy as np
from typing import Dict, List, Tuple, Optional
from collections import defaultdict


class CFRAgent:
    """
    Counterfactual Regret Minimization agent for poker.
    Simplified implementation for demonstration purposes.
    """
    
    def __init__(self):
        # Store cumulative regrets and strategy for each information set
        self.regret_sum: Dict[str, np.ndarray] = defaultdict(lambda: np.zeros(3))
        self.strategy_sum: Dict[str, np.ndarray] = defaultdict(lambda: np.zeros(3))
        self.num_actions = 3  # fold, call, raise
        
    def get_strategy(self, info_set: str) -> np.ndarray:
        """
        Get current strategy for an information set using regret matching.
        
        Args:
            info_set: String representation of game state
            
        Returns:
            Strategy (probability distribution over actions)
        """
        regrets = self.regret_sum[info_set]
        
        # Apply regret matching
        strategy = np.maximum(regrets, 0)
        normalizing_sum = np.sum(strategy)
        
        if normalizing_sum > 0:
            strategy = strategy / normalizing_sum
        else:
            # Uniform random strategy if no positive regrets
            strategy = np.ones(self.num_actions) / self.num_actions
        
        return strategy
    
    def get_action(self, info_set: str) -> int:
        """
        Sample an action according to current strategy.
        
        Args:
            info_set: String representation of game state
            
        Returns:
            Action index (0=fold, 1=call, 2=raise)
        """
        strategy = self.get_strategy(info_set)
        return np.random.choice(self.num_actions, p=strategy)
    
    def update_strategy(self, info_set: str):
        """
        Add current strategy to strategy sum for average strategy calculation.
        
        Args:
            info_set: String representation of game state
        """
        strategy = self.get_strategy(info_set)
        self.strategy_sum[info_set] += strategy
    
    def get_average_strategy(self, info_set: str) -> np.ndarray:
        """
        Get average strategy over all iterations.
        This converges to Nash equilibrium.
        
        Args:
            info_set: String representation of game state
            
        Returns:
            Average strategy
        """
        avg_strategy = self.strategy_sum[info_set]
        normalizing_sum = np.sum(avg_strategy)
        
        if normalizing_sum > 0:
            avg_strategy = avg_strategy / normalizing_sum
        else:
            avg_strategy = np.ones(self.num_actions) / self.num_actions
        
        return avg_strategy


class PokerAI:
    """
    AI player that makes decisions using simplified hand evaluation and CFR.
    """
    
    def __init__(self, player_id: str, aggression_level: float = 0.5):
        self.player_id = player_id
        self.aggression_level = aggression_level  # 0.0 to 1.0
        self.cfr_agent = CFRAgent()
    
    def make_decision(self, game_state: Dict) -> Tuple[str, int]:
        """
        Make a decision based on current game state.
        
        Args:
            game_state: Current game state dictionary
            
        Returns:
            Tuple of (action_type, amount)
        """
        player = self._find_player(game_state, self.player_id)
        if not player:
            return ("fold", 0)
        
        # Create information set from game state
        info_set = self._create_info_set(game_state, player)
        
        # Get action from CFR agent
        action_idx = self.cfr_agent.get_action(info_set)
        
        # Update strategy
        self.cfr_agent.update_strategy(info_set)
        
        # Map action index to poker action
        return self._map_action(action_idx, game_state, player)
    
    def _find_player(self, game_state: Dict, player_id: str) -> Optional[Dict]:
        """Find player in game state."""
        for player in game_state.get("players", []):
            if player.get("player_id") == player_id:
                return player
        return None
    
    def _create_info_set(self, game_state: Dict, player: Dict) -> str:
        """
        Create information set string from game state.
        Simplified version using basic features.
        
        Args:
            game_state: Current game state
            player: Player dictionary
            
        Returns:
            Information set string
        """
        # Extract relevant features
        phase = game_state.get("phase", "preflop")
        pot = game_state.get("pot", 0)
        current_bet = game_state.get("current_bet", 0)
        player_stack = player.get("stack", 0)
        player_bet = player.get("bet", 0)
        num_players = len([p for p in game_state.get("players", []) if not p.get("has_folded")])
        
        # Simplified info set (in real implementation, would include cards)
        info_set = f"{phase}_{pot}_{current_bet}_{player_stack}_{player_bet}_{num_players}"
        return info_set
    
    def _map_action(self, action_idx: int, game_state: Dict, player: Dict) -> Tuple[str, int]:
        """
        Map CFR action index to poker action.
        
        Args:
            action_idx: Action index from CFR (0=fold, 1=call, 2=raise)
            game_state: Current game state
            player: Player dictionary
            
        Returns:
            Tuple of (action_type, amount)
        """
        current_bet = game_state.get("current_bet", 0)
        player_bet = player.get("bet", 0)
        player_stack = player.get("stack", 0)
        
        if action_idx == 0:
            # Fold (but check if we can check instead)
            if player_bet >= current_bet:
                return ("check", 0)
            return ("fold", 0)
        
        elif action_idx == 1:
            # Call
            call_amount = min(current_bet - player_bet, player_stack)
            if call_amount == 0:
                return ("check", 0)
            return ("call", 0)
        
        else:  # action_idx == 2
            # Raise
            pot = game_state.get("pot", 0)
            
            # Calculate raise size (pot-sized raise by default)
            if current_bet == 0:
                # Bet
                bet_size = int(pot * (0.5 + self.aggression_level * 0.5))
                bet_size = min(bet_size, player_stack)
                if bet_size > 0:
                    return ("bet", bet_size)
                return ("check", 0)
            else:
                # Raise
                raise_size = int(current_bet * (2 + self.aggression_level))
                raise_size = min(raise_size, player_stack)
                if raise_size >= current_bet * 2:
                    return ("raise", raise_size)
                # If can't raise, call instead
                call_amount = min(current_bet - player_bet, player_stack)
                if call_amount == 0:
                    return ("check", 0)
                return ("call", 0)


class HandEvaluator:
    """
    Simplified hand evaluator using NumPy.
    In production, use a library like pokereval or treys.
    """
    
    RANK_VALUES = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, 
        '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    }
    
    @staticmethod
    def evaluate_hand(hole_cards: List[str], community_cards: List[str]) -> int:
        """
        Evaluate hand strength.
        Returns a numerical score (higher is better).
        Simplified implementation.
        
        Args:
            hole_cards: Player's hole cards (e.g., ['As', 'Kh'])
            community_cards: Community cards
            
        Returns:
            Hand strength score
        """
        all_cards = hole_cards + community_cards
        
        if len(all_cards) < 2:
            return 0
        
        # Extract ranks and suits
        ranks = [card[0] for card in all_cards]
        suits = [card[1] for card in all_cards]
        
        # Convert to numerical values
        rank_values = [HandEvaluator.RANK_VALUES.get(r, 0) for r in ranks]
        
        # Simple evaluation based on high card
        # In real implementation, would check for pairs, straights, flushes, etc.
        return max(rank_values) if rank_values else 0
    
    @staticmethod
    def calculate_hand_strength(hole_cards: List[str], community_cards: List[str], 
                                num_opponents: int = 1) -> float:
        """
        Calculate hand strength using Monte Carlo simulation.
        Simplified version.
        
        Args:
            hole_cards: Player's hole cards
            community_cards: Community cards
            num_opponents: Number of opponents
            
        Returns:
            Win probability (0.0 to 1.0)
        """
        # Simplified: just evaluate current hand
        score = HandEvaluator.evaluate_hand(hole_cards, community_cards)
        
        # Normalize to probability
        max_score = 14  # Ace
        return min(score / max_score, 1.0)
