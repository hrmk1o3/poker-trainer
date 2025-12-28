import React from 'react'
import { Player } from '@/lib/types'

interface PlayerSeatProps {
  player: Player
  isCurrentPlayer: boolean
  isActive: boolean
  showCards: boolean
}

export default function PlayerSeat({ player, isCurrentPlayer, isActive, showCards }: PlayerSeatProps) {
  return (
    <div
      className={`
        relative bg-gray-800 rounded-lg p-3 min-w-[140px] shadow-lg
        ${isActive ? 'ring-4 ring-yellow-400' : ''}
        ${isCurrentPlayer ? 'ring-2 ring-blue-400' : ''}
        ${player.has_folded ? 'opacity-50' : ''}
      `}
    >
      {/* Dealer Button */}
      {player.is_dealer && (
        <div className="absolute -top-2 -right-2 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-yellow-400">
          D
        </div>
      )}

      {/* Small Blind */}
      {player.is_small_blind && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs">
          SB
        </div>
      )}

      {/* Big Blind */}
      {player.is_big_blind && (
        <div className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs">
          BB
        </div>
      )}

      {/* Player Info */}
      <div className="text-white text-center">
        <div className="font-bold text-sm mb-1 truncate">{player.name}</div>
        <div className="text-yellow-400 font-bold">${player.stack}</div>
        
        {player.bet > 0 && (
          <div className="text-green-400 text-sm mt-1">
            Bet: ${player.bet}
          </div>
        )}

        {player.has_folded && (
          <div className="text-red-400 text-xs mt-1">FOLDED</div>
        )}

        {player.is_all_in && (
          <div className="text-yellow-400 text-xs mt-1">ALL-IN</div>
        )}
      </div>

      {/* Hole Cards */}
      {showCards && player.hole_cards && player.hole_cards.length > 0 && !player.has_folded && (
        <div className="flex gap-1 mt-2 justify-center">
          {player.hole_cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded shadow w-8 h-12 flex items-center justify-center text-xs font-bold"
            >
              {formatCard(card)}
            </div>
          ))}
        </div>
      )}

      {/* Hidden Cards */}
      {!showCards && player.is_active && !player.has_folded && (
        <div className="flex gap-1 mt-2 justify-center">
          <div className="bg-red-700 rounded shadow w-8 h-12 border border-white"></div>
          <div className="bg-red-700 rounded shadow w-8 h-12 border border-white"></div>
        </div>
      )}
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
