import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import PokerTable from '@/components/PokerTable'
import { GameState, PlayerAction } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [tableId, setTableId] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string>('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Create a new table
  const createTable = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tables/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          small_blind: 5,
          big_blind: 10,
          starting_stack: 1000
        })
      })
      const data = await response.json()
      setTableId(data.table_id)
      return data.table_id
    } catch (error) {
      console.error('Failed to create table:', error)
    }
  }

  // Join a table
  const joinTable = async (tid: string, name: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tables/${tid}/join?player_name=${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setPlayerId(data.player_id)
      return data.player_id
    } catch (error) {
      console.error('Failed to join table:', error)
    }
  }

  // Connect to WebSocket
  const connectWebSocket = useCallback((tid: string) => {
    const websocket = new WebSocket(`${WS_URL}/ws/${tid}`)
    
    websocket.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }
    
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      console.log('Received message:', message)
      
      if (message.state) {
        setGameState(message.state)
      }
    }
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    }
    
    setWs(websocket)
    
    return () => {
      websocket.close()
    }
  }, [])

  // Handle player action
  const handleAction = async (action: PlayerAction) => {
    if (!tableId || !playerId) return

    try {
      const response = await fetch(`${API_URL}/api/tables/${tableId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          action_type: action.action_type,
          amount: action.amount
        })
      })
      const data = await response.json()
      if (data.state) {
        setGameState(data.state)
      }
    } catch (error) {
      console.error('Failed to process action:', error)
    }
  }

  // Start a new hand
  const startHand = async () => {
    if (!tableId) return

    try {
      const response = await fetch(`${API_URL}/api/tables/${tableId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.state) {
        setGameState(data.state)
      }
    } catch (error) {
      console.error('Failed to start hand:', error)
    }
  }

  // Initialize game
  const handleStart = async () => {
    if (!playerName) {
      alert('Please enter your name')
      return
    }

    const tid = await createTable()
    if (tid) {
      await joinTable(tid, playerName)
      connectWebSocket(tid)
    }
  }

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [ws])

  return (
    <>
      <Head>
        <title>Poker Trainer - 9-Max NLHE</title>
        <meta name="description" content="9-Max No Limit Hold'em Poker Trainer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 p-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-center text-white mb-8">
            9-Max No Limit Hold'em
          </h1>

          {!tableId ? (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Join Game</h2>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleStart}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Create & Join Table
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-white">
                  <p>Table ID: {tableId}</p>
                  <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
                </div>
                {gameState?.phase === 'waiting' && (
                  <button
                    onClick={startHand}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
                  >
                    Start Hand
                  </button>
                )}
              </div>

              {gameState ? (
                <PokerTable
                  gameState={gameState}
                  playerId={playerId}
                  onAction={handleAction}
                />
              ) : (
                <div className="text-center text-white text-xl">
                  Loading game state...
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
