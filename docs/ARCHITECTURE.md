# Architecture Documentation

## System Overview

The Poker Trainer is a full-stack web application built with a modern microservices architecture, featuring real-time communication via WebSockets.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Next.js Frontend (Port 3000)                  │  │
│  │  - React Components (TypeScript)                      │  │
│  │  - Tailwind CSS Styling                               │  │
│  │  - WebSocket Client                                   │  │
│  │  - State Management                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                    HTTP/WebSocket                            │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                   API GATEWAY LAYER                          │
├──────────────────────────┼───────────────────────────────────┤
│                          │                                   │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │         FastAPI Backend (Port 8000)                   │  │
│  │  - REST API Endpoints                                 │  │
│  │  - WebSocket Handlers                                 │  │
│  │  - CORS Middleware                                    │  │
│  │  - Request Validation (Pydantic)                      │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                        │
├─────────────────────────┼────────────────────────────────────┤
│                         │                                    │
│  ┌──────────────────────▼──────────┐                        │
│  │      Game Engine                 │                        │
│  │  - Poker Game Logic              │                        │
│  │  - Card Deck Management          │                        │
│  │  - Player State                  │                        │
│  │  - Betting Rounds                │                        │
│  │  - Hand Evaluation               │                        │
│  └──────────────────────┬──────────┘                        │
│                         │                                    │
│  ┌──────────────────────▼──────────┐                        │
│  │      AI Engine (CFR)             │                        │
│  │  - Strategy Calculation          │                        │
│  │  - Regret Minimization           │                        │
│  │  - Action Selection              │                        │
│  │  - NumPy Computations            │                        │
│  └──────────────────────┬──────────┘                        │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────┐
│                   DATA LAYER (Optional)                      │
├─────────────────────────┼────────────────────────────────────┤
│                         │                                    │
│  ┌──────────────────────▼──────────┐                        │
│  │      PostgreSQL Database         │                        │
│  │  - Hand History                  │                        │
│  │  - Player Statistics             │                        │
│  │  - Game Analytics                │                        │
│  │  - Session Data                  │                        │
│  └─────────────────────────────────┘                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (Next.js)

**Technology Stack:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- WebSocket API

**Key Components:**
```
frontend/
├── pages/
│   ├── index.tsx          # Main game page
│   └── _app.tsx           # App wrapper
├── components/
│   ├── PokerTable.tsx     # 9-max table layout
│   ├── PlayerSeat.tsx     # Individual player display
│   └── ActionButtons.tsx  # Player action controls
├── lib/
│   ├── types.ts           # TypeScript definitions
│   └── utils.ts           # Utility functions
└── styles/
    └── globals.css        # Global styles
```

**Responsibilities:**
- Render 9-max poker table UI
- Display player positions and cards
- Handle user interactions
- Manage WebSocket connections
- Update UI in real-time

### Backend (FastAPI)

**Technology Stack:**
- FastAPI
- Uvicorn (ASGI server)
- Python 3.9+
- Pydantic (validation)
- WebSockets

**Key Modules:**
```
backend/
├── main.py                # FastAPI app & endpoints
├── game/
│   └── poker_game.py     # Game engine
├── ai/
│   └── cfr_engine.py     # AI logic
├── models/
│   └── game_state.py     # Data models
├── database/
│   ├── models.py         # SQLAlchemy models
│   └── db.py             # DB connection
└── tests/
    └── test_poker_game.py
```

**Responsibilities:**
- Handle HTTP requests
- Manage WebSocket connections
- Coordinate game state
- Process player actions
- Validate inputs
- Broadcast updates

### Game Engine

**Core Classes:**
- `PokerGame`: Main game coordinator
- `Player`: Player state and actions
- `Deck`: Card deck management
- `Card`: Individual card representation

**Game Flow:**
1. Create table with blinds configuration
2. Add players to table (up to 9)
3. Start new hand
4. Post blinds (SB, BB)
5. Deal hole cards
6. Betting rounds (Preflop, Flop, Turn, River)
7. Showdown and winner determination
8. Distribute pot
9. Reset for next hand

### AI Engine (CFR)

**Algorithm:** Counterfactual Regret Minimization

**Components:**
- `CFRAgent`: Core CFR implementation
- `PokerAI`: AI player wrapper
- `HandEvaluator`: Hand strength calculation

**Features:**
- Regret matching for strategy
- Action probability distribution
- Information set abstraction
- Adaptive learning

## Data Flow

### REST API Flow
```
User Action → Frontend
    ↓
HTTP POST Request → Backend API
    ↓
Validate Request → Game Engine
    ↓
Update Game State → Database (optional)
    ↓
Return Response → Frontend
    ↓
Update UI
```

### WebSocket Flow
```
Player Connects → WebSocket Handler
    ↓
Subscribe to Table → Connection Manager
    ↓
Game State Change → Broadcast to All
    ↓
All Clients Receive Update
    ↓
Update UI in Real-time
```

## Deployment

### Docker Compose
```yaml
services:
  - postgres (Port 5432)
  - backend (Port 8000)
  - frontend (Port 3000)
```

### Environment Variables
```
Backend:
  - DATABASE_URL
  - SECRET_KEY
  - DEBUG

Frontend:
  - NEXT_PUBLIC_API_URL
  - NEXT_PUBLIC_WS_URL
```

## Security Considerations

1. **Input Validation**: Pydantic models validate all inputs
2. **CORS**: Configured for frontend origin
3. **SQL Injection**: SQLAlchemy ORM prevents SQL injection
4. **WebSocket**: Connection management and cleanup
5. **Rate Limiting**: Can be added via middleware

## Scalability

### Current Limitations
- In-memory game state (single server)
- No session persistence
- No load balancing

### Future Improvements
- Redis for distributed state
- Message queue (RabbitMQ/Kafka)
- Horizontal scaling with load balancer
- Database connection pooling
- Caching layer

## Performance

### Backend
- Async/await for I/O operations
- Fast JSON serialization
- Efficient data structures
- NumPy for matrix operations

### Frontend
- React hooks for state management
- Memoization for expensive renders
- Lazy loading components
- Optimized re-renders

## Monitoring & Logging

### Backend Logging
- Uvicorn access logs
- Application logs
- Error tracking

### Frontend Logging
- Console logging
- Error boundaries
- WebSocket status

## Testing Strategy

### Backend Tests
- Unit tests (pytest)
- Integration tests
- API endpoint tests
- WebSocket tests

### Frontend Tests
- Component tests (Jest)
- Integration tests
- E2E tests (Cypress)

## API Documentation

Interactive documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
