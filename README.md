# Pattaka

A powerful **visual workflow automation platform** that helps teams automate repetitive tasks and build complex workflows with an intuitive drag-and-drop interface.

**Automate Your Work, Amplify Your Impact** 🚀

## 🌟 Features

- **🎨 Visual Workflow Builder** - Drag-and-drop interface for creating complex workflows
- **⚡ Real-time Execution** - Monitor workflows as they run with live status updates
- **🔗 100+ Integrations** - Connect with popular tools like Slack, Gmail, Salesforce, and more (coming soon)
- **🚀 Multiple Triggers** - HTTP webhooks, scheduled executions, and manual triggers
- **🛠️ Flexible Actions** - HTTP requests, email notifications, data transformations, and logging
- **👥 Team Collaboration** - Share workflows and collaborate in real-time
- **📊 Advanced Analytics** - Track performance and optimize your automations
- **🔒 Enterprise Security** - SOC 2 compliant with advanced access controls
- **📱 Mobile Ready** - Responsive design that works on all devices

## 🏗️ Architecture

Pattaka is built with a modern tech stack for performance, scalability, and developer experience:

### Frontend

- **React 18** - Modern UI framework with hooks and concurrent features
- **TypeScript** - Type-safe development
- **TanStack Router** - File-based routing with type safety
- **React Flow** - Visual workflow builder with drag-and-drop
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible UI components
- **Vite** - Fast build tool and development server

### Backend

- **Go** - High-performance backend with standard library
- **PostgreSQL** - Reliable, scalable database
- **SQLC** - Type-safe SQL code generation
- **JWT Authentication** - Secure user sessions
- **RESTful API** - Clean, documented API endpoints

### Workflow Engine

- **Custom Engine** - Built for reliability and performance
- **Action System** - Extensible plugin architecture
- **Trigger System** - Multiple trigger types with robust scheduling
- **Execution Tracking** - Detailed logs and performance metrics

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **pnpm**
- **Go 1.21+**
- **PostgreSQL 13+**
- (Optional) **Docker** for easy database setup

### 1. Clone and Setup

```bash
git clone <repository-url>
cd pattaka
make setup
```

### 2. Environment Configuration

```bash
# Copy example environment files
cp frontend/env.example frontend/.env
cp backend/.env.example backend/.env
```

Configure your environment variables:

**Frontend (.env)**:

```env
# API Configuration
VITE_API_URL=http://localhost:8080

# Authentication
VITE_JWT_SECRET=your-jwt-secret-here

# Database (for Better Auth)
DATABASE_URL=postgresql://username:password@localhost:5432/pattaka
```

**Backend (.env)**:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/pattaka

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=8080
CORS_ORIGINS=http://localhost:3000
```

### 3. Database Setup

**Option 1: Docker (Recommended)**

```bash
make db-up  # Starts PostgreSQL container
make db-migrate  # Run database migrations
```

**Option 2: Local PostgreSQL**

```bash
createdb pattaka
make db-migrate
```

### 4. Run Development Servers

**Full development environment:**

```bash
make dev-with-db  # Database + Backend + Frontend
```

**Separate terminals:**

```bash
# Terminal 1 - Backend (http://localhost:8080)
make dev-backend

# Terminal 2 - Frontend (http://localhost:3000)
make dev-frontend
```

## 📋 Available Commands

```bash
make help              # Show all available commands
make setup             # Install all dependencies
make dev-frontend      # Run frontend development server
make dev-backend       # Run backend development server
make dev-with-db       # Run full stack with database
make build-frontend    # Build frontend for production
make build-backend     # Build backend binary
make db-up             # Start PostgreSQL container
make db-down           # Stop PostgreSQL container
make db-migrate        # Run database migrations
make db-reset          # Reset database with fresh migrations
make test-backend      # Run backend tests
make test-frontend     # Run frontend tests
make lint              # Run linters
make clean             # Clean build artifacts
```

## 📁 Project Structure

```
pattaka/
├── frontend/                    # React/TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── builder/         # Workflow builder components
│   │   │   │   ├── workflow-builder.tsx
│   │   │   │   ├── node-types.tsx
│   │   │   │   └── nodes/       # Individual node components
│   │   │   ├── dashboard/       # Dashboard components
│   │   │   ├── auth/           # Authentication components
│   │   │   └── ui/             # Reusable UI components
│   │   ├── routes/             # File-based routing
│   │   ├── services/           # API service layer
│   │   ├── hooks/              # Custom React hooks
│   │   └── stores/             # State management
│   └── package.json
├── backend/                     # Go backend
│   ├── internal/
│   │   ├── handlers/           # HTTP request handlers
│   │   ├── services/           # Business logic layer
│   │   ├── db/                 # Database layer (SQLC)
│   │   ├── workflow/           # Workflow engine
│   │   │   ├── engine.go       # Core execution engine
│   │   │   ├── actions/        # Action implementations
│   │   │   └── triggers/       # Trigger implementations
│   │   └── middleware/         # HTTP middleware
│   ├── migrations/             # Database migrations
│   ├── main.go                 # Application entry point
│   └── go.mod
├── docker-compose.yml          # Development database
├── Makefile                    # Development commands
└── README.md
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Workflows

- `GET /api/workflows` - List user workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/:id` - Get workflow details
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Execute workflow

### Executions

- `GET /api/executions` - List workflow executions
- `GET /api/executions/:id` - Get execution details
- `POST /api/executions/:id/cancel` - Cancel running execution

### Integrations

- `GET /api/integrations` - List available integrations
- `POST /api/integrations` - Create integration
- `GET /api/integrations/:id` - Get integration details

## 🧪 Development

### Adding New Workflow Actions

1. **Create action implementation** in `backend/internal/workflow/actions/`
2. **Register action** in the workflow engine
3. **Add frontend component** in `frontend/src/components/builder/nodes/actions/`
4. **Update node types** in the frontend

### Adding New Integrations

1. **Define integration schema** in `backend/internal/db/queries/integrations.sql`
2. **Implement integration service** in `backend/internal/services/`
3. **Add frontend configuration** in the integration management UI
4. **Test integration** with workflow actions

## 🔒 Security

- **JWT Authentication** with secure token storage
- **CORS Protection** with configurable origins
- **SQL Injection Prevention** using SQLC prepared statements
- **Rate Limiting** on API endpoints
- **Input Validation** and sanitization
- **Secure Headers** and HTTPS enforcement in production

## 🚀 Deployment

### Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy with database
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

```bash
# Build frontend
make build-frontend

# Build backend binary
make build-backend

# Run database migrations
make db-migrate

# Start services with process manager
pm2 start ecosystem.config.js
```
