# DoorLoop Technical Assessment Makefile (Nx Monorepo)

.PHONY: help install dev build test clean docker-up docker-down docker-build seed lint graph

# Default target
help:
	@echo "DoorLoop Technical Assessment Commands (Nx Monorepo):"
	@echo "  install      - Install dependencies for all applications"
	@echo "  dev          - Start all services in development mode"
	@echo "  build        - Build all applications"
	@echo "  test         - Run tests for all applications"
	@echo "  lint         - Lint all applications"
	@echo "  lint-fix     - Fix linting issues automatically"
	@echo "  format       - Format code with Prettier"
	@echo "  format-check - Check code formatting"
	@echo "  clean        - Clean build artifacts and node_modules"
	@echo "  docker-up    - Start services with Docker Compose"
	@echo "  docker-down  - Stop Docker services"
	@echo "  docker-build - Build Docker images"
	@echo "  seed         - Seed the database with initial data"
	@echo "  graph        - Show dependency graph"
	@echo "  affected     - Show affected projects"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed successfully!"

# Development mode
dev:
	@echo "Starting development servers with Nx..."
	npm run dev

# Build all applications
build:
	@echo "Building all applications with Nx..."
	npm run build

# Run tests
test:
	@echo "Running tests with Nx..."
	npm run test

# Lint all applications
lint:
	@echo "Linting all applications with Nx..."
	npm run lint

# Fix linting issues
lint-fix:
	@echo "Fixing linting issues with Nx..."
	npm run lint:fix

# Format code with Prettier
format:
	@echo "Formatting code with Prettier..."
	npm run format

# Check code formatting
format-check:
	@echo "Checking code formatting with Prettier..."
	npm run format:check

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf node_modules
	rm -rf dist
	rm -rf apps/*/node_modules
	rm -rf apps/*/dist
	rm -rf .nx
	@echo "✅ Cleaned successfully!"

# Docker commands
docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d
	@echo "✅ Services started! Check http://localhost:3000"

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

docker-build:
	@echo "Building Docker images..."
	docker-compose build

# Seed database
seed:
	@echo "Seeding database with Nx..."
	npm run seed
	@echo "✅ Database seeded successfully!"


# Nx-specific commands
graph:
	@echo "Showing dependency graph..."
	npm run graph

affected:
	@echo "Showing affected projects..."
	npm run affected

affected-build:
	@echo "Building affected projects..."
	npm run affected:build

affected-test:
	@echo "Testing affected projects..."
	npm run affected:test

affected-lint:
	@echo "Linting affected projects..."
	npm run affected:lint

# Setup development environment
setup: install
	@echo "Setting up Nx development environment..."
	@if [ ! -f .env ]; then cp env.example .env; echo "Created .env file from example"; fi
	@if [ ! -f apps/backend/.env ]; then cp apps/backend/env.example apps/backend/.env; echo "Created backend .env file"; fi
	@echo "✅ Nx development environment setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Update .env files with your configuration"
	@echo "2. Run 'make docker-up' to start all services"
	@echo "3. Run 'make seed' to populate the database"
	@echo "4. Visit http://localhost:3000 to see the application"
	@echo ""
	@echo "Nx Commands:"
	@echo "- 'make graph' to see project dependencies"
	@echo "- 'make affected' to see what changed"
	@echo "- 'nx dev backend' to run only backend"
	@echo "- 'nx dev frontend' to run only frontend"
