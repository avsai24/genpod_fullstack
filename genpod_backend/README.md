# GenPod Backend - AI Agent Server

## 📖 Backend Overview

The GenPod Backend is a Python-based server that powers the GenPod development environment. It provides real-time file monitoring, AI agent communication, and streaming capabilities through a combination of FastAPI, gRPC, and Server-Sent Events (SSE).

### Core Functionality
- Real-time file system monitoring
- gRPC-based agent communication
- Server-Sent Events for live updates
- Gemini AI integration
- Secure configuration management
- Log streaming and analysis

## 🛠️ Tech Stack

- **Framework**: FastAPI
- **Communication**:
  - gRPC (grpcio, protobuf)
  - Server-Sent Events (SSE)
- **File Monitoring**: Watchdog
- **AI Integration**: Google Gemini API
- **Security**: Cryptography
- **Database**: SQLite
- **Python Version**: 3.10+

## 📁 Services / Modules

```
server/
├── agent_server.py        # gRPC service implementation
├── agent_pb2.py          # Generated gRPC protocol buffers
├── agent_pb2_grpc.py     # Generated gRPC service stubs
├── crypto_utils.py       # Encryption utilities
└── api/
    ├── files.py          # File management endpoints
    ├── settings.py       # Configuration endpoints
    ├── logs.py          # Log streaming endpoints
    └── prompt_routes.py  # Prompt management
```

## 🔑 Key Features

### 1. gRPC Agent Service
- Bidirectional streaming for agent communication
- Real-time file system updates
- Project structure management
- Chat message streaming

### 2. File System Monitoring
- Real-time file change detection
- SSE broadcasting of updates
- Project tree generation
- File content streaming

### 3. Log Management
- Real-time log streaming
- Log file management
- Performance metrics collection

### 4. Configuration Management
- Secure settings storage
- Environment variable management
- Prompt template management

## 🚀 Setup & Running

### Prerequisites
- Python 3.10+
- pip

### Installation
1. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create `.env`:
   ```
   GEMINI_API_KEY=your_api_key
   FERNET_SECRET=your_fernet_key
   ```

4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

## 📡 gRPC Integration

### Protocol Definition
The gRPC service is defined in `protos/agent.proto` with two main services:

1. **ChatService**
   - `SendMessageStream`: Bidirectional streaming for chat

2. **AgentService**
   - `StreamData`: Server streaming for file updates

### Generating gRPC Files
To regenerate gRPC files after modifying the proto definition:
```bash
python -m grpc_tools.protoc \
  -I=protos \
  --python_out=server \
  --grpc_python_out=server \
  protos/agent.proto
```

## 🔄 Live Streaming Architecture

```
File Change → Watchdog → Broadcast via SSE → Frontend Monaco
```

1. **File System Monitoring**
   - Watchdog detects file changes
   - Changes are processed and formatted
   - Updates are broadcast to connected clients

2. **SSE Implementation**
   - Per-file SSE connections
   - Real-time content updates
   - Connection management

3. **gRPC Streaming**
   - Bidirectional chat streaming
   - File system updates
   - Agent status updates

## 🔐 Security

- Environment variables encryption
- Secure API key management
- gRPC authentication
- File system access control

## 📄 License

This project is proprietary software. All rights reserved. 