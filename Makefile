SHELL := /bin/bash

BACKEND_DIR ?= backend
WEB_DIR ?= web
MOBILE_DIR ?= mobile
UVICORN_APP ?= app.main:app
UVICORN_HOST ?= 0.0.0.0
UVICORN_PORT ?= 8000
FORMAT_MODE ?= fix

ENV_PROJECTS := $(BACKEND_DIR) $(WEB_DIR) $(MOBILE_DIR)

.DEFAULT_GOAL := help

.PHONY: help setup install lint test format run-backend run-web run-worker db-migrate \
	    install-backend install-web install-mobile \
	    lint-backend lint-web test-backend test-web \
	    format-backend format-web format-mobile

help: ## Display available Make targets
	    @echo "Available targets:"
	    @grep -E '^[a-zA-Z0-9_.-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS=":.*##"} {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: ## Copy .env.example files into .env for known projects
	    @echo "Ensuring environment files exist..."
	    @for dir in $(ENV_PROJECTS); do \
	        if [ -d "$$dir" ]; then \
	            if [ -f "$$dir/.env.example" ]; then \
	                target="$$dir/.env"; \
	                if [ ! -f "$$target" ]; then \
	                    cp "$$dir/.env.example" "$$target"; \
	                    echo "  Created $$target"; \
	                else \
	                    echo "  Skipped $$target (already exists)"; \
	                fi; \
	            else \
	                echo "  Skipped $$dir (no .env.example found)"; \
	            fi; \
	        else \
	            echo "  Skipped $$dir (directory missing)"; \
	        fi; \
	    done

install: install-backend install-web install-mobile ## Install dependencies across backend, web, and mobile apps

install-backend:
	    @if [ -d "$(BACKEND_DIR)" ]; then \
	        echo "Installing backend dependencies..."; \
	        if [ -f "$(BACKEND_DIR)/poetry.lock" ] && command -v poetry >/dev/null 2>&1; then \
	            (cd "$(BACKEND_DIR)" && poetry install); \
	        elif [ -f "$(BACKEND_DIR)/pyproject.toml" ] && command -v pip >/dev/null 2>&1; then \
	            (cd "$(BACKEND_DIR)" && pip install -e .); \
	        elif [ -f "$(BACKEND_DIR)/requirements.txt" ] && command -v pip >/dev/null 2>&1; then \
	            pip install -r "$(BACKEND_DIR)/requirements.txt"; \
	        else \
	            echo "  No supported dependency manifest found for backend; skipping."; \
	        fi; \
	    else \
	        echo "Skipping backend install (directory $(BACKEND_DIR) not found)."; \
	    fi

