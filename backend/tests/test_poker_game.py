"""
Basic tests for the Poker Game engine.
Run with: pytest test_poker_game.py
"""
import sys
sys.path.insert(0, '..')

from game.poker_game import PokerGame, Card, Deck, Player


def test_deck_creation():
    """Test that deck has 52 cards."""
    deck = Deck()
    assert len(deck.cards) == 52


def test_deck_deal():
    """Test dealing cards from deck."""
    deck = Deck()
    cards = deck.deal(5)
    assert len(cards) == 5
    assert len(deck.cards) == 47


def test_player_creation():
    """Test player initialization."""
    player = Player("player1", "Alice", 1000, 0)
    assert player.player_id == "player1"
    assert player.name == "Alice"
    assert player.stack == 1000
    assert player.position == 0
    assert player.is_active == True
    assert player.has_folded == False


def test_game_creation():
    """Test poker game initialization."""
    game = PokerGame(
        table_id="table1",
        max_players=9,
        small_blind=5,
        big_blind=10,
        starting_stack=1000
    )
    assert game.table_id == "table1"
    assert game.max_players == 9
    assert len(game.players) == 0


def test_add_player():
    """Test adding players to the table."""
    game = PokerGame("table1", 9, 5, 10, 1000)
    
    player1_id = game.add_player("Alice")
    assert player1_id is not None
    assert len(game.players) == 1
    
    player2_id = game.add_player("Bob")
    assert player2_id is not None
    assert len(game.players) == 2


def test_start_hand():
    """Test starting a new hand."""
    game = PokerGame("table1", 9, 5, 10, 1000)
    game.add_player("Alice")
    game.add_player("Bob")
    
    game.start_new_hand()
    
    assert game.phase.value == "preflop"
    assert game.pot == 15  # SB + BB
    assert game.current_bet == 10
    
    # Check that players have hole cards
    for player in game.players:
        if player.is_active:
            assert len(player.hole_cards) == 2


def test_get_state():
    """Test getting game state."""
    game = PokerGame("table1", 9, 5, 10, 1000)
    game.add_player("Alice")
    
    state = game.get_state()
    
    assert state["table_id"] == "table1"
    assert state["phase"] == "waiting"
    assert len(state["players"]) == 1
    assert state["pot"] == 0
    assert state["small_blind"] == 5
    assert state["big_blind"] == 10


if __name__ == "__main__":
    # Run tests manually
    test_deck_creation()
    test_deck_deal()
    test_player_creation()
    test_game_creation()
    test_add_player()
    test_start_hand()
    test_get_state()
    print("✅ All tests passed!")
