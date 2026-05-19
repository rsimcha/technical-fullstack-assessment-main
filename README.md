# DoorLoop Technical Assessment - Fullstack Development Boilerplate

> **⚠️ Important**: Before setting up the project, please read the [ASSIGNMENT_DESCRIPTION.md](ASSIGNMENT_DESCRIPTION.md) first to understand the assessment requirements and context.

## Overview

This is a clean fullstack development boilerplate built with modern web technologies and managed as an **Nx monorepo**. The application provides a solid foundation with authentication system and role-based access control, ready for your next project implementation.

## Architecture

- **Monorepo**: Nx workspace for scalable development
- **Backend**: Node.js + TypeScript + Express + MongoDB + Typegoose
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with role-based access control
- **Containerization**: Docker and Docker Compose
- **Build System**: Nx with caching and dependency graph management

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Quick Start with Docker (Recommended)

1. **Clone and start the application**:

   ```bash
   git clone <repository-url>
   cd technical-fullstack-assessment

   # Install dependencies
   npm i
   npm i -g nx


   # Start all services
   make docker-up
   # or
   docker-compose up -d
   ```

2. **Seed the database**:

   ```bash
   # Wait for services to be ready, then seed
   make seed
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000

- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

### Local Development Setup

1. **Install dependencies**:

   ```bash
   make install
   # or
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp apps/backend/env.example apps/backend/.env
   # Edit the .env file with your MongoDB connection string
   ```

3. **Start MongoDB** (if running locally):

   ```bash
   # Using Docker for MongoDB only
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

4. **Start development servers**:

   ```bash
   make dev
   # or
   npm run dev
   # or run individual apps:
   nx dev backend
   nx dev frontend
   ```

5. **Seed the database**:
   ```bash
   make seed
   ```

## Available Scripts

### Docker Commands

- `make docker-up` - Start all services with Docker
- `make docker-down` - Stop all Docker services
- `make docker-build` - Build Docker images
- `make seed` - Seed the database with initial data

### Nx Development Commands

- `make dev` - Start both frontend and backend in development mode
- `make install` - Install dependencies for all applications
- `make build` - Build both applications
- `make test` - Run tests for both applications
- `make lint` - Lint all applications
- `make lint-fix` - Fix linting issues automatically
- `make format` - Format code with Prettier
- `make format-check` - Check code formatting
- `make clean` - Clean node_modules and build artifacts
- `make graph` - Show project dependency graph
- `make affected` - Show affected projects

### Individual Project Commands

- `nx dev backend` - Start only the backend
- `nx dev frontend` - Start only the frontend
- `nx build backend` - Build only the backend
- `nx build frontend` - Build only the frontend
- `nx test backend` - Test only the backend
- `nx test frontend` - Test only the frontend
- `nx lint backend` - Lint only the backend
- `nx lint frontend` - Lint only the frontend

### Nx Affected Commands (for CI/CD)

- `nx affected --target=build` - Build only affected projects
- `nx affected --target=test` - Test only affected projects
- `nx affected --target=lint` - Lint only affected projects

## Test Accounts

After seeding the database, you can use these test accounts:

- **Admin**: admin@doorloop.com / admin123
- **Manager**: manager@doorloop.com / manager123
- **Tenant**: tenant@doorloop.com / tenant123

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile (authenticated)
- `POST /refresh` - Refresh token (authenticated)

## User Roles

- **Admin**: Full system access
- **Manager**: Extended permissions for business operations
- **Tenant**: Basic user access

## Project Structure

