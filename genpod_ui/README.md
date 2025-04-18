# GenPod UI - AI-Powered Development Interfaces 

## 📖 Project Overview

GenPod UI is a modern, AI-powered development interface that provides real-time code analysis, chat assistance, and interactive development tools. It's designed to enhance developer productivity through intelligent code suggestions, real-time file monitoring, and seamless integration with AI agents.

### Core Features
- Real-time AI-assisted code development
- Interactive Monaco-based code editor
- Live file system monitoring
- Streaming log visualization
- Configuration management
- Performance metrics dashboard
- AI-powered chat interface

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **UI Library**: React 19
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4
- **Code Editor**: Monaco Editor
- **UI Components**:
  - Headless UI
  - Framer Motion
  - Lucide React
- **Real-time Communication**:
  - Server-Sent Events (SSE)
  - gRPC for agent communication
- **Markdown**: React Markdown with GFM support

## 📁 App Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── LeftPanel/        # File tree and navigation
│   ├── RightPanel/       # Main content area
│   ├── layouts/          # Layout components
│   └── auth/             # Authentication components
├── state/                # Zustand state management
│   ├── fileStore.ts      # File content and SSE management
│   ├── logStore.ts       # Log state management
│   └── logStream.ts      # Log streaming utilities
├── styles/               # Global styles
└── types/                # TypeScript type definitions
```

## 🧩 Key Functional Tabs

### 1. Code Tab
- Monaco-based code editor with syntax highlighting
- Real-time file content streaming via SSE
- File tree navigation
- Tab-based file management

### 2. Chat Tab
- Real-time conversation with Gemini AI
- gRPC-based message streaming
- Context-aware code suggestions
- Interactive debugging assistance

### 3. Logs Tab
- Real-time log streaming
- Log filtering and search
- Performance metrics visualization

### 4. Configure Tab
- Environment variable management
- Settings configuration
- Prompt management

### 5. Preview Tab
- Live code preview
- Output visualization
- Result analysis

### 6. Insights Tab
- AI-generated code analysis
- Performance recommendations
- Code quality metrics

## 🚀 Running the App

### Prerequisites
- Node.js v18 or higher
- npm or yarn

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_PROJECT_ROOT=/path/to/your/project
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## 🔌 Integration

### Backend Communication
- **SSE**: Real-time file content and log streaming
- **gRPC**: Agent communication and chat
- **REST API**: Settings and configuration

### State Management
- **Zustand Stores**:
  - `fileStore`: Manages file content and SSE connections
  - `logStore`: Handles log state and streaming
  - `logStream`: Utilities for log streaming

## 📸 UI Highlights

*Screenshots to be added*

## 📄 License

This project is proprietary software. All rights reserved.

