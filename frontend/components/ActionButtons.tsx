import React, { useState } from 'react'
import { PlayerAction } from '@/lib/types'

interface ActionButtonsProps {
  currentBet: number
  playerBet: number
  playerStack: number
  onAction: (action: PlayerAction) => void
}

export default function ActionButtons({ 
  currentBet, 
  playerBet, 
  playerStack, 
  onAction 
}: ActionButtonsProps) {
  const [raiseAmount, setRaiseAmount] = useState<number>(currentBet * 2)

  const callAmount = currentBet - playerBet
  const canCheck = playerBet >= currentBet
  const minRaise = currentBet * 2

  const handleFold = () => {
    onAction({ player_id: '', action_type: 'fold', amount: 0 })
  }

  const handleCheck = () => {
    onAction({ player_id: '', action_type: 'check', amount: 0 })
  }

  const handleCall = () => {
    onAction({ player_id: '', action_type: 'call', amount: 0 })
  }

  const handleRaise = () => {
    if (raiseAmount >= minRaise && raiseAmount <= playerStack) {
      onAction({ player_id: '', action_type: 'raise', amount: raiseAmount })
    } else {
      alert(`Raise must be between $${minRaise} and $${playerStack}`)
    }
  }

  const handleBet = () => {
    if (raiseAmount > 0 && raiseAmount <= playerStack) {
      onAction({ player_id: '', action_type: 'bet', amount: raiseAmount })
    } else {
      alert(`Bet must be between $1 and $${playerStack}`)
    }
  }

  const handleAllIn = () => {
    onAction({ player_id: '', action_type: 'all_in', amount: playerStack })
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex flex-wrap gap-3 justify-center items-center">
        
        {/* Fold Button */}
        <button
          onClick={handleFold}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
        >
          Fold
        </button>

        {/* Check/Call Button */}
        {canCheck ? (
          <button
            onClick={handleCheck}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
          >
            Check
          </button>
        ) : (
          <button
            onClick={handleCall}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
          >
            Call ${callAmount}
          </button>
        )}

        {/* Raise/Bet Controls */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(parseInt(e.target.value) || 0)}
            min={currentBet > 0 ? minRaise : 1}
            max={playerStack}
            className="w-32 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black font-bold"
          />
          
          {currentBet > 0 ? (
            <button
              onClick={handleRaise}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
            >
              Raise
            </button>
          ) : (
            <button
              onClick={handleBet}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
            >
              Bet
            </button>
          )}
        </div>

        {/* All-In Button */}
        <button
          onClick={handleAllIn}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
        >
          All-In ${playerStack}
        </button>
      </div>

      {/* Quick Bet Buttons */}
      <div className="flex gap-2 justify-center mt-4">
        <button
          onClick={() => setRaiseAmount(Math.floor(currentBet * 2))}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
        >
          Min
        </button>
        <button
          onClick={() => setRaiseAmount(Math.floor(currentBet * 3))}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
        >
          3x BB
        </button>
        <button
          onClick={() => {
            const pot = currentBet * 2 // Simplified pot calculation
            setRaiseAmount(Math.min(Math.floor(pot), playerStack))
          }}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
        >
          Pot
        </button>
        <button
          onClick={() => setRaiseAmount(playerStack)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
        >
          All-In
        </button>
      </div>
    </div>
  )
}