```
technical-fullstack-assessment/
├── apps/
│   ├── backend/                 # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/     # Route controllers
│   │   │   ├── models/          # Mongoose/Typegoose models
│   │   │   ├── routes/          # Express routes
│   │   │   ├── middleware/      # Custom middleware
│   │   │   ├── services/        # Business logic services
│   │   │   ├── utils/           # Utility functions
│   │   │   └── scripts/         # Database seeding scripts
│   │   └── package.json
│   └── frontend/                # React + TypeScript UI
│       ├── src/
│       │   ├── components/      # Reusable UI components
│       │   ├── pages/           # Page components
│       │   ├── contexts/        # React contexts
│       │   ├── services/        # API services
│       │   ├── types/           # TypeScript type definitions
│       │   └── utils/           # Utility functions
│       └── package.json
├── docker-compose.yml           # Docker services configuration
├── init-mongo.js               # MongoDB initialization
├── Makefile                    # Development commands
└── package.json                # Root package.json
```

## Nx Monorepo Benefits

This project uses **Nx** for advanced monorepo management, providing:

- 🚀 **Smart Rebuilds**: Only builds what changed
- 📊 **Dependency Graph**: Visual representation of project relationships
- ⚡ **Parallel Execution**: Run tasks across multiple projects simultaneously
- 🎯 **Affected Commands**: Test/build/lint only what's affected by changes
- 📦 **Code Sharing**: Easy sharing of libraries between apps
- 🔧 **Consistent Tooling**: Unified configuration across all projects
- 📈 **Scalability**: Easy to add new apps and libraries

### Nx Commands for Development

```bash
# See what's affected by your changes
nx affected --target=build --dry-run

# Run tests only for affected projects
nx affected --target=test

# Visualize the dependency graph
nx graph

# Run a specific target for all projects
nx run-many --target=lint --projects=backend,frontend
```

## Features

### Backend Features

- ✅ JWT-based authentication with role-based access control
- ✅ RESTful API design with proper HTTP status codes
- ✅ Input validation using Zod schemas
- ✅ Error handling with detailed error messages
- ✅ Rate limiting for API protection
- ✅ Security headers with Helmet
- ✅ CORS configuration
- ✅ Structured logging with Winston
- ✅ Database seeding for development

### Frontend Features

- ✅ Modern React 18 with TypeScript
- ✅ Responsive design with Tailwind CSS
- ✅ Authentication context with persistent login
- ✅ Protected routes with role-based access
- ✅ Form handling with React Hook Form and Zod validation
- ✅ Toast notifications for user feedback
- ✅ Loading states and error handling
- ✅ Property management interface

### Monorepo Features

- ✅ Nx workspace with intelligent build system
- ✅ Shared TypeScript configurations
- ✅ Unified linting and testing setup
- ✅ Dependency graph visualization
- ✅ Affected project detection for CI/CD optimization

## Development Guidelines

### Code Quality Tools

This project includes development tools for a great developer experience:

- **Prettier**: Automatic code formatting on save
- **VS Code Settings**: Pre-configured for optimal development
- **Format on Save**: Automatically formats code when you save files
- **ESLint**: Basic Nx configuration

### Recommended VS Code Extensions

The project includes recommended extensions that will be suggested when you open the workspace:

- Prettier - Code formatter
- ESLint - Linting support
- Tailwind CSS IntelliSense
- TypeScript support
- Nx Console for monorepo management

### Backend Guidelines

- Use TypeScript strict mode
- Follow RESTful API conventions
- Implement proper error handling
- Use Zod for input validation
- Write meaningful commit messages
- Add JSDoc comments for complex functions

### Frontend Guidelines

- Use TypeScript for all components
- Follow React best practices and hooks
- Use Tailwind CSS for styling
- Implement proper error boundaries
- Handle loading and error states
- Use semantic HTML elements

## Environment Variables

### Backend (.env)

```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/doorloop_assessment
JWT_SECRET=your-super-secret-jwt-key-for-assessment
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml if needed
2. **MongoDB connection**: Ensure MongoDB is running and accessible
3. **Dependencies**: Run `make clean && make install` to refresh dependencies
4. **Environment**: Check .env files are properly configured

### Useful Commands

```bash
# View Docker logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Clean everything and start fresh
make clean
make docker-build
make docker-up
make seed
```

## License

This project is licensed under the ISC License.
