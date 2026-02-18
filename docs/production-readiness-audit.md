# Production Readiness Audit

## Overview

The Production Readiness Audit is a comprehensive assessment tool designed to evaluate software readiness for deployment at various stages:

1. **Employee/Internal Use**
2. **Public Beta**
3. **Production-Grade Launch**

This tool provides evidence-based evaluation across 10 critical categories, each scored 0-5 points, for a maximum of 50 points.

## Design Philosophy

- ✅ **Evidence-Only**: Evaluation based solely on verifiable artifacts in the repository
- ✅ **No Assumptions**: If something cannot be verified, it's marked as "UNVERIFIED — ASSUME MISSING"
- ✅ **Strict Scoring**: Assumes real users, real data, and real risk
- ✅ **Actionable**: Provides clear blockers and prioritized improvements
- ✅ **Honest Assessment**: No optimism bias or fluff

## Usage

### Basic Usage

```bash
# Run audit on current repository
npm run audit:production
```

### Advanced Usage

```bash
# Audit with all options
npx tsx scripts/production_readiness_audit.ts \
  --repo-path /path/to/repo \
  --deployment-url https://your-app.com \
  --audience Public \
  --handles-pii \
  --handles-payments \
  --handles-secrets
```

### Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--repo-path <path>` | Path to repository | Current directory |
| `--deployment-url <url>` | URL to deployed application | None |
| `--audience <type>` | Employee, Public, or Both | Both |
| `--handles-pii` | Application handles PII data | false |
| `--handles-payments` | Application processes payments | false |
| `--handles-secrets` | Application stores API keys/secrets | true |

## Audit Categories

### 1. Identity & Access Control (0-5 points)

**What it checks:**
- ✅ Authentication implementation (JWT, session, OAuth)
- ✅ Role-based access control (RBAC)
- ✅ Least privilege principles
- ✅ No hardcoded credentials
- ✅ Basic auth configuration

**Evidence looked for:**
- Authentication patterns in code (`auth`, `authentication`, `passport`, `jwt`, `session`)
- RBAC patterns (`role`, `permission`, `authorization`, `rbac`, `acl`)
- Environment variable configuration (`.env`, `.env.example`)
- Hardcoded credentials scan

**Scoring:**
- **5/5**: Full authentication with RBAC, no hardcoded credentials
- **3/5**: Basic authentication but missing RBAC
- **1/5**: Authentication present but security concerns
- **0/5**: No authentication detected

### 2. Secrets & Configuration Hygiene (0-5 points)

**What it checks:**
- ✅ `.env.example` exists
- ✅ `.env` is in `.gitignore`
- ✅ No committed secrets in repository
- ✅ Configuration documented
- ✅ Secret rotation capability

**Evidence looked for:**
- `.env.example` file
- `.gitignore` entries for `.env`
- Git history scan for committed secrets
- README documentation of environment variables

**Scoring:**
- **5/5**: Perfect .env handling, no secrets, documented
- **3/5**: Basic .env setup but missing documentation
- **1/5**: Partial setup with concerns
- **0/5**: No .env handling or secrets found

**Critical blockers:**
- Committed secrets in git history
- Hardcoded API keys or passwords

### 3. Data Safety & Privacy (0-5 points)

**What it checks:**
- ✅ Data storage location documented
- ✅ Encryption (at-rest and in-transit)
- ✅ Backup strategy
- ✅ Data retention policy
- ✅ PII protection (if `--handles-pii` flag set)

**Evidence looked for:**
- Database configuration (`postgres`, `mongodb`, `redis`, `sqlite`)
- Encryption patterns (`encrypt`, `crypto`, `tls`, `ssl`, `https`)
- Backup mechanisms (`backup`, `snapshot`, `restore`)
- Retention policies (`retention`, `cleanup`, `purge`)
- PII handling (`pii`, `gdpr`, `privacy`, `personal-data`)

**Scoring:**
- **5/5**: All aspects covered with PII protection (if applicable)
- **3/5**: Basic data storage with some safety measures
- **1/5**: Data storage but minimal safety
- **0/5**: Data handling unclear or unsafe

**Critical blockers (if handles PII):**
- No PII protection patterns found
- No encryption detected
- No backup strategy

### 4. Reliability & Error Handling (0-5 points)

**What it checks:**
- ✅ Graceful error handling
- ✅ Timeout configuration
- ✅ Retry logic with exponential backoff
- ✅ Fail-safe mechanisms
- ✅ Health check endpoints

**Evidence looked for:**
- Error handling (`try`, `catch`, `error`, `exception`)
- Timeouts (`timeout`, `deadline`, `abort`)
- Retry logic (`retry`, `backoff`, `exponential`)
- Graceful degradation (`fallback`, `graceful`, `degradation`)
- Health endpoints (`health`, `readiness`, `liveness`, `/health`)

