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
        relative bg-gray-800 rounded p-1 sm:p-1.5 md:p-2 lg:p-3 min-w-[80px] sm:min-w-[100px] md:min-w-[120px] lg:min-w-[140px] shadow-lg
        ${isActive ? 'ring-2 sm:ring-3 md:ring-4 ring-yellow-400' : ''}
        ${isCurrentPlayer ? 'ring-1 sm:ring-2 ring-blue-400' : ''}
        ${player.has_folded ? 'opacity-50' : ''}
      `}
    >
      {/* Dealer Button */}
      {player.is_dealer && (
        <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 md:-top-2 md:-right-2 bg-white text-black rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 flex items-center justify-center font-bold text-[0.5rem] sm:text-xs md:text-sm border border-yellow-400">
          D
        </div>
      )}

      {/* Small Blind */}
      {player.is_small_blind && (
        <div className="absolute -top-0.5 -left-0.5 sm:-top-1 sm:-left-1 md:-top-2 md:-left-2 bg-blue-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 flex items-center justify-center font-bold text-[0.45rem] sm:text-[0.5rem] md:text-xs">
          SB
        </div>
      )}

      {/* Big Blind */}
      {player.is_big_blind && (
        <div className="absolute -top-0.5 -left-0.5 sm:-top-1 sm:-left-1 md:-top-2 md:-left-2 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 flex items-center justify-center font-bold text-[0.45rem] sm:text-[0.5rem] md:text-xs">
          BB
        </div>
      )}

      {/* Player Info */}
      <div className="text-white text-center">
        <div className="font-bold text-[0.65rem] sm:text-xs md:text-sm mb-0.5 truncate">{player.name}</div>
        <div className="text-yellow-400 font-bold text-[0.65rem] sm:text-xs md:text-sm">${player.stack}</div>

        {player.bet > 0 && (
          <div className="text-green-400 text-[0.6rem] sm:text-xs mt-0.5">
            Bet: ${player.bet}
          </div>
        )}

        {player.has_folded && (
          <div className="text-red-400 text-[0.55rem] sm:text-[0.6rem] md:text-xs mt-0.5">FOLDED</div>
        )}

        {player.is_all_in && (
          <div className="text-yellow-400 text-[0.55rem] sm:text-[0.6rem] md:text-xs mt-0.5">ALL-IN</div>
        )}
      </div>

      {/* Hole Cards */}
      {showCards && player.hole_cards && player.hole_cards.length > 0 && !player.has_folded && (
        <div className="flex gap-0.5 mt-0.5 sm:mt-1 justify-center">
          {player.hole_cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded shadow w-5 h-7 sm:w-6 sm:h-9 md:w-7 md:h-10 lg:w-8 lg:h-12 flex items-center justify-center text-[0.55rem] sm:text-[0.6rem] md:text-xs font-bold"
            >
              {formatCard(card)}
            </div>
          ))}
        </div>
      )}

      {/* Hidden Cards */}
      {!showCards && player.is_active && !player.has_folded && (
        <div className="flex gap-0.5 mt-0.5 sm:mt-1 justify-center">
          <div className="bg-red-700 rounded shadow w-5 h-7 sm:w-6 sm:h-9 md:w-7 md:h-10 lg:w-8 lg:h-12 border border-white"></div>
          <div className="bg-red-700 rounded shadow w-5 h-7 sm:w-6 sm:h-9 md:w-7 md:h-10 lg:w-8 lg:h-12 border border-white"></div>
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
