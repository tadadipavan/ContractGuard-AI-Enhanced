# ContractGuard AI — Intelligent Contract Review & Risk Analysis Platform

An enterprise-grade AI-powered contract review and risk analysis platform built with Fastify, React, and advanced LLM integration.

## 🎯 Project Overview

This is an **enhanced version** of an open-source contract analysis platform, with substantial additions and improvements made for enterprise use cases.

### Original Foundation
This project was inspired by and built upon existing open-source contract review concepts. We have:
- ✅ Kept the original architecture and core functionality
- ✅ Added significant new features and enhancements
- ✅ Improved performance and scalability
- ✅ Enhanced the UI/UX
- ✅ Added enterprise features

### What's Been Added/Enhanced

#### 🆕 New Features
1. **Contract Comparison Engine** - Side-by-side contract analysis and diff highlighting
2. **Advanced Analytics Dashboard** - Real-time insights, trends, and reporting
3. **Bulk Operations API** - Process multiple contracts efficiently
4. **Custom Risk Scoring** - Configurable risk assessment algorithms
5. **Audit Trail & Compliance Logging** - Detailed activity tracking for compliance
6. **Integration Webhooks** - Real-time notifications and third-party integrations

#### 🚀 Enhanced Features
1. **Performance Optimizations** - Query caching, batch processing
2. **Advanced Search** - Full-text search with filters and saved searches
3. **Enhanced Security** - Row-level security, audit logging, rate limiting
4. **Better Error Handling** - Comprehensive error recovery and logging
5. **Improved Testing** - Integration tests for new features

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Bun (TypeScript)
- **Framework**: Fastify (high-performance HTTP server)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (Upstash)
- **Job Queue**: BullMQ
- **Auth**: Supabase (JWT-based)
- **AI**: Groq API (LLM), Jina (Embeddings)
- **Storage**: Supabase Storage / S3

### Frontend
- **Framework**: React 18 with TypeScript
- **Build**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

---

## 📋 Features

### Core Contract Analysis
- ✅ **AI-Powered Review** - Uses Groq's LLM for intelligent contract analysis
- ✅ **Risk Assessment** - Identifies high-risk clauses and terms
- ✅ **Clause Extraction** - Automatically extracts and categorizes contract clauses
- ✅ **Contract Summarization** - Generates executive summaries
- ✅ **Semantic Search** - Find similar contracts and clauses across your library

### Enterprise Features (NEW)
- ✅ **Contract Comparison** - Compare two contracts side-by-side
- ✅ **Analytics Dashboard** - Track contract analysis trends and metrics
- ✅ **Bulk Processing** - Upload and analyze multiple contracts in batch
- ✅ **Custom Risk Profiles** - Define your own risk scoring criteria
- ✅ **Audit Logging** - Track all actions for compliance
- ✅ **Webhooks** - Real-time notifications and integrations
- ✅ **Saved Searches** - Save and reuse search queries
- ✅ **Alerts** - Configurable alerts for high-risk contracts

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL 14+
- Redis
- Supabase account
- Groq API key
- Jina API key

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ContractGuard-AI
```

2. **Backend Setup**
```bash
cd backend
bun install
cp .env.example .env
# Update .env with your credentials
bun run migrate
bun run dev
```

3. **Frontend Setup**
```bash
cd frontend
bun install
cp .env.example .env.local
# Update .env.local with your API URL
bun run dev
```

Visit `http://localhost:5173/` to access the application.

---

## 📚 New API Endpoints (Enhanced Features)

### Contract Comparison
```
POST /api/v1/contracts/compare
Compare two contracts and get a detailed diff

GET /api/v1/contracts/compare/:id1/:id2
Retrieve cached comparison results
```

### Analytics
```
GET /api/v1/analytics/summary
Get high-level analytics dashboard data

GET /api/v1/analytics/trends?period=30d
Get trends over a specific period

GET /api/v1/analytics/risks/distribution
Distribution of risk levels across contracts
```