install-web:
	    @if [ -d "$(WEB_DIR)" ]; then \
	        echo "Installing web dependencies..."; \
	        if [ -f "$(WEB_DIR)/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then \
	            (cd "$(WEB_DIR)" && pnpm install); \
	        elif [ -f "$(WEB_DIR)/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then \
	            (cd "$(WEB_DIR)" && yarn install --frozen-lockfile); \
	        elif [ -f "$(WEB_DIR)/package.json" ]; then \
	            (cd "$(WEB_DIR)" && npm install); \
	        else \
	            echo "  No package.json found for web app; skipping."; \
	        fi; \
	    else \
	        echo "Skipping web install (directory $(WEB_DIR) not found)."; \
	    fi

install-mobile:
	    @if [ -d "$(MOBILE_DIR)" ]; then \
	        echo "Installing mobile dependencies..."; \
	        if [ -f "$(MOBILE_DIR)/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then \
	            (cd "$(MOBILE_DIR)" && pnpm install); \
	        elif [ -f "$(MOBILE_DIR)/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then \
	            (cd "$(MOBILE_DIR)" && yarn install --frozen-lockfile); \
	        elif [ -f "$(MOBILE_DIR)/package.json" ]; then \
	            (cd "$(MOBILE_DIR)" && npm install); \
	        else \
	            echo "  No package.json found for mobile app; skipping."; \
	        fi; \
	    else \
	        echo "Skipping mobile install (directory $(MOBILE_DIR) not found)."; \
	    fi

lint: lint-backend lint-web ## Run linting for backend and web projects

lint-backend:
	    @if [ -d "$(BACKEND_DIR)" ]; then \
	        echo "Linting backend..."; \
	        if command -v ruff >/dev/null 2>&1; then \
	            (cd "$(BACKEND_DIR)" && ruff check .); \
	        elif command -v flake8 >/dev/null 2>&1; then \
	            (cd "$(BACKEND_DIR)" && flake8 .); \
	        else \
	            echo "  No Python linter (ruff or flake8) available; skipping backend lint."; \
	        fi; \
	    else \
	        echo "Skipping backend lint (directory $(BACKEND_DIR) not found)."; \
	    fi

lint-web:
	    @if [ -d "$(WEB_DIR)" ] && [ -f "$(WEB_DIR)/package.json" ]; then \
	        echo "Linting web app..."; \
	        if [ -f "$(WEB_DIR)/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then \
	            (cd "$(WEB_DIR)" && pnpm lint); \
	        elif [ -f "$(WEB_DIR)/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then \
	            (cd "$(WEB_DIR)" && yarn lint); \
	        else \
	            (cd "$(WEB_DIR)" && npm run lint); \
	        fi; \
	    else \
	        echo "Skipping web lint (package.json not found)."; \
	    fi

test: test-backend test-web ## Run backend (pytest) and web (Jest) tests

test-backend:
	    @if [ -d "$(BACKEND_DIR)" ]; then \
	        echo "Running backend tests..."; \
	        if command -v pytest >/dev/null 2>&1; then \
	            (cd "$(BACKEND_DIR)" && pytest); \
	        else \
	            echo "  pytest is not installed; skipping backend tests."; \
	        fi; \
	    else \
	        echo "Skipping backend tests (directory $(BACKEND_DIR) not found)."; \
	    fi

test-web:
	    @if [ -d "$(WEB_DIR)" ] && [ -f "$(WEB_DIR)/package.json" ]; then \
	        echo "Running web tests..."; \
	        if [ -f "$(WEB_DIR)/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then \
	            (cd "$(WEB_DIR)" && pnpm test -- --watch=false); \
	        elif [ -f "$(WEB_DIR)/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then \
	            (cd "$(WEB_DIR)" && yarn test --watch=false); \
	        else \
	            (cd "$(WEB_DIR)" && npm test -- --watch=false); \
	        fi; \
	    else \
	        echo "Skipping web tests (package.json not found)."; \
	    fi

format: format-backend format-web format-mobile ## Run code formatters (Black, isort, Prettier)

format-backend:
	    @if [ -d "$(BACKEND_DIR)" ]; then \
	        MODE="$(FORMAT_MODE)"; \
	        echo "Formatting backend (mode: $$MODE)..."; \
	        if command -v black >/dev/null 2>&1; then \
	            if [ "$$MODE" = "check" ]; then \
	                (cd "$(BACKEND_DIR)" && black --check .); \
	            else \
	                (cd "$(BACKEND_DIR)" && black .); \
	            fi; \
	        else \
	            echo "  black is not installed; skipping."; \
	        fi; \
	        if command -v isort >/dev/null 2>&1; then \
	            if [ "$$MODE" = "check" ]; then \
	                (cd "$(BACKEND_DIR)" && isort --check-only .); \
	            else \
	                (cd "$(BACKEND_DIR)" && isort .); \
	            fi; \
	        else \
	            echo "  isort is not installed; skipping."; \
	        fi; \
	    else \
	        echo "Skipping backend formatting (directory $(BACKEND_DIR) not found)."; \
	    fi

format-web:
	    @if [ -d "$(WEB_DIR)" ] && [ -f "$(WEB_DIR)/package.json" ]; then \
	        MODE="$(FORMAT_MODE)"; \
	        echo "Formatting web app (mode: $$MODE)..."; \
	        if [ -f "$(WEB_DIR)/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then \
	            if [ "$$MODE" = "check" ]; then \
	                (cd "$(WEB_DIR)" && pnpm exec prettier --check "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            else \
	                (cd "$(WEB_DIR)" && pnpm exec prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            fi; \
	        elif [ -f "$(WEB_DIR)/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then \
	            if [ "$$MODE" = "check" ]; then \
	                (cd "$(WEB_DIR)" && yarn prettier --check "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            else \
	                (cd "$(WEB_DIR)" && yarn prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            fi; \
	        else \
	            if [ "$$MODE" = "check" ]; then \
	                (cd "$(WEB_DIR)" && npx --yes prettier --check "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            else \
	                (cd "$(WEB_DIR)" && npx --yes prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            fi; \
	        fi; \
	    else \
	        echo "Skipping web formatting (package.json not found)."; \
	    fi

format-mobile:
	    @if [ -d "$(MOBILE_DIR)" ] && [ -f "$(MOBILE_DIR)/package.json" ]; then \
	        MODE="$(FORMAT_MODE)"; \
	        echo "Formatting mobile app (mode: $$MODE)..."; \
	        if [ -f "$(MOBILE_DIR)/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then \
	            if [ "$$MODE" = "check" ]; then \
	                (cd "$(MOBILE_DIR)" && pnpm exec prettier --check "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            else \
	                (cd "$(MOBILE_DIR)" && pnpm exec prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            fi; \
	        elif [ -f "$(MOBILE_DIR)/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then \
	            if [ "$$MODE" = "check" ]; then \
	                (cd "$(MOBILE_DIR)" && yarn prettier --check "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            else \
	                (cd "$(MOBILE_DIR)" && yarn prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            fi; \
	        else \
	            if [ "$$MODE" = "check" ]; then \
	                (cd "$(MOBILE_DIR)" && npx --yes prettier --check "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            else \
	                (cd "$(MOBILE_DIR)" && npx --yes prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md}"); \
	            fi; \
	        fi; \
	    else \
	        echo "Skipping mobile formatting (package.json not found)."; \
	    fi

run-backend: ## Start the backend API with uvicorn
	    @if [ -d "$(BACKEND_DIR)" ]; then \
	        if command -v uvicorn >/dev/null 2>&1; then \
	            echo "Starting uvicorn (app=$(UVICORN_APP), host=$(UVICORN_HOST), port=$(UVICORN_PORT))"; \
	            (cd "$(BACKEND_DIR)" && uvicorn $(UVICORN_APP) --host $(UVICORN_HOST) --port $(UVICORN_PORT) --reload); \
	        else \
	            echo "uvicorn is not installed. Install it to run the backend."; \
	        fi; \
	    else \
	        echo "Cannot run backend: directory $(BACKEND_DIR) not found."; \
	    fi

run-web: ## Start the Next.js development server
	    @if [ -d "$(WEB_DIR)" ] && [ -f "$(WEB_DIR)/package.json" ]; then \
	        echo "Starting web dev server..."; \
	        if [ -f "$(WEB_DIR)/pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then \
	            (cd "$(WEB_DIR)" && pnpm dev); \
	        elif [ -f "$(WEB_DIR)/yarn.lock" ] && command -v yarn >/dev/null 2>&1; then \
	            (cd "$(WEB_DIR)" && yarn dev); \
	        else \
	            (cd "$(WEB_DIR)" && npm run dev); \
	        fi; \
	    else \
	        echo "Cannot run web app: package.json not found."; \
	    fi

run-worker: ## Launch the Playwright worker (stub command)
	    @if command -v npx >/dev/null 2>&1; then \
	        echo "Starting Playwright worker stub..."; \
	        npx playwright test --project=worker; \
	    else \
	        echo "npx is not available. Install Node.js to run the worker."; \
	    fi

db-migrate: ## Apply database migrations using Alembic
	    @if [ -d "$(BACKEND_DIR)" ]; then \
	        if command -v alembic >/dev/null 2>&1; then \
	            if [ -f "$(BACKEND_DIR)/alembic.ini" ]; then \
	                echo "Running Alembic migrations with $(BACKEND_DIR)/alembic.ini"; \
	                alembic -c "$(BACKEND_DIR)/alembic.ini" upgrade head; \
	            else \
	                echo "Running Alembic migrations with default config"; \
	                alembic upgrade head; \
	            fi; \
	        else \
	            echo "alembic command not found. Install Alembic to run migrations."; \
	        fi; \
	    else \
	        echo "Skipping migrations (directory $(BACKEND_DIR) not found)."; \
	    fi
