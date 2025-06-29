# Voltig

A full-stack application combining **Better Auth** with a **Go backend** and **TanStack Start frontend**.

## Tech Stack

### Frontend

- **TanStack Start** - Full-stack React framework
- **Better Auth** - Modern authentication library
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool

### Backend

- **Go** - Standard library only
- **PostgreSQL** - Database (via better-auth)

## Features

- 🔐 **Authentication**: Email/password and Google OAuth with secure session encryption
- 🚀 **Modern Stack**: TanStack Start + Go
- 🎨 **Beautiful UI**: Tailwind CSS with responsive design
- 🔒 **Secure**: Better Auth with PostgreSQL and encrypted session storage
- ⚡ **Fast**: Vite + Go standard library
- 🍪 **Cookie Support**: Secure cookie handling for session management

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Go 1.21+
- PostgreSQL database
- (Optional) tmux for running both servers

### 1. Clone and Setup

```bash
git clone <your-repo>
cd voltig
make setup
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp frontend/env.example frontend/.env
```

Edit `frontend/.env`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/voltig

# Better Auth - Use a secure random secret for session encryption
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API URL
BACKEND_URL=http://localhost:8080
```

**Important**: Generate a secure secret for production:

```bash
# Generate a secure 32-byte base64 encoded secret
openssl rand -base64 32
```

### 3. Database Setup

**Option 1: Docker (Recommended)**

```bash
# Start PostgreSQL with Docker
make db-up

# Copy Docker environment file
cp frontend/env.docker frontend/.env
```

**Option 2: Local PostgreSQL**
Create a PostgreSQL database manually and configure your `.env` file with the connection details.

### 4. Run Development Servers

**Option 1: Full development environment with database**

```bash
make dev-with-db  # Starts database + both servers
```

**Option 2: Both servers with tmux**

```bash
make dev-all
```

**Option 3: Separate terminals**

```bash
# Terminal 1 - Backend (http://localhost:8080)
make dev-backend

# Terminal 2 - Frontend (http://localhost:3000)
make dev
```

## Available Commands

```bash
make help           # Show all available commands
make setup          # Install frontend dependencies
make dev            # Run frontend development server
make dev-backend    # Run backend development server
make dev-all        # Run both servers (requires tmux)
make build          # Build frontend for production
make build-backend  # Build backend binary
make clean          # Clean build artifacts
make test-backend   # Test backend API endpoints
```

## Project Structure

```
voltig/
├── frontend/                 # TanStack Start frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts          # Better Auth server config
│   │   │   │   ├── auth-client.ts   # Better Auth client
│   │   │   │   └── auth-middleware.ts # Authentication middleware
│   │   ├── routes/          # File-based routing
│   │   │   ├── api/         # API routes
│   │   │   ├── index.tsx    # Home page
│   │   │   ├── login.tsx    # Login page
│   │   │   └── signup.tsx   # Signup page
│   │   └── styles/          # CSS files
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Go backend
│   ├── main.go              # Main server file
│   ├── utils/
│   │   └── utils.go         # Session validation utilities
│   └── go.mod
├── MAKEFILE                 # Development commands
└── README.md
```

## API Endpoints

### Backend (Go) - Port 8080

- `GET /api/health` - Health check
- `GET /api/users/me` - Get current user
- `POST /api/users` - Create user

### Frontend (Better Auth) - Port 3000

- `POST /api/auth/sign-in/email` - Email sign in
- `POST /api/auth/sign-up/email` - Email sign up
- `GET /api/auth/sign-in/google` - Google OAuth
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get session

## Authentication Flow

1. **Frontend**: User interacts with login/signup forms
2. **Better Auth**: Handles authentication logic and database operations with secure session encryption
3. **Session Storage**: Sessions are encrypted and stored in PostgreSQL database
4. **Cookie Management**: Secure HTTP-only cookies are used for session tokens
5. **Go Backend**: Validates session tokens and provides additional API endpoints

## Security Features

- **Session Encryption**: All sessions are encrypted using BETTER_AUTH_SECRET
- **Secure Cookies**: HTTP-only, secure cookies with proper SameSite settings
- **Database Storage**: Sessions stored securely in PostgreSQL
- **Rate Limiting**: Built-in rate limiting for authentication endpoints
- **CORS Protection**: Proper CORS configuration for cross-origin requests

## Development

### Adding New Routes

**Frontend (TanStack Start)**:
Create files in `frontend/src/routes/` - they're automatically added to the router.

**Backend (Go)**:
Add new handlers in `backend/main.go` and register them with the mux.

### Database Schema

Better Auth automatically creates and manages the required tables:

- `user` - User accounts
- `session` - User sessions (encrypted)
- `account` - OAuth accounts
- `verification` - Email verification tokens

## Production Deployment

1. **Generate a secure secret**:

   ```bash
   openssl rand -base64 32
   ```

2. **Build the frontend**:

   ```bash
   make build
   ```

3. **Build the backend**:

   ```bash
   make build-backend
   ```

4. **Set production environment variables**:

   - `BETTER_AUTH_SECRET`: Use the generated secure secret
   - `NODE_ENV=production`: Enables secure cookie settings
   - `DATABASE_URL`: Production database connection string

5. Deploy both services with a reverse proxy (nginx, etc.)

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check your `DATABASE_URL` in `.env`
2. **CORS errors**: Ensure backend CORS settings match your frontend URL
3. **Auth not working**: Verify `BETTER_AUTH_SECRET` is set and consistent
4. **Session issues**: Ensure cookies are enabled and the secret is properly configured
5. **Cookie problems**: Check that `credentials: "include"` is set in fetch requests

### Security Checklist

- [ ] Generate a secure `BETTER_AUTH_SECRET` (32+ characters)
- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production` for secure cookies
- [ ] Configure proper CORS origins
- [ ] Use secure database connections
- [ ] Regularly rotate secrets

### Logs

- Frontend: Check browser console and terminal
- Backend: Check terminal output for Go server logs
- Database: Check PostgreSQL logs for connection issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