**Scoring:**
- **5/5**: Comprehensive error handling with retries and health checks
- **3/5**: Basic error handling present
- **1/5**: Minimal error handling
- **0/5**: No error handling detected

### 5. Observability & Monitoring (0-5 points)

**What it checks:**
- ✅ Logging implementation
- ✅ Structured logging
- ✅ Error tracking service (Sentry, Rollbar, etc.)
- ✅ Metrics collection (Prometheus, DataDog, etc.)
- ✅ Alert mechanisms

**Evidence looked for:**
- Logging (`console.log`, `logger`, `winston`, `pino`, `bunyan`)
- Structured logging libraries (`winston`, `pino`, `bunyan`)
- Error tracking (`sentry`, `rollbar`, `bugsnag`)
- Metrics (`prometheus`, `metrics`, `statsd`, `datadog`)
- Alerts (`alert`, `notification`, `webhook`, `slack`, `teams`)

**Scoring:**
- **5/5**: Full observability stack with structured logs, error tracking, metrics, and alerts
- **3/5**: Basic logging with some monitoring
- **1/5**: Console.log only
- **0/5**: No logging detected

### 6. CI/CD & Deployment Safety (0-5 points)

**What it checks:**
- ✅ CI configuration present (.github/workflows, .gitlab-ci.yml, etc.)
- ✅ Automated tests run in CI
- ✅ Linting enforcement
- ✅ Build verification
- ✅ Rollback strategy documented

**Evidence looked for:**
- CI files (`.github/workflows`, `.gitlab-ci.yml`, `.circleci/config.yml`)
- Test execution in CI (`test`, `npm test`, `vitest`)
- Linting in CI (`lint`, `eslint`, `prettier`)
- Build verification (`build`, `npm run build`, `turbo build`)
- Rollback documentation (`rollback`, `revert`, `blue-green`, `canary`)

**Scoring:**
- **5/5**: Full CI/CD with tests, linting, builds, and rollback
- **3/5**: CI present with some automation
- **1/5**: CI configured but minimal checks
- **0/5**: No CI detected

**Public launch blocker:**
- Score < 3 means deployment is not automated or safe

### 7. Security Hardening (0-5 points)

**What it checks:**
- ✅ Input validation (Zod, Joi, Yup, etc.)
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ CSP (Content Security Policy) headers
- ✅ Dependency scanning

**Evidence looked for:**
- Validation libraries (`validate`, `sanitize`, `zod`, `joi`, `yup`)
- Rate limiting (`rate-limit`, `ratelimit`, `throttle`)
- CORS configuration (`cors`, `origin`)
- CSP headers (`content-security-policy`, `csp`, `helmet`)
- Dependency scanning (`package-lock.json`, `pnpm-lock.yaml`, CI scans)

**Scoring:**
- **5/5**: All OWASP basics covered
- **3/5**: Some security measures but gaps
- **1/5**: Minimal security hardening
- **0/5**: No security measures detected

**Critical blockers:**
- No input validation (vulnerable to injection attacks)
- No rate limiting (vulnerable to DoS)

### 8. Testing Coverage (0-5 points)

**What it checks:**
- ✅ Unit test files
- ✅ Test framework configured (Vitest, Jest, etc.)
- ✅ Integration/E2E tests (Playwright, Cypress, etc.)
- ✅ Code coverage tooling
- ✅ Smoke tests

**Evidence looked for:**
- Test files (`*.test.ts`, `*.spec.ts`, `*.test.js`, `*.spec.js`)
- Test frameworks (`vitest`, `jest`, `mocha`, `jasmine`)
- E2E frameworks (`integration`, `e2e`, `playwright`, `cypress`)
- Coverage tools (`coverage`, `istanbul`, `c8`, `nyc`)
- Smoke tests (`smoke`, `sanity`, `health-check`)

**Scoring:**
- **5/5**: Comprehensive test suite with coverage
- **3/5**: Basic unit tests present
- **1/5**: Some test files but not comprehensive
- **0/5**: No tests detected

### 9. Performance & Cost Controls (0-5 points)

**What it checks:**
- ✅ API rate limits
- ✅ Resource limits (memory, connections, etc.)
- ✅ Caching mechanisms
- ✅ Performance budgets
- ✅ Cost control measures

**Evidence looked for:**
- Rate limits (`rate-limit`, `throttle`, `quota`)
- Resource limits (`max-memory`, `max-connections`, `pool-size`, `limits`)
- Caching (`cache`, `redis`, `memcached`, `cdn`)
- Performance budgets (`performance`, `budget`, `lighthouse`)
- Cost controls (`cost`, `billing`, `usage-limit`)

