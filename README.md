# HarvestFlow

**AI-Powered File Organization & Audit System with Drag-and-Drop Interface**

[![Status](https://img.shields.io/badge/status-in_development-yellow)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Node](https://img.shields.io/badge/node-v22.19.0-green)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.9.3-blue)]()
[![Turborepo](https://img.shields.io/badge/turborepo-2.5.8-red)]()

Automated flow harvester that ingests chat exports, clusters topics, produces per-flow deliverables, and orchestrates parallel runs across Claude, GPT-4, and Gemini with comprehensive drift protection and quality gates.

---

## Quick Start

### First-Time Setup
```bash
# Clone and install
git clone https://github.com/Krosebrook/Harvestflow.git
cd Harvestflow
npm install

# Build all packages
npm run build

# Start development
npm run dev
```

### Docker Deployment (Recommended)
```bash
# Build and launch with persistent storage
docker compose up --build -d

# Access dashboard at http://localhost:5173
# Logs: docker compose logs -f
# Stop: docker compose down
```

---

## Project Overview

HarvestFlow is a comprehensive file organization and audit system powered by multi-LLM orchestration. It features:

- **Drag-and-Drop Web Interface**: Upload ZIP files, documents, PDFs, and images
- **Intelligent Auto-Parsing**: Automatic content extraction and categorization
- **Multi-Database Auditing**: Integration with Notion, Supabase, and local storage
- **Reasoning-Based Organization**: AI-driven decision making for content management
- **5-Role Agent System** *(in progress)*: Specialized agents for context analysis, prompt engineering, building, auditing, and synthesis
- **Multi-LLM Consensus**: Parallel execution across Claude, GPT-4, and Gemini for quality assurance
- **Drift Protection**: Semantic and fingerprint-based change detection

---

## Current Status

**Phase**: 1.2 - Environment Setup & Audit (60% complete)

### ✅ Completed
- Turborepo v2 monorepo migration
- CLI installation audit (9/11 CLIs operational)
- Dependency matrix analysis (245 packages, 0 vulnerabilities)
- GitHub repository ([Krosebrook/Harvestflow](https://github.com/Krosebrook/Harvestflow))
- TypeScript 5.9.3 standardization
- npm workspaces configuration

### ⏳ In Progress
- Docker Compose stack (PostgreSQL, Redis, Supabase)
- Development environment setup
- Linting and code quality tools

### 📋 Roadmap (6-Phase Enhancement - 11-17 hours)
1. **Phase 1** (Current): Environment setup & audit
2. **Phase 2**: 5-role agent system implementation
3. **Phase 3**: Real metrics + Supabase database
4. **Phase 4**: Multi-stage agent pipeline
5. **Phase 5**: CI/CD enhancement + monitoring
6. **Phase 6**: Documentation & knowledge transfer

---

## Monorepo Architecture

### Workspace Structure

```
HarvestFlow/
├── apps/
│   └── dashboard/              # React 19 + Vite UI
│       ├── src/
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
├── packages/
│   ├── shared/                 # Shared utilities & types
│   │   ├── src/
│   │   │   ├── types.ts       # Zod schemas
│   │   │   └── utils.ts       # Levenshtein, etc.
│   │   └── package.json
│   └── chat-history/           # Chat export processor
│       ├── src/
│       └── package.json
├── src/                        # Core application (extracting to packages/core)
│   ├── server.ts               # Express API
│   ├── dropzone/               # File organization
│   ├── semantic/               # Vector embeddings
│   ├── agents/                 # LLM profiles
│   └── ...
├── docs/                       # Documentation
│   ├── cli-audit.md
│   └── dependency-matrix.md
├── turbo.json                  # Turborepo config
└── package.json                # Root workspace
```

### Technology Stack

**Frontend**: React 19 • Vite 7 • Chart.js 4.5
**Backend**: Node.js 22 • Express 5 • TypeScript 5.9
**AI/LLM**: Claude 4.5 Sonnet • GPT-4 • Gemini 1.5 Pro
**Data**: Zod • Natural (NLP) • Adm-ZIP • Levenshtein
**Database**: PostgreSQL 15 • Redis • Supabase *(planned)*
**Build**: Turborepo 2.5 • npm workspaces

---

## Available Commands

### Monorepo Operations
```bash
npm run build              # Build all packages (Turborepo)
npm run dev                # Start all dev servers
npm run typecheck          # Type check all packages
npm run clean              # Clean build artifacts
```

### Dashboard
```bash
npm run dashboard:dev      # React dashboard (http://localhost:5173)
npm run dashboard:build    # Production build
```

### Pipeline Operations
```bash
npm run zip:all            # Build per-flow bundles + metrics
npm run run:llms           # Execute prompts across LLM CLIs
npm run bundle:llms        # Archive LLM outputs
npm run populate:llms      # Run Claude/GPT/Gemini in parallel
npm run snapshot:save      # Capture golden snapshots
```

### Drift Protection
```bash
npm run drift:check        # Validate against baselines
npm run drift:fingerprint  # Generate fingerprints
npm run drift:save         # Save current state
npm run drift:validate     # Run all drift checks
npm run drift:snapshot     # Snapshot comparison
npm run drift:semantic     # Semantic similarity check
npm run drift:manifest     # Manifest validation
```

### Deployment
```bash
npm run release:bundle     # Stage versioned release
docker compose up -d       # Launch containerized app
```

---

## Dropzone Auto-Organizer

### Features
- **Drag-and-Drop UI**: Upload files, archives, documents, images
- **Auto-Categorization**: Intelligent file classification
- **Duplicate Detection**: Hash-based deduplication
- **Structured Output**: Organized folder hierarchy
- **Session Persistence**: Resume organization sessions
- **Download Bundles**: Export organized ZIP archives

### Usage

**1. Launch Dashboard**
```bash
npm run dashboard:dev  # http://localhost:5173
# OR
docker compose up -d   # http://localhost:5173 (persistent)
```

**2. Upload Files**
- Drag files/folders into "Dropzone Auto-Organizer" panel
- Supports: ZIP, TAR, PDF, DOC, images, JSON, YAML, etc.

**3. Review Organization**
- View categorized structure
- Check duplicate flags
- Review unknown file types
- See suggested folder targets

**4. Download Results**
- Click "Download organised bundle" for structured ZIP
- Access session reports: `dropzone/sessions/<sessionId>/report.json`
- Raw uploads: `dropzone/sessions/<sessionId>/raw/`
- Organized: `dropzone/sessions/<sessionId>/structured/`

### Cleanup
```bash
npm run dropzone:cleanup              # Remove sessions older than 30 days
npm run dropzone:cleanup -- --retention-days=7  # Custom retention
npm run dropzone:cleanup -- --max-sessions=100  # Limit by count
```

### Testing
```bash
./scripts/dropzone_probe.sh    # Upload sample archive and print report
```

---

## Security & Access Control

### Basic Authentication
```bash
# Set environment variables
export BASIC_AUTH_USER=admin
export BASIC_AUTH_PASS=your-secure-password

# OR in docker-compose.yml
environment:
  BASIC_AUTH_USER: admin
  BASIC_AUTH_PASS: ${BASIC_AUTH_PASS}
```

All dashboard pages and APIs will require these credentials when set.

### Production Deployment
- ⚠️ **Use TLS**: Front with nginx/Caddy for HTTPS
- 🔄 **Rotate Credentials**: Change passwords regularly
- 🔒 **Network Isolation**: Restrict to trusted networks
- 📊 **Audit Logs**: Monitor access patterns

---

## Docker Deployment

### Quick Start
```bash
# Build and launch
docker compose up --build -d

# Check logs
docker compose logs -f harvestflow

# Exec into container
docker compose exec harvestflow bash

# Stop (data persists)
docker compose down
```

### Configuration
**Ports**:
- Default: `http://localhost:5173`
- Custom: `PORT=8080 docker compose up`

**Volumes** (persistent data):
- `./dropzone-data/` → Container dropzone sessions
- `./chat.json` → Chat export data
- `./chat-history/` → Historical chats

**Customization**:
Edit `docker-compose.yml` to adjust:
- Port mapping
- Volume mounts
- Environment variables
- Resource limits

---

## Historical Chat Pipeline

### Setup
```bash
# Export chats to chat-history/chats/
cd chat-history
npm install
npm start
```

### Output
- Chunked Markdown summaries in `chat-history/out/`
- Generated flow metadata
- Topic clustering results

### Configuration
**`config.json`**:
```json
{
  "vectorStore": "mem",  // or "file" for persistence
  "embeddingModel": "local",
  "clusterThreshold": 0.75
}
```

---

## LLM Integration

### Supported Providers
| Provider | Status | Model | Purpose |
|----------|--------|-------|---------|
| **Claude** | ✅ Operational | 4.5 Sonnet | Context Engineer, Synthesizer |
| **OpenAI** | ✅ Operational | GPT-4 | Prompt Architect, Builder |
| **Gemini** | ⚠️ Needs Config | 1.5 Pro | Auditor (1M context) |
| Grok | ❌ No CLI | 2 | Future support |
| Perplexity | ❌ No CLI | Sonar | Future support |

### Configuration
**Environment Variables** (`.env.local`):
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...              # Gemini
XAI_API_KEY=...                 # Grok (optional)
PERPLEXITY_API_KEY=...          # Optional
```

### Usage
```bash
# Multi-LLM orchestration (best-effort, skips missing CLIs)
npm run run:llms

# Parallel population
npm run populate:llms

# Bundle all outputs
npm run bundle:llms
```

### Rate Limits
- **Claude**: 50,000 RPM, 25M TPM input
- **OpenAI**: 500-10,000 RPM (tier-dependent)
- **Gemini**: 15 RPM (free), 360 RPM (paid)

See [docs/cli-audit.md](./docs/cli-audit.md) for full details.

---

## Agent System (Phase 2 - In Development)

### 5-Role Architecture
```
Context Engineer → Prompt Architect → Builder → Auditor → Synthesizer
     (Claude)         (GPT-4)        (Both)   (Gemini)    (Claude)
```

**1. Context Engineer** (Claude 4.5 Sonnet)
- Analyze input files and requirements
- Extract relevant context with extended thinking
- Build comprehensive context documents

**2. Prompt Architect** (GPT-4)
- Design optimal prompts for Builder
- Structured output formatting
- Few-shot examples and CoT strategies

**3. Builder** (Claude/GPT-4)
- Generate code, docs, or content
- Follow Prompt Architect specifications
- Tool use and iterative refinement

**4. Auditor** (Gemini 1.5 Pro)
- Validate Builder outputs
- Full codebase review (1M context)
- Grounded verification with search

**5. Synthesizer** (Claude 4.5 Sonnet)
- Combine agent outputs
- Create final deliverables
- Generate comprehensive reports

### Quality Gates
**`src/gates/gates.ts`**:
- Schema validation (Zod)
- Quality score thresholds
- Agent output verification
- Consensus voting

---

## Development

### Prerequisites
- Node.js 22.19.0+
- npm 10.0.0+
- Docker 28.5.1+ (for local stack)
- Git

### Setup
```bash
git clone https://github.com/Krosebrook/Harvestflow.git
cd Harvestflow
npm install
npm run build
```

### Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and type check
npm run typecheck

# Commit (conventional commits)
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature
gh pr create
```

### Commit Convention
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

---

## Testing (Phase 3.3 - Planned)

### Frameworks
- **Vitest**: Unit and integration tests
- **Playwright**: E2E dashboard tests
- **Coverage**: Istanbul/c8

### Commands (when implemented)
```bash
npm run test              # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e          # E2E tests
npm run test:coverage     # Coverage report
```

---

## Configuration Files

### Key Configurations
| File | Purpose |
|------|---------|
| `turbo.json` | Turborepo task orchestration |
| `package.json` | Root workspace & scripts |
| `tsconfig.base.json` | Shared TypeScript config |
| `pnpm-workspace.yaml` | Workspace definitions |
| `docker-compose.yml` | Container orchestration |
| `.env.local` | Local environment (gitignored) |
| `config.json` | Pipeline configuration |
| `drift/settings.json` | Drift thresholds |

### Environment Template (`.env.example`)
```bash
# Server
PORT=3000
NODE_ENV=development

# LLM APIs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Supabase (Phase 3)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis (Phase 3)
REDIS_URL=redis://localhost:6379

# File Upload
MAX_FILE_SIZE=104857600  # 100MB
UPLOAD_DIR=./uploads

# Security
BASIC_AUTH_USER=
BASIC_AUTH_PASS=

# CI/CD
TEAMS_WEBHOOK_URL=  # Teams notifications
```

---

## Drift Protection

### Overview
Comprehensive change detection across:
- **Fingerprints**: File hashes and metadata
- **Semantic**: Vector embedding similarity
- **Manifest**: Dependency and config validation
- **Snapshots**: Golden baseline comparisons

### Configuration
**`drift/settings.json`**:
```json
{
  "thresholds": {
    "fingerprint": 0.95,
    "semantic": 0.85,
    "manifest": 1.0
  },
  "alerts": {
    "teams": true,
    "github": true
  }
}
```

### Workflow
```bash
# Initial baseline
npm run drift:fingerprint
npm run drift:save

# Make changes...

# Validate
npm run drift:check      # Quick check
npm run drift:validate   # Full validation

# Update baseline (if intentional)
npm run drift:save
```

### CI Integration
GitHub Actions workflow validates drift on every PR (requires workflow scope fix in Phase 5).

---

## Documentation

### Available Docs
- **[CLI Audit](./docs/cli-audit.md)**: CLI installation and configuration audit
- **[Dependency Matrix](./docs/dependency-matrix.md)**: Comprehensive dependency analysis
- **[Governance](./docs/governance.md)**: Baseline processes and checklist
- **[API Reference](./docs/api.md)**: *(planned)* API endpoint documentation

### External References
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Claude API](https://docs.anthropic.com)
- [OpenAI API](https://platform.openai.com/docs)

---

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Change port
PORT=8080 npm run dashboard:dev
```

**Build failures**:
```bash
# Clean and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Docker issues**:
```bash
# Restart containers
docker compose down
docker compose up --build -d

# Check logs
docker compose logs -f
```

**LLM API errors**:
```bash
# Verify API keys
echo $ANTHROPIC_API_KEY
echo $OPENAI_API_KEY

# Test authentication
openai api models.list
```

---

## Roadmap

### Phase 1: Environment (Current - 60%)
- ✅ Turborepo migration
- ✅ CLI audit
- ✅ Dependency analysis
- ⏳ Docker Compose stack
- ⏳ ESLint + Prettier

### Phase 2: Agents (0%)
- 5-role agent system
- Multi-LLM orchestration
- Quality gates
- Agent evaluation

### Phase 3: Data (0%)
- Supabase integration
- Real metrics
- Testing infrastructure
- Dashboard API integration

### Phase 4: Pipeline (0%)
- Claims validation
- Multi-stage orchestration
- Parallel consensus
- Error recovery

### Phase 5: Operations (0%)
- CI/CD workflows
- Security scanning
- Performance monitoring
- Automated deployment

### Phase 6: Documentation (0%)
- Architecture docs
- API documentation
- Contributor guide
- CLI playbook

**Estimated Total**: 11-17 hours

---

## Contributing

Contributions welcome! Please:
1. Read the [documentation](./docs/)
2. Follow TypeScript strict mode
3. Use conventional commits
4. Add tests for new features
5. Update documentation

---

## License

MIT License - See [LICENSE](LICENSE)

---

## Links

- **GitHub**: [Krosebrook/Harvestflow](https://github.com/Krosebrook/Harvestflow)
- **Issues**: [GitHub Issues](https://github.com/Krosebrook/Harvestflow/issues)
- **Documentation**: [docs/](./docs/)

---

**Generated with** [Claude Code](https://claude.com/claude-code)
**Last Updated**: 2025-10-27
**Version**: 1.0.0-alpha
**Status**: Active Development
