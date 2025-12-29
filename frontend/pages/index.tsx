import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import PokerTable from '@/components/PokerTable'
import { GameState, PlayerAction } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export default function Home() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [tableId, setTableId] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string>('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Get tableId from URL query parameter
  useEffect(() => {
    const { tableId: urlTableId } = router.query
    if (urlTableId && typeof urlTableId === 'string') {
      setTableId(urlTableId)
    }
  }, [router.query])

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
      const tid = data.table_id
      setTableId(tid)
      // Update URL with table ID
      router.push(`/?tableId=${tid}`, undefined, { shallow: true })
      return tid
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

  // Add AI player
  const addAIPlayer = async () => {
    if (!tableId) return

    try {
      const response = await fetch(`${API_URL}/api/tables/${tableId}/add-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.detail || errorData.message || 'Failed to add AI player'
        alert(errorMessage)
        console.error('Failed to add AI player:', errorMessage)
        return
      }

      const data = await response.json()
      console.log('AI player added:', data)
    } catch (error) {
      console.error('Failed to add AI player:', error)
      alert('Failed to add AI player. Please check the console for details.')
    }
  }

  // Connect to WebSocket
  const connectWebSocket = useCallback((tid: string, pid: string | null = null) => {
    const websocket = new WebSocket(`${WS_URL}/ws/${tid}`)
    
    websocket.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }
    
    websocket.onmessage = async (event) => {
      const message = JSON.parse(event.data)
      console.log('Received message:', message)
      
      if (message.state) {
        // Fetch state with player_id to get hole cards
        if (pid) {
          try {
            const response = await fetch(`${API_URL}/api/tables/${tid}/state?player_id=${pid}`)
            const data = await response.json()
            setGameState(data)
          } catch (error) {
            console.error('Failed to fetch state with hole cards:', error)
            setGameState(message.state)
          }
        } else {
          setGameState(message.state)
        }
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
      if (!response.ok) {
        const errorMessage = data?.detail || data?.message || 'Failed to process action'
        alert(errorMessage)
        console.error('Failed to process action:', errorMessage)
        return
      }
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

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.detail || errorData.message || 'Failed to start hand'
        alert(errorMessage)
        console.error('Failed to start hand:', errorMessage)
        return
      }

      const data = await response.json()
      if (data.state) {
        setGameState(data.state)
      }
    } catch (error) {
      console.error('Failed to start hand:', error)
      alert('Failed to start hand. Please check the console for details.')
    }
  }

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    if (!tableId || typeof window === 'undefined') return

    const url = window.location.origin + `/?tableId=${tableId}`

    try {
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy URL to clipboard')
    }
  }

  // Initialize game
  const handleStart = async () => {
    if (!playerName) {
      alert('Please enter your name')
      return
    }

    let tid = tableId

    // If no tableId, create a new table
    if (!tid) {
      tid = await createTable()
    }

    if (tid) {
      const pid = await joinTable(tid, playerName)
      if (pid) {
        // Fetch initial game state
        try {
          const response = await fetch(`${API_URL}/api/tables/${tid}/state${pid ? `?player_id=${pid}` : ''}`)
          const data = await response.json()
          setGameState(data)
        } catch (error) {
          console.error('Failed to fetch initial state:', error)
        }
        connectWebSocket(tid, pid)
      }
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

      <main className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 p-1 sm:p-2 md:p-3">
        <div className="container mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white mb-1 sm:mb-2 md:mb-3 lg:mb-4">
            9-Max No Limit Hold&apos;em
          </h1>

          {!tableId ? (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Join Game</h2>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    handleStart()
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleStart}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Create & Join Table
              </button>
            </div>
          ) : !playerId ? (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Join Existing Table</h2>
              <p className="text-gray-600 mb-4">Table ID: {tableId}</p>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    handleStart()
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleStart}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition mb-3"
              >
                Join Table
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setTableId(null)
                  router.push('/', undefined, { shallow: true })
                }}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Create New Table
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 sm:mb-2 gap-1 sm:gap-2">
                <div className="text-white text-[0.65rem] sm:text-xs md:text-sm">
                  <p>Table ID: {tableId}</p>
                  <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={copyToClipboard}
                    className={`${copySuccess ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-700'} text-white font-bold py-1 px-2 sm:py-1.5 sm:px-3 md:py-2 md:px-4 text-xs sm:text-sm md:text-base rounded transition`}
                  >
                    {copySuccess ? 'Copied!' : 'Share'}
                  </button>
                  <button
                    onClick={addAIPlayer}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-2 sm:py-1.5 sm:px-3 md:py-2 md:px-4 text-xs sm:text-sm md:text-base rounded transition"
                  >
                    Add AI Player
                  </button>
                  {gameState?.phase === 'waiting' && (
                    <button
                      onClick={startHand}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:py-1.5 sm:px-3 md:py-2 md:px-4 text-xs sm:text-sm md:text-base rounded transition"
                    >
                      Start Hand
                    </button>
                  )}
                </div>
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