**Scoring:**
- **5/5**: Full performance and cost controls
- **3/5**: Basic rate limiting and caching
- **1/5**: Minimal controls
- **0/5**: No controls detected

### 10. Documentation & Operational Readiness (0-5 points)

**What it checks:**
- ✅ README.md exists
- ✅ Setup instructions in README
- ✅ Operational runbook
- ✅ Incident response procedures
- ✅ API documentation

**Evidence looked for:**
- `README.md` file
- Setup instructions (`install`, `setup`, `getting started`)
- Runbook files (`RUNBOOK.md`, `OPERATIONS.md`)
- Incident procedures (`incident`, `escalation`, `on-call`, `emergency`)
- API docs (`*.swagger.*`, `*.openapi.*`, `API.md`, swagger/openapi code)

**Scoring:**
- **5/5**: Complete documentation with runbook and incident procedures
- **3/5**: README with setup but missing operational docs
- **1/5**: Minimal README
- **0/5**: No README detected

## Readiness Classification

### Score Ranges

| Total Score | Readiness Level | Description |
|-------------|----------------|-------------|
| **0-25** | Prototype | Early development, not ready for any users |
| **26-35** | Dev Preview | Suitable for internal testing by developers only |
| **36-42** | Employee Pilot Ready | Can be used internally with conditions and monitoring |
| **43-50** | Public Beta Ready | Ready for external users with proper support and monitoring |
| **51+** | Production Ready | Requires perfect score (50/50) plus additional criteria |

### Readiness Criteria

#### Employee/Internal Use (Score ≥ 36)
- No critical blockers
- Basic authentication
- Logging and monitoring
- Basic error handling
- Documentation present

#### Public Beta (Score ≥ 43)
- No critical blockers
- Strong security (score ≥ 4)
- Data safety measures (score ≥ 4)
- CI/CD automation (score ≥ 3)
- Comprehensive documentation

#### Production (Score = 50)
- Perfect score across all categories
- Plus additional requirements:
  - Security audit passed
  - Load testing completed
  - Disaster recovery plan
  - SLA defined
  - On-call rotation established

## Report Sections

### Section A — Scorecard Table

Summary table showing:
- Each category name
- Score (X/5)
- Max score (5)
- Status (Good ✓, Fair ⚠, Poor ✗)
- Total score (X/50)

### Section B — Detailed Findings

For each category:
- Score and reasoning
- Detailed findings list (✓ pass, ⚠ warning, ✗ fail, ○ not applicable)
- Evidence found or missing

### Section C — Blockers

**Critical Blockers:**
- Must fix before ANY use (employee or customer)
- Examples: hardcoded secrets, no authentication, committed passwords

**Public Launch Blockers:**
- Must fix before public release
- Examples: low security score, missing CI/CD, no monitoring

### Section D — Readiness Verdict

- Total score
- Readiness level
- Score interpretation guide

### Section E — Executive Summary

**Key Questions Answered:**
1. **Safe for Employees?** YES/NO with explanation
2. **Safe for Customers?** YES/NO with explanation
3. **What Would Break First?** Weakest categories identified
4. **What Would Scare Security Review?** Security concerns listed
5. **Top 5 Improvements:** Prioritized action items

## Runtime Checks (Phase 2)

When `--deployment-url` is provided, the auditor performs live checks:

### Checks Performed
- HTTP status code
- Response time measurement
- Security headers inspection
- Authentication behavior
- Rate limiting validation
- Error page handling

### Implementation Note
Current implementation includes placeholder for runtime checks. Full implementation requires HTTP client (fetch/axios).

## Integration Examples

### GitHub Actions

```yaml
name: Production Readiness Audit

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npm run audit:production
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: production-readiness-audit
          path: PRODUCTION_READINESS_AUDIT.md
```

### Pre-Deployment Check

```bash
#!/bin/bash
# pre-deploy.sh

echo "Running production readiness audit..."
npm run audit:production \
  --deployment-url $DEPLOYMENT_URL \
  --audience Public \
  --handles-pii \
  --handles-secrets

if [ $? -ne 0 ]; then
  echo "❌ Audit failed with critical blockers. Deployment blocked."
  exit 1
fi

echo "✅ Audit passed. Proceeding with deployment..."
```

### Scheduled Audit

```bash
# Add to crontab for weekly audits
0 9 * * 1 cd /path/to/repo && npm run audit:production
```

## Interpreting Results

### Green Flags (Score ≥ 4)
- ✅ Category is well implemented
- ✅ Continue current practices
- ✅ Minor improvements optional

### Yellow Flags (Score 3)
- ⚠️ Basic implementation present
- ⚠️ Room for improvement
- ⚠️ Consider enhancements before public launch

