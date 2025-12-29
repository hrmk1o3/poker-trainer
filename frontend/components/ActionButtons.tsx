import React, { useEffect, useState } from 'react'
import { PlayerAction, GamePhase } from '@/lib/types'

interface ActionButtonsProps {
  currentBet: number
  playerBet: number
  playerStack: number
  playerId: string
  phase: GamePhase
  lastRaiseSize: number
  bigBlind: number
  onAction: (action: PlayerAction) => void
}

export default function ActionButtons({
  currentBet,
  playerBet,
  playerStack,
  playerId,
  phase,
  lastRaiseSize,
  bigBlind,
  onAction
}: ActionButtonsProps) {
  const maxTotal = playerBet + playerStack

  // Calculate minimum raise according to poker rules:
  // min_raise = max(current_bet + last_raise_size, current_bet * 2)
  // For the first raise in a round, last_raise_size is the big blind
  const minRaise = currentBet > 0
    ? Math.max(currentBet + (lastRaiseSize || bigBlind), currentBet * 2)
    : bigBlind

  // Minimum bet total (when no one has bet) is BB, unless the player is shorter (then only all-in is possible)
  const minBetTotal = Math.min(bigBlind, maxTotal)

  const minTargetTotal = currentBet > 0 ? minRaise : minBetTotal

  const [raiseAmount, setRaiseAmount] = useState<number>(minTargetTotal)

  useEffect(() => {
    // Keep input in a valid range when game state changes.
    setRaiseAmount((prev) => clamp(prev, minTargetTotal, maxTotal))
  }, [minTargetTotal, maxTotal])

  const callAmount = Math.max(0, currentBet - playerBet)
  const canCheck = playerBet >= currentBet
  const canFold = !canCheck  // Cannot fold if you can check
  
  // Post-flop rules: 
  // - When no one has bet (currentBet == 0): only Check and Bet are allowed
  // - When someone has bet (currentBet > 0): only Fold, Call, and Raise are allowed
  const isPostFlop = phase === 'flop' || phase === 'turn' || phase === 'river'
  const noOneHasBet = currentBet === 0
  const someoneHasBet = currentBet > 0
  
  // Determine which actions are available based on phase and betting situation
  const canShowFold = canFold && (!isPostFlop || someoneHasBet)
  const canShowCheck = canCheck && (!isPostFlop || noOneHasBet)
  const canShowCall = !canCheck && (!isPostFlop || someoneHasBet)
  const canShowBet = !isPostFlop || noOneHasBet
  const canShowRaise = !isPostFlop || someoneHasBet

  const handleFold = () => {
    if (!canFold) {
      alert('Cannot fold when you can check. You must check, bet, or raise.')
      return
    }
    onAction({ player_id: playerId, action_type: 'fold', amount: 0 })
  }

  const handleCheck = () => {
    onAction({ player_id: playerId, action_type: 'check', amount: 0 })
  }

  const handleCall = () => {
    onAction({ player_id: playerId, action_type: 'call', amount: 0 })
  }

  const handleRaise = () => {
    if (raiseAmount >= minRaise && raiseAmount <= maxTotal) {
      onAction({ player_id: playerId, action_type: 'raise', amount: raiseAmount })
    } else {
      alert(`Raise must be between $${minRaise} and $${maxTotal}`)
    }
  }

  const handleBet = () => {
    if (raiseAmount >= minBetTotal && raiseAmount <= maxTotal) {
      onAction({ player_id: playerId, action_type: 'bet', amount: raiseAmount })
    } else {
      alert(`Bet must be between $${minBetTotal} and $${maxTotal}`)
    }
  }

  const handleAllIn = () => {
    onAction({ player_id: playerId, action_type: 'all_in', amount: playerStack })
  }

  return (
    <div className="bg-gray-800 rounded p-1 sm:p-1.5 md:p-2 lg:p-4 shadow-lg max-w-full">
      <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 justify-center items-center">

        {/* Fold Button */}
        {canShowFold && (
          <button
            onClick={handleFold}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 sm:py-1.5 sm:px-2.5 md:py-2 md:px-3 lg:py-2.5 lg:px-5 text-xs sm:text-sm md:text-base rounded transition shadow-lg"
          >
            Fold
          </button>
        )}

        {/* Check/Call Button */}
        {canShowCheck && (
          <button
            onClick={handleCheck}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:py-1.5 sm:px-2.5 md:py-2 md:px-3 lg:py-2.5 lg:px-5 text-xs sm:text-sm md:text-base rounded transition shadow-lg"
          >
            Check
          </button>
        )}
        {canShowCall && (
          <button
            onClick={handleCall}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 sm:py-1.5 sm:px-2.5 md:py-2 md:px-3 lg:py-2.5 lg:px-5 text-xs sm:text-sm md:text-base rounded transition shadow-lg whitespace-nowrap"
          >
            Call ${callAmount}
          </button>
        )}

        {/* Raise/Bet Controls */}
        {(canShowBet || canShowRaise) && (
          <div className="flex gap-1 items-center">
            <input
              type="number"
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(parseInt(e.target.value) || 0)}
              min={minTargetTotal}
              max={maxTotal}
              className="w-12 sm:w-14 md:w-16 lg:w-20 px-1 sm:px-1.5 md:px-2 py-1 sm:py-1.5 md:py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-black font-bold text-xs sm:text-sm md:text-base"
            />

            {canShowRaise && currentBet > 0 ? (
              <button
                onClick={handleRaise}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-2 sm:py-1.5 sm:px-2.5 md:py-2 md:px-3 lg:py-2.5 lg:px-5 text-xs sm:text-sm md:text-base rounded transition shadow-lg"
              >
                Raise
              </button>
            ) : canShowBet && currentBet === 0 ? (
              <button
                onClick={handleBet}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-2 sm:py-1.5 sm:px-2.5 md:py-2 md:px-3 lg:py-2.5 lg:px-5 text-xs sm:text-sm md:text-base rounded transition shadow-lg"
              >
                Bet
              </button>
            ) : null}
          </div>
        )}

        {/* All-In Button */}
        <button
          onClick={handleAllIn}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-2 sm:py-1.5 sm:px-2.5 md:py-2 md:px-3 lg:py-2.5 lg:px-5 text-xs sm:text-sm md:text-base rounded transition shadow-lg whitespace-nowrap"
        >
          All-In ${playerStack}
        </button>
      </div>

      {/* Quick Bet Buttons */}
      <div className="flex flex-wrap gap-1 justify-center mt-1 sm:mt-1.5 md:mt-2">
        <button
          onClick={() => setRaiseAmount(clamp(minTargetTotal, minTargetTotal, maxTotal))}
          className="bg-gray-700 hover:bg-gray-600 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 md:py-1.5 rounded text-[0.65rem] sm:text-xs md:text-sm"
        >
          Min
        </button>
        <button
          onClick={() => setRaiseAmount(clamp(bigBlind * 3, minTargetTotal, maxTotal))}
          className="bg-gray-700 hover:bg-gray-600 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 md:py-1.5 rounded text-[0.65rem] sm:text-xs md:text-sm"
        >
          3x BB
        </button>
        <button
          onClick={() => {
            const pot = currentBet * 2 // Simplified pot calculation
            setRaiseAmount(clamp(Math.floor(pot), minTargetTotal, maxTotal))
          }}
          className="bg-gray-700 hover:bg-gray-600 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 md:py-1.5 rounded text-[0.65rem] sm:text-xs md:text-sm"
        >
          Pot
        </button>
        <button
          onClick={() => setRaiseAmount(maxTotal)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 md:py-1.5 rounded text-[0.65rem] sm:text-xs md:text-sm"
        >
          All-In
        </button>
      </div>
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  if (max < min) return max
  return Math.min(Math.max(value, min), max)
}
