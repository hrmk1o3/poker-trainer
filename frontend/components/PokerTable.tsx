import React from 'react'
import { GameState, PlayerAction } from '@/lib/types'
import PlayerSeat from './PlayerSeat'
import ActionButtons from './ActionButtons'

interface PokerTableProps {
  gameState: GameState
  playerId: string | null
  onAction: (action: PlayerAction) => void
}

export default function PokerTable({ gameState, playerId, onAction }: PokerTableProps) {
  const { players, community_cards, pot, current_bet, current_player_id, phase, last_raise_size, big_blind } = gameState

  // 9-max seat positions (clockwise from dealer)
  const seatPositions = [
    { top: '50%', left: '50%', transform: 'translate(-50%, -200%)' }, // Seat 0 - Top
    { top: '25%', left: '75%', transform: 'translate(-50%, -50%)' },  // Seat 1 - Top Right
    { top: '50%', left: '90%', transform: 'translate(-100%, -50%)' }, // Seat 2 - Right
    { top: '75%', left: '75%', transform: 'translate(-50%, -50%)' },  // Seat 3 - Bottom Right
    { top: '90%', left: '60%', transform: 'translate(-50%, -100%)' }, // Seat 4 - Bottom Right Center
    { top: '90%', left: '40%', transform: 'translate(-50%, -100%)' }, // Seat 5 - Bottom Left Center
    { top: '75%', left: '25%', transform: 'translate(-50%, -50%)' },  // Seat 6 - Bottom Left
    { top: '50%', left: '10%', transform: 'translate(0%, -50%)' },    // Seat 7 - Left
    { top: '25%', left: '25%', transform: 'translate(-50%, -50%)' },  // Seat 8 - Top Left
  ]

  // Find current player
  const currentPlayer = players.find(p => p.player_id === playerId)
  const isCurrentPlayerTurn = current_player_id === playerId

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Poker Table */}
      <div className="relative bg-green-700 rounded-full border-2 sm:border-4 md:border-6 lg:border-8 shadow-2xl" style={{ paddingTop: '40%' }}>
        
        {/* Center Area - Community Cards and Pot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          {/* Community Cards */}
          <div className="flex gap-0.5 sm:gap-1 md:gap-1.5 mb-1 sm:mb-2 md:mb-3 justify-center">
            {community_cards.length > 0 ? (
              community_cards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded shadow-lg w-8 h-11 sm:w-10 sm:h-14 md:w-12 md:h-16 lg:w-14 lg:h-20 flex items-center justify-center text-xs sm:text-sm md:text-base lg:text-xl font-bold border border-gray-300"
                >
                  {formatCard(card)}
                </div>
              ))
            ) : (
              <div className="text-white text-[0.65rem] sm:text-xs md:text-sm lg:text-base">No community cards yet</div>
            )}
          </div>

          {/* Pot */}
          <div className="bg-yellow-600 text-white font-bold px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm md:text-base rounded-full shadow-lg">
            Pot: ${pot}
          </div>

          {/* Phase */}
          <div className="mt-0.5 sm:mt-1 md:mt-1.5 text-white font-semibold uppercase text-[0.65rem] sm:text-xs md:text-sm">
            {phase}
          </div>
        </div>

        {/* Player Seats */}
        {players.map((player, index) => {
          const position = seatPositions[index] || seatPositions[0]
          return (
            <div
              key={player.player_id}
              className="absolute"
              style={position}
            >
              <PlayerSeat
                player={player}
                isCurrentPlayer={player.player_id === playerId}
                isActive={player.player_id === current_player_id}
                showCards={player.player_id === playerId}
              />
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      {isCurrentPlayerTurn &&
        currentPlayer &&
        currentPlayer.is_active &&
        !currentPlayer.has_folded &&
        !currentPlayer.is_all_in &&
        phase !== 'waiting' &&
        phase !== 'finished' && (
        <div className="mt-1 sm:mt-2 md:mt-3">
          <ActionButtons
            currentBet={current_bet}
            playerBet={currentPlayer.bet}
            playerStack={currentPlayer.stack}
            playerId={playerId || ''}
            phase={phase}
            lastRaiseSize={last_raise_size}
            bigBlind={big_blind}
            onAction={onAction}
          />
        </div>
      )}

      {/* Game Info */}
      <div className="mt-1 sm:mt-2 md:mt-3 text-white text-center">
        <p className="text-[0.65rem] sm:text-xs md:text-sm">
          Current Bet: ${current_bet} |
          Small Blind: ${gameState.small_blind} |
          Big Blind: ${gameState.big_blind}
        </p>
      </div>
    </div>
  )
}

function formatCard(card: string): React.ReactNode {
  if (!card || card.length < 2) return card
  
  const rank = card[0]
  const suit = card[1]
  
  const suitSymbols: { [key: string]: string } = {
    'h': '♥',
    'd': '♦',
    'c': '♣',
    's': '♠'
  }
  
  const suitColors: { [key: string]: string } = {
    'h': 'text-red-600',
    'd': 'text-red-600',
    'c': 'text-black',
    's': 'text-black'
  }
  
  return (
    <span className={suitColors[suit] || 'text-black'}>
      {rank}{suitSymbols[suit] || suit}
    </span>
  )
}
