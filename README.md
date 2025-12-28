# Poker Trainer - 9-Max No Limit Hold'em

A full-stack poker training application featuring 9-max No Limit Hold'em with AI opponents using CFR (Counterfactual Regret Minimization) algorithm.

## 🎮 Features

- **9-Max No Limit Hold'em**: Full ring poker game with up to 9 players
- **Real-time Updates**: WebSocket-based synchronization for all players
- **AI Engine**: CFR algorithm implementation for intelligent AI opponents
- **Modern UI**: Built with Next.js and Tailwind CSS
- **Fast Backend**: FastAPI with async support
- **Hand History**: Optional PostgreSQL database for storing hand history

## 📖 Documentation

すべてのドキュメントは`docs/`ディレクトリに配置されています。

- **[docs/RULES.md](docs/RULES.md)**: Complete poker rules and game mechanics documentation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System architecture and design decisions
- **[docs/API.md](docs/API.md)**: API endpoint documentation
- **[docs/BACKEND_START.md](docs/BACKEND_START.md)**: Backend setup and development guide
- **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)**: Contribution guidelines
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Deployment instructions
- **[docs/ISSUES.md](docs/ISSUES.md)**: Known issues and fixes

詳細は[docs/README.md](docs/README.md)を参照してください。

## 🏗️ Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js (React) + TypeScript | 9-max table rendering with modern UI |
| **Backend** | FastAPI (Python) | Async API server and game logic management |
| **Real-time** | WebSockets | Player action synchronization |
| **AI Engine** | NumPy / PyTorch | CFR algorithm implementation |
| **Database** | PostgreSQL (Optional) | Hand history storage |

## 📁 Project Structure

```
poker-trainer/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── game/
│   │   └── poker_game.py      # Core poker game logic
│   ├── ai/
│   │   └── cfr_engine.py      # CFR AI implementation
│   ├── models/
│   │   └── game_state.py      # Pydantic models
│   └── database/
│       ├── models.py           # SQLAlchemy models
│       └── db.py               # Database connection
└── frontend/
    ├── pages/
    │   ├── index.tsx           # Main game page
    │   └── _app.tsx            # App wrapper
    ├── components/
    │   ├── PokerTable.tsx      # Main table component
    │   ├── PlayerSeat.tsx      # Player seat component
    │   └── ActionButtons.tsx   # Action buttons
    ├── lib/
    │   └── types.ts            # TypeScript types
    └── styles/
        └── globals.css         # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL (optional, for hand history)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. (Optional) Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Start the FastAPI server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎯 How to Play

1. Open `http://localhost:3000` in your browser
2. Enter your name and click "Create & Join Table"
3. Wait for other players to join or click "Start Hand" to begin
4. Use the action buttons to play:
   - **Fold**: Discard your hand
   - **Check**: Pass the action (when no bet)
   - **Call**: Match the current bet
   - **Raise/Bet**: Increase the bet
   - **All-In**: Bet all your chips

## 🤖 AI Features

The application includes a CFR (Counterfactual Regret Minimization) based AI engine:

- **Adaptive Strategy**: AI learns optimal play over time
- **Configurable Aggression**: Adjust AI playing style
- **Hand Evaluation**: NumPy-based hand strength calculation
- **Decision Making**: Strategy based on game theory

## 🔌 API Endpoints

### REST API

- `GET /` - Health check
- `POST /api/tables/create` - Create a new table
- `GET /api/tables/{table_id}/state` - Get table state
- `POST /api/tables/{table_id}/join` - Join a table
- `POST /api/tables/{table_id}/action` - Process player action
- `POST /api/tables/{table_id}/start` - Start a new hand
- `DELETE /api/tables/{table_id}` - Delete a table

### WebSocket

- `ws://localhost:8000/ws/{table_id}` - Real-time game updates

## 🗄️ Database (Optional)

To enable hand history storage:

1. Install and start PostgreSQL
2. Create a database:
```sql
CREATE DATABASE poker_trainer;
```

3. Update `.env` with your database credentials
4. Initialize tables (handled automatically by SQLAlchemy)

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🛠️ Development

### Backend Development
- FastAPI auto-reloads on file changes
- API docs available at `/docs` (Swagger UI)
- Alternative docs at `/redoc` (ReDoc)

### Frontend Development
- Next.js fast refresh for instant updates
- TypeScript for type safety
- Tailwind CSS for styling

## 📚 Technologies Used

### Backend
- **FastAPI**: Modern, fast web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation
- **SQLAlchemy**: ORM for database
- **NumPy**: Numerical computing
- **PyTorch**: Deep learning (optional, for advanced AI)

### Frontend
- **Next.js**: React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS
- **WebSocket API**: Real-time communication

## 🎨 UI Components

The UI uses a custom poker table design with:
- Responsive 9-max table layout
- Player seats with positions
- Dealer, small blind, and big blind indicators
- Community cards display
- Action buttons with betting controls
- Real-time chip and pot updates

## 🔐 Security Considerations

- Input validation on all endpoints
- WebSocket connection management
- SQL injection prevention (SQLAlchemy ORM)
- CORS configuration for frontend access

## 📈 Future Enhancements

- [ ] Multi-table tournaments
- [ ] Advanced AI training with neural networks
- [ ] Player statistics and analytics
- [ ] Replay hand history viewer
- [ ] Mobile responsive design
- [ ] Chat functionality
- [ ] Customizable avatars
- [ ] Sound effects and animations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- PokerEngine library for poker game utilities
- CFR algorithm research papers
- FastAPI and Next.js communities

## 📞 Support

For issues or questions, please open an issue on GitHub.