"""
Add AI players to a poker table for testing and training.
Usage: python add_ai_players.py <table_id> <num_players>
"""
import asyncio
import sys
import uuid
from ai.cfr_engine import PokerAI


async def add_ai_player(table_id: str, player_name: str):
    """Add an AI player to the table."""
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        # Join table
        async with session.post(
            f"http://localhost:8000/api/tables/{table_id}/join?player_name={player_name}"
        ) as response:
            if response.status == 200:
                data = await response.json()
                player_id = data["player_id"]
                print(f"✅ AI player '{player_name}' joined with ID: {player_id}")
                return player_id
            else:
                print(f"❌ Failed to add AI player '{player_name}'")
                return None


async def main():
    if len(sys.argv) < 3:
        print("Usage: python add_ai_players.py <table_id> <num_players>")
        print("Example: python add_ai_players.py abc-123 5")
        sys.exit(1)
    
    table_id = sys.argv[1]
    num_players = int(sys.argv[2])
    
    if num_players < 1 or num_players > 8:
        print("Number of players must be between 1 and 8")
        sys.exit(1)
    
    print(f"Adding {num_players} AI players to table {table_id}...")
    
    ai_names = [
        "AI-Alpha", "AI-Beta", "AI-Gamma", "AI-Delta",
        "AI-Epsilon", "AI-Zeta", "AI-Eta", "AI-Theta"
    ]
    
    player_ids = []
    for i in range(num_players):
        player_name = ai_names[i]
        player_id = await add_ai_player(table_id, player_name)
        if player_id:
            player_ids.append((player_id, player_name))
    
    print(f"\n✅ Successfully added {len(player_ids)} AI players")
    print("\nAI Players:")
    for player_id, player_name in player_ids:
        print(f"  - {player_name}: {player_id}")


if __name__ == "__main__":
    try:
        import aiohttp
    except ImportError:
        print("Installing aiohttp...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "aiohttp"])
        import aiohttp
    
    asyncio.run(main())