### Red Flags (Score ≤ 2)
- ✗ Significant gaps
- ✗ Must improve before employee use
- ✗ Critical for public launch

### Critical Blockers
- 🚨 Stop everything
- 🚨 Fix immediately
- 🚨 Do not deploy until resolved

## Common Issues and Fixes

### Issue: CI/CD Score = 0

**Cause:** No `.github/workflows` directory detected

**Fix:**
```bash
mkdir -p .github/workflows
# Create basic CI workflow
cat > .github/workflows/ci.yml << EOF
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run lint
      - run: npm run build
EOF
```

### Issue: Secrets & Configuration Score Low

**Cause:** Missing `.env.example` or `.env` not gitignored

**Fix:**
```bash
# Create .env.example
cat > .env.example << EOF
# Server
PORT=3000
NODE_ENV=development

# API Keys (DO NOT COMMIT ACTUAL VALUES)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
EOF

# Add to .gitignore if not present
echo ".env" >> .gitignore
```

### Issue: Testing Coverage Score = 0

**Cause:** No test files detected

**Fix:**
```bash
# Install test framework
npm install --save-dev vitest

# Create sample test
mkdir -p tests
cat > tests/example.test.ts << EOF
import { describe, it, expect } from 'vitest';

describe('Example Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF

# Add test script to package.json
# "test": "vitest"
```

### Issue: Security Hardening Score Low

**Cause:** Missing input validation or security headers

**Fix:**
```bash
# Install security packages
npm install zod helmet cors express-rate-limit

# Add to Express app:
# - Input validation with Zod
# - Helmet for security headers
# - CORS configuration
# - Rate limiting
```

## Best Practices

### Before Employee Pilot
1. ✅ Run audit: Ensure score ≥ 36
2. ✅ Fix all critical blockers
3. ✅ Set up basic monitoring
4. ✅ Document incident procedures
5. ✅ Establish feedback channel

### Before Public Beta
1. ✅ Run audit: Ensure score ≥ 43
2. ✅ Fix all public launch blockers
3. ✅ Complete security review
4. ✅ Set up error tracking
5. ✅ Prepare support documentation
6. ✅ Configure rate limiting
7. ✅ Test rollback procedures

### Before Production
1. ✅ Run audit: Achieve perfect score (50/50)
2. ✅ Pass external security audit
3. ✅ Complete load testing
4. ✅ Document disaster recovery
5. ✅ Define SLAs
6. ✅ Establish on-call rotation
7. ✅ Create runbook
8. ✅ Train support team

## Continuous Improvement

### Monthly Reviews
- Run audit monthly
- Track score trends over time
- Address declining scores immediately

### Post-Incident
- Re-run audit after incidents
- Update procedures based on learnings
- Add new checks if needed

### Feature Releases
- Run audit before major releases
- Ensure score doesn't decrease
- Document new infrastructure requirements

## Limitations

### What the Audit Cannot Detect
- ❌ Business logic bugs
- ❌ Performance under load
- ❌ Data quality issues
- ❌ User experience problems
- ❌ Regulatory compliance (GDPR, HIPAA, etc.)
- ❌ Network security configurations
- ❌ Infrastructure security (AWS/GCP/Azure configs)

### Complementary Audits Needed
- Security penetration testing
- Load and stress testing
- Accessibility audit
- Compliance review
- Business continuity planning
- Data privacy impact assessment

## Output Files

### Generated Files
- `PRODUCTION_READINESS_AUDIT.md` - Full audit report (gitignored)

### Recommended Storage
- Store reports in version control (remove from .gitignore)
- Track changes over time
- Use as release gate documentation

## Customization

To customize the audit for your needs:

1. **Adjust Scoring Weights**
   - Edit category scoring in `scripts/production_readiness_audit.ts`
   - Modify point allocation based on priorities

2. **Add Custom Checks**
   - Add new patterns to search functions
   - Create new categories if needed
   - Update scoring thresholds

3. **Integrate Custom Tools**
   - Add checks for organization-specific tools
   - Integrate with internal security scanners
   - Connect to internal monitoring systems

## Support

For issues or questions:
- Review this documentation
- Check the source code: `scripts/production_readiness_audit.ts`
- File an issue on GitHub
- Consult with DevOps/Security teams

## Version History

- **v1.0.0** (2026-02-18): Initial implementation
  - 10 category evaluation system
  - Evidence-based scoring
  - Comprehensive report generation
  - CLI interface with options
  - Runtime checks framework

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [12 Factor App](https://12factor.net/)
- [Google SRE Book](https://sre.google/books/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Production Readiness Checklist](https://gruntwork.io/devops-checklist/)
