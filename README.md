# Graph Q&A - Intelligent Knowledge Assistant 🧠

A modern, full-stack application that enables natural language querying of Neo4j graph databases using AI. Ask questions in plain English and get intelligent answers powered by LLMs, with real-time graph visualizations and comprehensive conversation management.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![React](https://img.shields.io/badge/react-19.1+-61DAFB.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Key Features

### 🤖 AI-Powered Natural Language Queries
- **Ask in Plain English**: "Which actors played in Casino?" → Automatic Cypher query generation
- **Intelligent Context Understanding**: Leverages Groq's Llama 3 LLM for accurate query interpretation
- **Schema-Aware**: Automatically adapts to your Neo4j database schema
- **Cypher Transparency**: View the generated Cypher queries to learn and verify

### 📊 Interactive Graph Visualization
- **Real-time Visualization**: See your query results as interactive graphs
- **Powered by vis-network**: Drag, zoom, and explore node relationships
- **Smart Node Detection**: Automatically extracts and displays nodes and relationships
- **Color-Coded**: Different node types (Movie, Person, Genre) have distinct colors
- **Export Options**: Download visualizations as PNG images

### 💬 Advanced Conversation Management
- **Persistent History**: All conversations saved in browser localStorage
- **Time-based Filtering**: View today's, this week's, or all conversations
- **One-Click Restore**: Instantly reload any past conversation with full context
- **Bulk Management**: Clear individual items or entire history

### 🎨 Modern User Experience
- **Glassmorphism Design**: Beautiful frosted-glass aesthetic with animated backgrounds
- **Typing Animation**: Smooth text reveal with skip option for fast reading
- **Toast Notifications**: Real-time feedback for every action
- **Smart Suggestions**: Autocomplete with sample questions and recent queries
- **Keyboard Shortcuts**: 
  - `Ctrl+K` - Focus search
  - `Escape` - Clear/close modals
  - `Ctrl+L` - Clear conversation
  - `Arrow keys` - Navigate suggestions
- **Backend Status Indicator**: Live connection monitoring
- **Multi-stage Loading**: Clear progress indicators during query processing
- **Response Feedback**: Thumbs up/down rating system for answers

### 📤 Export Capabilities
- **JSON**: Machine-readable format for data analysis
- **Markdown**: Human-readable with formatted code blocks
- **PDF**: Professional documents with proper styling and pagination

### 🎯 Sample Questions
The app comes with intelligent sample questions that adapt to your database:
- "How many movies did Tom Hanks act in?"
- "Which actors played in the movie 'Casino'?"
- "List all movies from the 'Comedy' genre"
- "Find people who both directed and acted in the same movie"

## 🏗️ Architecture

```
┌─────────────────────┐                           ┌─────────────────────┐
│   React Frontend    │      HTTP/REST API        │   FastAPI Backend   │
│   (Vite + React)    │ ◄─────────────────────►   │   (Python + async)  │
│                     │                           │                     │
│  • Modern UI/UX     │                           │  • LangChain        │
│  • State Management │                           │  • Pydantic         │
│  • Local Storage    │                           │  • CORS enabled     │
│  • vis-network      │                           │                     │
└─────────────────────┘                           └─────────────────────┘
                                                             │
                                                             │ Neo4j Driver
                                                             ▼
                                                   ┌───────────────────┐
                                                   │   Neo4j Database  │
                                                   │   (Graph Store)   │
                                                   └───────────────────┘
                                                             ▲
                                                             │ GraphCypherQAChain
                                                             │
                                                   ┌───────────────────┐
                                                   │    Groq LLM API   │
                                                   │  (Llama 3 Model)  │
                                                   └───────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **FastAPI**  - Modern, high-performance async web framework
- **LangChain**  - LLM orchestration and chaining
- **LangChain-Neo4j**  - Neo4j integration for LangChain
- **LangChain-Groq**  - Groq LLM provider integration
- **Uvicorn**  - Lightning-fast ASGI server
- **Pydantic**  - Data validation using Python type annotations
- **Python-dotenv**  - Environment variable management

### Frontend
- **React**  - UI library with latest concurrent features
- **Vite**  - Next-generation frontend build tool
- **Tailwind CSS**  - Utility-first CSS framework
- **vis-network**  - Network visualization library
- **jsPDF**  - Client-side PDF generation
- **Custom React Hooks** - useLocalStorage, useKeyboard

### Database & AI
- **Neo4j**  - Graph database (local or Aura cloud)
- **Groq API** - Fast LLM inference (Llama 3 models)

## 📋 Prerequisites

Before you begin, ensure you have:

### Required Software
- **Python 3.10 or higher** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18 or higher** - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/downloads)

### Required Services
- **Neo4j Database** - Choose one:
  - [Neo4j Desktop](https://neo4j.com/download/) (Local installation)
  - [Neo4j Aura](https://neo4j.com/cloud/aura/) (Free cloud tier)
- **Groq API Key** - [Get free API key](https://console.groq.com/)

### System Requirements
- **RAM**: 4GB minimum, 8GB+ recommended
- **Storage**: 2GB free space
- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Aafimalek/graphdb
cd graphdb
```

### Step 2: Backend Setup

#### 2.1 Install Python Dependencies

```bash
# Install all Python dependencies from root
pip install -r requirements.txt
```

#### 2.2 Configure Environment Variables

```bash
# Copy the example file
cp env.example backend/.env

# Edit the .env file with your actual credentials
# Use any text editor:
notepad backend/.env      # Windows
nano backend/.env         # macOS/Linux
```

**Required configuration** in `backend/.env`:

```env
# Neo4j Connection (Local)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_actual_password_here
NEO4J_DATABASE=neo4j

# Neo4j Aura (Cloud) - Use this format instead if using Aura
# NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192

# Alternative Models (uncomment to use):
# GROQ_MODEL=llama3-70b-8192      # More accurate, slightly slower
# GROQ_MODEL=mixtral-8x7b-32768   # Good for complex queries
# GROQ_MODEL=gemma2-9b-it         # Fast alternative model
```

**Important Notes:**
- ⚠️ Never commit the `.env` file to git (it's in `.gitignore`)
- 🔑 Get your Groq API key from [console.groq.com](https://console.groq.com/)
- 🔒 Keep your Neo4j password secure

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Return to root directory
cd ..
```

This installs all frontend dependencies including React, Vite, Tailwind CSS, vis-network, and jsPDF.

### Step 4: Database Setup

#### Option A: Neo4j Desktop (Local)

1. **Download and Install**
   - Download [Neo4j Desktop](https://neo4j.com/download/)
   - Install and launch Neo4j Desktop

2. **Create Database**
   - Click "New" → "Create Project"
   - Click "Add" → "Local DBMS"
   - Name it (e.g., "Movie Graph")
   - Set password (use this in your `.env` file)
   - Version: 5.x (recommended)
   - Click "Create"

3. **Start Database**
   - Click "Start" on your database
   - Wait for status to show "Active"

4. **Load Sample Data**
   - Click "Open" to launch Neo4j Browser
   - In the command bar, type: `:play movies`
   - Follow the interactive guide to load the Movies dataset
   - Click the code blocks to run the Cypher queries

#### Option B: Neo4j Aura (Cloud)

1. **Create Free Account**
   - Go to [Neo4j Aura](https://neo4j.com/cloud/aura/)
   - Sign up for a free account
   - Click "Create Database" → "Free"

2. **Save Credentials**
   - **IMPORTANT**: Download and save the credentials file
   - Note the connection URI (format: `neo4j+s://xxxxx.databases.neo4j.io`)
   - Note the password (you can't retrieve it later!)

3. **Update Configuration**
   - Use the Aura URI in your `backend/.env` file
   - Format: `NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io`

4. **Load Sample Data**
   - Open Neo4j Browser from Aura Console
   - Run: `:play movies`
   - Follow the guide to load data

#### Verify Database Connection

```bash
# From the root directory
cd backend
python -c "from config import settings; from langchain_neo4j import Neo4jGraph; graph = Neo4jGraph(url=settings.NEO4J_URI, username=settings.NEO4J_USERNAME, password=settings.NEO4J_PASSWORD); print('✓ Connected to Neo4j successfully!')"
```

## ⚙️ Running the Application

### Method 1: Using Two Terminals (Recommended)

#### Terminal 1 - Start Backend

```bash
# Navigate to backend directory
cd backend

# Run the FastAPI server
python main.py
```

**Expected output:**
```
Starting FastAPI server on http://127.0.0.1:8000
Access the API docs at http://127.0.0.1:8000/docs
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

The backend will be available at: **http://127.0.0.1:8000**

#### Terminal 2 - Start Frontend

```bash
# Open a NEW terminal
# Navigate to frontend directory
cd frontend

# Run the Vite development server
npm run dev
```

**Expected output:**
```
VITE v7.1.7  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

The frontend will be available at: **http://localhost:5173**

### Method 2: Alternative Backend Start

If you prefer using uvicorn directly:

```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Verifying the Setup

1. **Check Backend Health**
   - Open: http://127.0.0.1:8000
   - Should see: `{"message": "Welcome to the Graph Q&A API!"}`

2. **Check Backend Status**
   - Open: http://127.0.0.1:8000/status
   - Should see JSON with `neo4j_connected: true`

3. **Open Frontend**
   - Open: http://localhost:5173
   - Look for green "Connected" indicator at top
   - Try a sample question

4. **View API Documentation**
   - Swagger UI: http://127.0.0.1:8000/docs
   - ReDoc: http://127.0.0.1:8000/redoc

## 🎯 Using the Application

### Basic Usage

1. **Open the App**
   - Navigate to http://localhost:5173 in your browser
   - Check the green "Backend Connected" indicator at the top

2. **Ask a Question**
   - Click a sample question, or
   - Type your own question in the input box
   - Press Enter or click "Ask"

3. **View Results**
   - **Answer**: Appears with typing animation (click to skip)
   - **Cypher Query**: Toggle the "Show Cypher" button to see the generated query
   - **Graph Visualization**: Click the purple graph icon (📊) if available

### Sample Questions for Movies Database

**Basic Queries:**
- "How many movies are in the database?"
- "List all actors"
- "What movies were released in 1995?"

**Relationship Queries:**
- "Which actors played in Casino?"
- "Who directed The Matrix?"
- "Show me all movies directed by Martin Scorsese"

**Complex Queries:**
- "Find people who both directed and acted in the same movie"
- "Which actors have worked with Tom Hanks?"
- "List movies in the Comedy genre with rating above 7"

**Note**: Graph visualization works best with queries that return nodes and relationships, not just counts or lists.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Focus search input |
| `Escape` | Clear input or close modal |
| `Ctrl+L` / `Cmd+L` | Clear current conversation |
| `Enter` | Submit question |
| `↑` / `↓` | Navigate autocomplete suggestions |

### Features Walkthrough

#### 1. Conversation History
- **Access**: Click the history icon (🕐) in the top-left corner
- **View**: Browse all past conversations
- **Filter**: Today, This Week, This Month, All Time
- **Restore**: Click any conversation to reload it
- **Delete**: Remove individual items or clear all

#### 2. Graph Visualization
- **Trigger**: Appears automatically for compatible queries
- **Icon**: Purple graph icon (📊) next to the answer
- **Features**:
  - Drag nodes to rearrange
  - Zoom with mouse wheel
  - Hover to see properties
  - Double-click node to highlight connections
  - Download as PNG

#### 3. Export Options
- **Access**: Click the quick actions button (⚡) in bottom-right
- **Formats**:
  - **JSON**: Full conversation data
  - **Markdown**: Formatted text with code blocks
  - **PDF**: Professional document with styling

#### 4. Response Feedback
- **Thumbs Up** 👍: Mark helpful answers
- **Thumbs Down** 👎: Mark unhelpful answers
- **Comment**: Optional feedback text
- (Currently logged; can be extended to store in database)

## 📚 API Documentation

### Endpoints

#### `GET /`
Welcome endpoint for API health check.

**Response:**
```json
{
  "message": "Welcome to the Graph Q&A API!",
  "docs": "/docs"
}
```

#### `GET /status`
Check backend services status.

**Response:**
```json
{
  "neo4j_connected": true,
  "neo4j_schema": "Node properties:\nMovie {...}\nPerson {...}...",
  "llm_initialized": true,
  "qa_chain_ready": true,
  "llm_model_name": "llama3-8b-8192"
}
```

#### `POST /ask`
Submit a natural language question.

**Request Body:**
```json
{
  "question": "How many movies did Tom Hanks act in?"
}
```

**Response:**
```json
{
  "answer": "Tom Hanks acted in 12 movies.",
  "generated_cypher": "MATCH (p:Person {name: 'Tom Hanks'})-[:ACTED_IN]->(m:Movie) RETURN count(m)",
  "graph_data": {
    "nodes": [
      {
        "id": "p_1",
        "label": "Tom Hanks",
        "labels": ["Person"],
        "properties": {"name": "Tom Hanks"}
      }
    ],
    "relationships": []
  },
  "error": null
}
```

#### `POST /feedback`
Submit user feedback on answers.

**Request Body:**
```json
{
  "question": "Who directed Casino?",
  "answer": "Martin Scorsese directed Casino.",
  "rating": "positive",
  "comment": "Very helpful!"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Thank you for your feedback!"
}
```

### Using the API Directly

```bash
# Ask a question
curl -X POST http://127.0.0.1:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "How many movies are there?"}'

# Check status
curl http://127.0.0.1:8000/status

# Submit feedback
curl -X POST http://127.0.0.1:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "question": "test",
    "answer": "test",
    "rating": "positive"
  }'
```

## 📁 Project Structure

```
graphdb/
├── backend/
│   ├── main.py              # FastAPI app entry point & endpoints
│   ├── services.py          # GraphQAService with LangChain integration
│   ├── config.py            # Configuration & settings management
│   ├── .env                 # Environment variables (create this!)
│   └── __pycache__/         # Python cache (auto-generated)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Toast.jsx              # Toast notification system
│   │   │   ├── HistorySidebar.jsx     # Conversation history panel
│   │   │   ├── TypingAnimation.jsx    # Animated text reveal
│   │   │   ├── QuickActions.jsx       # Floating action button
│   │   │   └── GraphVisualization.jsx # Interactive graph viewer
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.jsx    # Persistent state hook
│   │   │   └── useKeyboard.jsx        # Keyboard shortcuts hook
│   │   ├── utils/
│   │   │   └── exportUtils.js         # Export to PDF/JSON/MD
│   │   ├── App.jsx          # Main application component
│   │   ├── App.css          # Component styles
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles (Tailwind)
│   ├── public/
│   │   └── vite.svg         # App icon
│   ├── index.html           # HTML template
│   ├── package.json         # Node dependencies
│   ├── package-lock.json    # Locked dependency versions
│   ├── vite.config.js       # Vite configuration
│   ├── eslint.config.js     # ESLint configuration
│   └── node_modules/        # Installed packages (auto-generated)
│
├── experiments/
│   ├── experiments.ipynb    # Jupyter notebook for testing
│   └── promptstatergies.ipynb # Prompt engineering experiments
│
├── requirements.txt         # Python dependencies
├── env.example              # Example environment variables
├── README.md               # This file
├── LICENSE                 # MIT License
└── .gitignore             # Git ignore rules
```

## 🐛 Troubleshooting

### Backend Issues

#### Error: "Failed to connect to Neo4j"

**Symptoms**: Backend returns 500 errors, logs show connection failures

**Solutions**:
1. Verify Neo4j is running:
   - Desktop: Check if database is "Active"
   - Aura: Check cloud console status
2. Verify credentials in `backend/.env`:
   ```bash
   # Test connection
   cd backend
   python -c "from config import settings; print(f'URI: {settings.NEO4J_URI}')"
   ```
3. Check URI format:
   - Local: `bolt://localhost:7687`
   - Aura: `neo4j+s://xxxxx.databases.neo4j.io`
4. Test from Neo4j Browser first

#### Error: "GROQ_API_KEY not found"

**Symptoms**: Backend fails to start, validation error

**Solutions**:
1. Verify `.env` file exists in `backend/` directory
2. Check file contains: `GROQ_API_KEY=your_key_here`
3. No spaces around the `=` sign
4. Get new key from [console.groq.com](https://console.groq.com/)
5. Restart backend after updating

#### Error: "Module not found"

**Symptoms**: `ImportError` or `ModuleNotFoundError`

**Solutions**:
```bash
# Reinstall all dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep -E "(fastapi|langchain|uvicorn)"

# If using virtual environment, ensure it's activated
```

#### Backend won't start on port 8000

**Symptoms**: "Address already in use"

**Solutions**:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# macOS/Linux
lsof -i :8000
kill -9 <process_id>

# Or use a different port
uvicorn main:app --port 8001
```

### Frontend Issues

#### Blank Screen or "Cannot connect to backend"

**Symptoms**: White screen, no UI visible

**Solutions**:
1. Check backend is running: http://127.0.0.1:8000
2. Check browser console (F12) for errors
3. Verify backend URL in `src/App.jsx`:
   ```javascript
   const BACKEND_URL = 'http://127.0.0.1:8000';
   ```
4. Clear browser cache and reload
5. Check for CORS errors (should be enabled by default)

#### Dependencies installation fails

**Symptoms**: `npm install` errors

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# If peer dependency issues
npm install --legacy-peer-deps

# Update npm itself
npm install -g npm@latest
```

#### Graph visualization not appearing

**Symptoms**: No graph icon appears after query

**Solutions**:
1. Check query type - only MATCH queries show graphs
2. Try known working query: "Show me actors in Casino"
3. Check browser console for errors
4. Verify vis-network installed: `npm list vis-network`
5. Count queries won't show graphs (e.g., "How many...")

#### Build fails with Tailwind errors

**Symptoms**: Vite build errors mentioning Tailwind

**Solutions**:
```bash
# Ensure Tailwind plugin is installed
npm install -D @tailwindcss/vite

# Check vite.config.js has:
# import tailwindcss from '@tailwindcss/vite'
# plugins: [react(), tailwindcss()]
```

### Common Issues

#### Slow response times

**Causes & Solutions**:
- **First query slow**: LLM cold start (normal, ~5-10s)
- **All queries slow**: 
  - Check internet connection
  - Try faster model: `GROQ_MODEL=llama3-8b-8192`
  - Check Groq API status
- **Graph queries slow**: Large result sets (limited to 50 nodes)

#### CORS errors in browser console

**Symptoms**: "blocked by CORS policy"

**Solutions**:
1. Verify CORS middleware in `backend/main.py`
2. Should include:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
3. Restart backend after changes

#### Wrong or empty answers

**Causes & Solutions**:
- **Empty database**: Load sample data (`:play movies`)
- **Schema mismatch**: Database has different structure
- **Ambiguous question**: Be more specific
- **LLM confusion**: Try rephrasing the question

#### LocalStorage quota exceeded

**Symptoms**: History not saving

**Solutions**:
```javascript
// Clear history from app UI (History → Clear All)
// Or manually in browser console:
localStorage.clear();
```

## 🤝 Contributing

Contributions are welcome! Here's how to contribute:

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Test thoroughly
6. Commit: `git commit -m 'Add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Contribution Guidelines
- Follow existing code style
- Add comments for complex logic
- Update README if adding features
- Test on multiple browsers/OS if UI changes
- Keep PRs focused on single feature/fix

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No liability
- ❌ No warranty

## 🙏 Acknowledgments

### Technologies
- **[LangChain](https://langchain.com/)** - LLM orchestration framework
- **[Groq](https://groq.com/)** - Fast LLM inference API
- **[Neo4j](https://neo4j.com/)** - Graph database platform
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[React](https://react.dev/)** - UI library
- **[Vite](https://vitejs.dev/)** - Build tool
- **[Tailwind CSS](https://tailwindcss.com/)** - CSS framework
- **[vis-network](https://visjs.github.io/vis-network/)** - Graph visualization

### Inspiration
- Neo4j's example projects
- LangChain documentation and examples
- Modern UI/UX design patterns

## 📧 Support & Contact

### Getting Help
- 📖 **Documentation**: Read this README thoroughly
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Open an issue with [Feature] tag
- 💬 **Questions**: Use GitHub Discussions

### Useful Links
- [Neo4j Documentation](https://neo4j.com/docs/)
- [LangChain Documentation](https://python.langchain.com/)
- [Groq Documentation](https://console.groq.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

**Built with ❤️ using React, FastAPI, Neo4j, LangChain, and Groq AI**

**Last Updated**: November 2025