### Bulk Operations
```
POST /api/v1/contracts/bulk/upload
Upload and process multiple contracts

GET /api/v1/contracts/bulk/:jobId/status
Check status of bulk processing job

GET /api/v1/contracts/bulk/:jobId/results
Get results from completed bulk job
```

### Audit Logging
```
GET /api/v1/audit/logs
Retrieve audit trail

GET /api/v1/audit/logs/user/:userId
Get user-specific audit logs
```

### Custom Risk Scoring
```
POST /api/v1/risk-profiles
Create custom risk scoring profile

PUT /api/v1/risk-profiles/:id
Update risk profile

POST /api/v1/contracts/:id/rescore
Re-score contract with different profile
```

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── ai/              # AI/LLM integration (enhanced)
│   ├── db/              # Database layer
│   ├── routes/          # API endpoints (new endpoints added)
│   ├── services/        # Business logic (new services)
│   ├── workers/         # Background jobs
│   ├── middleware/      # Express middleware
│   └── lib/             # Utilities
├── prisma/              # ORM schema
└── tests/               # Test suite (enhanced)

frontend/
├── src/
│   ├── pages/           # Route pages
│   ├── components/      # React components (new components)
│   ├── hooks/           # Custom hooks (new hooks)
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
└── public/              # Static assets
```

---

## 🔐 Security

- **JWT Authentication** via Supabase
- **Row-Level Security** - Users can only access their org's contracts
- **Rate Limiting** - Prevents API abuse
- **Audit Logging** - Complete activity tracking
- **Encrypted Storage** - Sensitive data is encrypted
- **HTTPS Required** in production

---

## 📊 Database Schema Enhancements

### New Tables (for enhanced features)
- `contract_comparisons` - Stores comparison results
- `analytics_snapshots` - Daily analytics data
- `audit_logs` - Complete audit trail
- `risk_profiles` - Custom scoring profiles
- `webhooks` - Webhook subscriptions
- `saved_searches` - User-saved search queries
- `bulk_jobs` - Bulk processing job tracking

---

## 🧪 Testing

```bash
# Backend tests
cd backend
bun test

# Frontend tests
cd frontend
npm run test

# E2E tests
npm run test:e2e
```

---

## 📈 Performance Optimizations

1. **Query Caching** - Redis-based query result caching
2. **Batch Processing** - Efficient bulk contract processing
3. **Lazy Loading** - Frontend code splitting with Vite
4. **Database Indexing** - Optimized indexes on frequently queried columns
5. **Worker Pool** - BullMQ workers for background processing

---

## 🔄 Contributing

This project welcomes contributions! When submitting PRs:
1. Create a feature branch from `main`
2. Make your changes
3. Add tests for new functionality
4. Update documentation
5. Submit a PR with a clear description

---

## 📝 License

This project uses components from the open-source community. See LICENSE file for details.

---

## 🤝 Attribution & Acknowledgments

**Base Architecture**: Inspired by open-source contract analysis platforms

**Original Concepts**:
- Contract parsing and clause extraction
- Risk-based scoring methodology
- AI-powered summarization

**Enhancements & New Features**:
- Contract comparison engine
- Analytics dashboard and reporting
- Bulk operations and job queuing
- Custom risk profiles
- Comprehensive audit logging
- Webhook integration system

**Technology Stack**:
- Fastify, React, Prisma, Supabase, BullMQ, TailwindCSS, and the broader open-source community

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation in `/docs`

---

## 🚀 Deployment

### Staging
```bash
cd backend && bun run build
cd frontend && npm run build
```

### Production
- Deploy backend to Vercel, Railway, or your preferred platform
- Deploy frontend to Vercel, Netlify, or similar
- Configure environment variables for production
- Set up database migrations
- Configure Redis for caching

---

**Last Updated**: June 2026
**Version**: 1.5.0 (Enhanced Edition)
