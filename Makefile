.PHONY: help setup install lint test format run-backend run-web run-worker db-migrate clean

# Default target
help:
	@echo "Available targets:"
	@echo "  setup       - Set up development environment (create .env files)"
	@echo "  install     - Install dependencies for all workspaces"
	@echo "  lint        - Run linting for backend and web"
	@echo "  test        - Run tests for backend (pytest) and web (jest)"
	@echo "  format      - Format code with black/isort/prettier"
	@echo "  run-backend - Start backend server with uvicorn"
	@echo "  run-web     - Start web development server with Next.js"
	@echo "  run-worker  - Start playwright worker"
	@echo "  db-migrate  - Run database migrations with alembic"
	@echo "  clean       - Clean up temporary files and caches"

# Setup development environment
setup:
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo "Created .env from .env.example"; \
		else \
			echo "# Environment variables" > .env; \
			echo "Created empty .env file"; \
		fi; \
	else \
		echo ".env already exists"; \
	fi
	@cd backend && if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo "Created backend/.env from backend/.env.example"; \
		else \
			echo "# Backend environment variables" > .env; \
			echo "Created empty backend/.env file"; \
		fi; \
	fi
	@cd web && if [ ! -f .env.local ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env.local; \
			echo "Created web/.env.local from web/.env.example"; \
		else \
			echo "# Web environment variables" > .env.local; \
			echo "Created empty web/.env.local file"; \
		fi; \
	fi
	@cd mobile && if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo "Created mobile/.env from mobile/.env.example"; \
		else \
			echo "# Mobile environment variables" > .env; \
			echo "Created empty mobile/.env file"; \
		fi; \
	fi

# Install dependencies
install:
	@echo "Installing dependencies..."
	@cd backend && if [ -f requirements.txt ] || [ -f pyproject.toml ]; then \
		if command -v poetry >/dev/null 2>&1; then \
			poetry install; \
		elif command -v pip >/dev/null 2>&1; then \
			pip install -r requirements.txt 2>/dev/null || pip install -e .; \
		fi; \
	fi
	@cd web && if [ -f package.json ]; then \
		npm install; \
	fi
	@cd mobile && if [ -f package.json ]; then \
		npm install; \
	fi
	@cd worker && if [ -f requirements.txt ] || [ -f pyproject.toml ]; then \
		if command -v poetry >/dev/null 2>&1; then \
			poetry install; \
		elif command -v pip >/dev/null 2>&1; then \
			pip install -r requirements.txt 2>/dev/null || pip install -e .; \
		fi; \
	fi

# Lint code
lint:
	@echo "Running linting..."
	@cd backend && if [ -f requirements.txt ] || [ -f pyproject.toml ]; then \
		if command -v ruff >/dev/null 2>&1; then \
			ruff check .; \
		elif command -v flake8 >/dev/null 2>&1; then \
			flake8 .; \
		elif command -v pylint >/dev/null 2>&1; then \
			pylint .; \
		fi; \
	fi
	@cd web && if [ -f package.json ]; then \
		npm run lint 2>/dev/null || echo "No lint script found in web/package.json"; \
	fi

# Run tests
test:
	@echo "Running tests..."
	@cd backend && if [ -f requirements.txt ] || [ -f pyproject.toml ]; then \
		if command -v pytest >/dev/null 2>&1; then \
			pytest; \
		elif command -v python >/dev/null 2>&1 && [ -f -m pytest ]; then \
			python -m pytest; \
		fi; \
	fi
	@cd web && if [ -f package.json ]; then \
		npm test 2>/dev/null || npm run test 2>/dev/null || echo "No test script found in web/package.json"; \
	fi

# Format code
format:
	@echo "Formatting code..."
	@cd backend && if [ -f requirements.txt ] || [ -f pyproject.toml ]; then \
		if command -v black >/dev/null 2>&1; then \
			black .; \
		fi; \
		if command -v isort >/dev/null 2>&1; then \
			isort .; \
		fi; \
	fi
	@cd web && if [ -f package.json ]; then \
		npm run format 2>/dev/null || npx prettier --write . 2>/dev/null || echo "No formatting tools found in web"; \
	fi
	@cd worker && if [ -f requirements.txt ] || [ -f pyproject.toml ]; then \
		if command -v black >/dev/null 2>&1; then \
			black .; \
		fi; \
		if command -v isort >/dev/null 2>&1; then \
			isort .; \
		fi; \
	fi

# Run backend server
run-backend:
	@echo "Starting backend server..."
	@cd backend && if command -v uvicorn >/dev/null 2>&1; then \
		uvicorn main:app --reload --host 0.0.0.0 --port 8000; \
	else \
		echo "uvicorn not found. Please install it first."; \
	fi

# Run web development server
run-web:
	@echo "Starting web development server..."
	@cd web && if [ -f package.json ]; then \
		npm run dev 2>/dev/null || next dev 2>/dev/null || echo "No dev script found in web/package.json"; \
	else \
		echo "No package.json found in web directory"; \
	fi

# Run worker
run-worker:
	@echo "Starting worker..."
	@cd worker && if [ -f main.py ]; then \
		python main.py; \
	elif [ -f worker.py ]; then \
		python worker.py; \
	else \
		echo "No worker entry point found. Please create main.py or worker.py"; \
	fi

# Run database migrations
db-migrate:
	@echo "Running database migrations..."
	@cd backend && if command -v alembic >/dev/null 2>&1; then \
		alembic upgrade head; \
	else \
		echo "alembic not found. Please install it first."; \
	fi

# Clean up
clean:
	@echo "Cleaning up..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name ".coverage" -delete 2>/dev/null || true
	@rm -rf .pytest_cache 2>/dev/null || true
	@rm -rf .coverage 2>/dev/null || true
	@rm -rf web/.next 2>/dev/null || true
	@rm -rf web/node_modules/.cache 2>/dev/null || true
	@rm -rf mobile/node_modules/.cache 2>/dev/null || true