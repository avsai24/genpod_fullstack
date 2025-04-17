# GenPod - AI-Powered Development Environment

## 📖 Project Overview

GenPod is an enterprise-grade AI-powered development environment that combines the power of large language models (LLMs) with real-time code analysis, streaming logs, and interactive development tools. It's designed for AI engineers and developers who need an intelligent, integrated workspace for building and deploying AI applications.

### Core Functionality
- Real-time AI-assisted code development and analysis
- Streaming log monitoring and analysis
- Interactive code editing with Monaco Editor
- gRPC-based agent communication
- Server-Sent Events (SSE) for real-time updates
- Secure configuration management
- Gemini AI integration for intelligent assistance

## 🚀 Features

- **AI-Powered Chat Interface**
  - Real-time conversation with Gemini AI
  - Context-aware code suggestions
  - Interactive debugging assistance

- **Advanced Code Editor**
  - Monaco-based code viewer and editor
  - Syntax highlighting and code completion
  - Real-time code analysis

- **Real-time Monitoring**
  - Live log streaming
  - Performance metrics visualization
  - System status monitoring

- **Configuration Management**
  - Secure prompt management
  - Environment variable configuration
  - Settings persistence

- **File Management**
  - Real-time file streaming
  - Secure file operations
  - Project structure visualization

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.2.4
- **State Management**: Zustand
- **UI Components**: 
  - Headless UI
  - Framer Motion
  - Lucide React
- **Code Editor**: Monaco Editor
- **Styling**: Tailwind CSS 4
- **Markdown**: React Markdown with GFM support

### Backend
- **Framework**: FastAPI
- **Communication**: 
  - gRPC for agent communication
  - Server-Sent Events (SSE) for real-time updates
- **Security**: Cryptography for secure operations
- **Database**: SQLite for settings storage

### AI Integration
- **LLM**: Google Gemini
- **API**: Google Generative AI SDK

## 🗂 Folder Structure

```
genpod_UI/
├── genpod_ui/                 # Frontend application
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/       # React components
│   │   ├── state/           # Zustand state management
│   │   ├── styles/          # CSS and Tailwind
│   │   └── types/           # TypeScript types
│   ├── protos/              # gRPC protocol definitions
│   └── public/              # Static assets
│
└── genpod_backend/          # Backend services
    ├── server/
    │   ├── api/            # FastAPI routes
    │   ├── services/       # Business logic
    │   └── protos/         # gRPC service definitions
    └── logs/              # Application logs
```

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+
- Google Gemini API key

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd genpod_ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_PROJECT_ROOT=/path/to/your/project
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd genpod_backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` with:
   ```
   GEMINI_API_KEY=your_api_key
   FERNET_SECRET=your_fernet_key
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

## 🔐 Environment Variables

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_PROJECT_ROOT`: Absolute path to project root

### Backend (.env)
- `GEMINI_API_KEY`: Google Gemini API key
- `FERNET_SECRET`: Encryption key for secure operations

## 📡 gRPC + SSE Integration

The system uses a hybrid communication approach:
- **gRPC**: For structured, bidirectional communication between the frontend and AI agents
- **SSE**: For real-time streaming of logs, metrics, and file updates

### Key Features
- Real-time log streaming
- Live file system updates
- Performance metrics streaming
- Agent status updates

## 📦 LLM Integration

The system integrates with Google's Gemini AI through:
- Direct API calls for chat interactions
- Streaming responses for real-time feedback
- Context-aware code analysis
- Intelligent debugging assistance

## 🧩 Modules / Tabs

1. **Chat**
   - Interactive AI conversation
   - Code suggestions and analysis
   - Context-aware assistance

2. **Code**
   - Monaco-based code editor
   - Syntax highlighting
   - Real-time analysis

3. **Metrics**
   - Performance monitoring
   - Resource utilization
   - System health

4. **Logs**
   - Real-time log streaming
   - Log analysis
   - Filtering and search

5. **Preview**
   - Live code preview
   - Output visualization
   - Result analysis

6. **Configure**
   - Prompt management
   - Settings configuration
   - Environment variables

7. **Insights**
   - AI-generated insights
   - Code analysis
   - Performance recommendations

## 🧭 Roadmap

- Enhanced AI code generation capabilities
- Multi-agent collaboration support
- Advanced debugging tools
- Custom plugin system
- Enhanced security features
- Cloud deployment options

## 📄 License

This project is proprietary software. All rights reserved.

---

<<<<<<< HEAD
*Note: This documentation is based on the current state of the codebase and may be updated as the project evolves.* 
=======
*Note: This documentation is based on the current state of the codebase and may be updated as the project evolves.* 
>>>>>>> aa161b1cfb50df1ad1ab591e538219bcf65c9c9a
