# Workplace Tools

This repository contains a collection of lightweight productivity utilities alongside a modern FastAPI backend foundation powered by Poetry, Supabase helpers, and pytest-based test coverage.

- The original HTML utilities remain available as standalone files in the repository root.
- The backend lives under [`backend/`](backend/) with its own README explaining setup, testing, and deployment considerations.
- The web frontend lives under [`web/`](web/) with Next.js and Supabase integration.

## 🚀 Deployments

### Development Previews
- **Backend API**: [Render](https://workplace-tools-api.onrender.com/health)
- **Frontend**: Auto-generated preview URLs on PRs

### Production
- **Frontend**: [Vercel](https://workplace-tools.vercel.app)
- **Backend API**: [Render](https://workplace-tools-api.onrender.com/health)
- **Database**: [Supabase](https://supabase.com)

## 🛠️ Quick Start

### Local Development

1. **Clone and setup environment**
   ```bash
   git clone <repository-url>
   cd workplace-tools
   cp .env.example .env
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   poetry install
   poetry run uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd web
   cp .env.local.example .env.local
   npm install
   npm run dev
   ```

4. **Docker Development (optional)**
   ```bash
   docker-compose up -d
   ```

## 📋 Services & Endpoints

### Backend API
- **Health Check**: `/health`
- **Version**: `/version`
- **Auth**: `/auth/me`
- **AI Chat**: `/api/ai/complete`
- **AI Models**: `/api/ai/models`
- **API Docs**: `/docs` (development only)

### Frontend Features
- Supabase authentication
- AI chat interface
- Responsive design
- Real-time updates

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend && poetry run pytest

# Frontend tests
cd web && npm run test
```

### Smoke Tests
```bash
./scripts/smoke-test.sh [backend-url] [frontend-url]
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete setup and deployment instructions
- [Backend README](./backend/README.md) - Backend-specific documentation
- [Web README](./web/README.md) - Frontend-specific documentation

## 🔧 Configuration

### Environment Variables
See [`.env.example`](./.env.example) for all available configuration options.

### Required Services
- **Supabase**: Database and authentication
- **Render**: Backend hosting
- **Vercel**: Frontend hosting
- **AI Providers**: OpenAI, Anthropic, Google AI

## 🔄 CI/CD

- **GitHub Actions**: Automated testing and deployment
- **Preview Deployments**: Automatic on PR creation
- **Production Deployment**: On merge to main branch
- **Smoke Testing**: Automated health checks

## 🐛 Troubleshooting

Common issues and solutions are documented in the [Deployment Guide](./DEPLOYMENT.md#troubleshooting).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
5. Preview deployments will be automatically created

## 📄 License

This project is licensed under the MIT License.
