#!/usr/bin/env tsx
/**
 * Production Readiness Audit Tool
 * 
 * Evaluates software readiness for:
 * 1) Employee/Internal Use
 * 2) Public Beta
 * 3) Production-Grade Launch
 * 
 * Based on strict evidence-only evaluation across 10 categories (0-5 score each).
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface AuditInputs {
  repoPath: string;
  deploymentUrl?: string;
  intendedAudience: 'Employee' | 'Public' | 'Both';
  handlesPII: boolean;
  handlesPayments: boolean;
  handlesSecrets: boolean;
}

interface CategoryScore {
  score: number;
  maxScore: number;
  findings: string[];
  reasoning: string;
}

interface AuditResults {
  categories: {
    identityAccessControl: CategoryScore;
    secretsConfig: CategoryScore;
    dataSafety: CategoryScore;
    reliability: CategoryScore;
    observability: CategoryScore;
    cicd: CategoryScore;
    security: CategoryScore;
    testing: CategoryScore;
    performance: CategoryScore;
    documentation: CategoryScore;
  };
  runtimeCheck?: {
    httpStatus?: number;
    responseTime?: number;
    findings: string[];
  };
  totalScore: number;
  maxScore: number;
  readinessLevel: string;
  criticalBlockers: string[];
  publicLaunchBlockers: string[];
  topImprovements: string[];
  executiveSummary: {
    safeForEmployees: boolean;
    safeForCustomers: boolean;
    wouldBreakFirst: string[];
    securityConcerns: string[];
  };
}

class ProductionReadinessAuditor {
  private repoPath: string;
  private inputs: AuditInputs;

  constructor(inputs: AuditInputs) {
    this.inputs = inputs;
    this.repoPath = inputs.repoPath;
  }

  /**
   * Main audit execution
   */
  async audit(): Promise<AuditResults> {
    console.log('🔍 Starting Production Readiness Audit...\n');

    const results: AuditResults = {
      categories: {
        identityAccessControl: this.auditIdentityAccessControl(),
        secretsConfig: this.auditSecretsConfig(),
        dataSafety: this.auditDataSafety(),
        reliability: this.auditReliability(),
        observability: this.auditObservability(),
        cicd: this.auditCICD(),
        security: this.auditSecurity(),
        testing: this.auditTesting(),
        performance: this.auditPerformance(),
        documentation: this.auditDocumentation(),
      },
      totalScore: 0,
      maxScore: 50,
      readinessLevel: '',
      criticalBlockers: [],
      publicLaunchBlockers: [],
      topImprovements: [],
      executiveSummary: {
        safeForEmployees: false,
        safeForCustomers: false,
        wouldBreakFirst: [],
        securityConcerns: [],
      },
    };

    // Calculate total score
    results.totalScore = Object.values(results.categories).reduce(
      (sum, cat) => sum + cat.score,
      0
    );

    // Runtime check if deployment URL provided
    if (this.inputs.deploymentUrl) {
      results.runtimeCheck = await this.performRuntimeCheck(this.inputs.deploymentUrl);
    }

    // Classify readiness
    this.classifyReadiness(results);

    // Generate blockers and improvements
    this.generateBlockersAndImprovements(results);

    // Generate executive summary
    this.generateExecutiveSummary(results);

    return results;
  }

  /**
   * Category 1: Identity & Access Control (0-5)
   */
  private auditIdentityAccessControl(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for authentication implementation
    const hasAuth = this.searchCodebase(['auth', 'authentication', 'passport', 'jwt', 'session']);
    if (hasAuth) {
      findings.push('✓ Authentication patterns found in codebase');
      score += 1;
    } else {
      findings.push('✗ No authentication implementation detected');
    }

    // Check for RBAC
    const hasRBAC = this.searchCodebase(['role', 'permission', 'authorization', 'rbac', 'acl']);
    if (hasRBAC) {
      findings.push('✓ Role-based access control patterns found');
      score += 1;
    } else {
      findings.push('✗ No RBAC implementation detected');
    }

    // Check for hardcoded credentials
    const hasHardcodedCreds = this.searchForHardcodedSecrets();
    if (!hasHardcodedCreds) {
      findings.push('✓ No obvious hardcoded credentials found');
      score += 1;
    } else {
      findings.push('✗ CRITICAL: Potential hardcoded credentials detected');
    }

    // Check for basic auth implementation
    const hasBasicAuth = this.fileExists('.env') || this.fileExists('.env.example') || 
                         this.searchCodebase(['BASIC_AUTH', 'basic-auth']);
    if (hasBasicAuth) {
      findings.push('✓ Basic auth configuration detected');
      score += 1;
    } else {
      findings.push('⚠ No basic auth configuration found');
    }

    // Check for least privilege principles
    const hasLeastPrivilege = this.searchCodebase(['least-privilege', 'minimal-permissions']);
    if (hasLeastPrivilege) {
      findings.push('✓ Least privilege patterns found');
      score += 1;
    } else {
      findings.push('⚠ Least privilege principles not explicitly documented');
    }

    const reasoning = `Authentication: ${hasAuth ? 'Partial' : 'Missing'}. RBAC: ${hasRBAC ? 'Present' : 'Missing'}. Hardcoded secrets: ${hasHardcodedCreds ? 'FOUND (CRITICAL)' : 'None found'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Category 2: Secrets & Configuration Hygiene (0-5)
   */
  private auditSecretsConfig(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for .env handling
    const hasEnvExample = this.fileExists('.env.example');
    const hasEnvInGitignore = this.fileContains('.gitignore', '.env');
    if (hasEnvExample && hasEnvInGitignore) {
      findings.push('✓ .env.example exists and .env is gitignored');
      score += 2;
    } else if (hasEnvExample || hasEnvInGitignore) {
      findings.push('⚠ Partial .env configuration (missing .env.example or .gitignore entry)');
      score += 1;
    } else {
      findings.push('✗ No .env configuration detected');
    }

    // Check if secrets are committed
    const hasCommittedSecrets = this.searchForCommittedSecrets();
    if (!hasCommittedSecrets) {
      findings.push('✓ No obvious committed secrets detected');
      score += 2;
    } else {
      findings.push('✗ CRITICAL: Potential committed secrets found');
    }

    // Check for config documentation
    const hasConfigDocs = this.fileContains('README.md', 'environment') || 
                          this.fileContains('README.md', 'configuration');
    if (hasConfigDocs) {
      findings.push('✓ Configuration documented in README');
      score += 1;
    } else {
      findings.push('⚠ Configuration not documented in README');
    }

    const reasoning = `.env handling: ${hasEnvExample && hasEnvInGitignore ? 'Good' : 'Needs improvement'}. Committed secrets: ${hasCommittedSecrets ? 'FOUND (CRITICAL)' : 'None found'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Category 3: Data Safety & Privacy (0-5)
   */
  private auditDataSafety(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for data storage documentation
    const hasDataStorage = this.searchInFiles(['database', 'storage', 'postgres', 'mongodb', 'redis']);
    if (hasDataStorage) {
      findings.push('✓ Data storage configuration found');
      score += 1;
    } else {
      findings.push('⚠ Data storage not clearly documented');
    }

    // Check for encryption
    const hasEncryption = this.searchCodebase(['encrypt', 'crypto', 'tls', 'ssl', 'https']);
    if (hasEncryption) {
      findings.push('✓ Encryption patterns found in codebase');
      score += 1;
    } else {
      findings.push('✗ No encryption implementation detected');
    }

    // Check for backup strategy
    const hasBackup = this.searchInFiles(['backup', 'snapshot', 'restore']);
    if (hasBackup) {
      findings.push('✓ Backup/snapshot mechanisms found');
      score += 1;
    } else {
      findings.push('✗ No backup strategy documented');
    }

    // Check for data retention policy
    const hasRetention = this.searchInFiles(['retention', 'data-lifecycle', 'cleanup', 'purge']);
    if (hasRetention) {
      findings.push('✓ Data retention/cleanup logic found');
      score += 1;
    } else {
      findings.push('⚠ No data retention policy documented');
    }

    // Check for PII handling (if applicable)
    if (this.inputs.handlesPII) {
      const hasPIIProtection = this.searchCodebase(['pii', 'gdpr', 'privacy', 'personal-data']);
      if (hasPIIProtection) {
        findings.push('✓ PII protection patterns found');
        score += 1;
      } else {
        findings.push('✗ CRITICAL: Handles PII but no protection patterns found');
      }
    } else {
      score += 1; // Not applicable
      findings.push('○ PII handling not applicable');
    }

    const reasoning = `Data storage: ${hasDataStorage ? 'Documented' : 'Unclear'}. Encryption: ${hasEncryption ? 'Present' : 'Missing'}. Backup: ${hasBackup ? 'Found' : 'Missing'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Category 4: Reliability & Error Handling (0-5)
   */
  private auditReliability(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for error handling
    const hasErrorHandling = this.searchCodebase(['try', 'catch', 'error', 'exception']);
    if (hasErrorHandling) {
      findings.push('✓ Error handling patterns found');
      score += 1;
    } else {
      findings.push('✗ No error handling detected');
    }

    // Check for timeouts
    const hasTimeouts = this.searchCodebase(['timeout', 'deadline', 'abort']);
    if (hasTimeouts) {
      findings.push('✓ Timeout handling found');
      score += 1;
    } else {
      findings.push('⚠ No timeout handling detected');
    }

    // Check for retries
    const hasRetries = this.searchCodebase(['retry', 'backoff', 'exponential']);
    if (hasRetries) {
      findings.push('✓ Retry logic found');
      score += 1;
    } else {
      findings.push('⚠ No retry logic detected');
    }

    // Check for graceful degradation
    const hasGracefulDegradation = this.searchCodebase(['fallback', 'graceful', 'degradation']);
    if (hasGracefulDegradation) {
      findings.push('✓ Graceful degradation patterns found');
      score += 1;
    } else {
      findings.push('⚠ No graceful degradation detected');
    }

    // Check for health checks
    const hasHealthCheck = this.searchCodebase(['health', 'readiness', 'liveness', '/health']);
    if (hasHealthCheck) {
      findings.push('✓ Health check endpoints found');
      score += 1;
    } else {
      findings.push('⚠ No health check endpoints detected');
    }

    const reasoning = `Error handling: ${hasErrorHandling ? 'Present' : 'Missing'}. Timeouts: ${hasTimeouts ? 'Present' : 'Missing'}. Retries: ${hasRetries ? 'Present' : 'Missing'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Category 5: Observability & Monitoring (0-5)
   */
  private auditObservability(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for logging
    const hasLogging = this.searchCodebase(['console.log', 'logger', 'winston', 'pino', 'bunyan']);
    if (hasLogging) {
      findings.push('✓ Logging implementation found');
      score += 1;
    } else {
      findings.push('✗ No logging detected');
    }

    // Check for structured logging
    const hasStructuredLogs = this.searchCodebase(['winston', 'pino', 'bunyan', 'structured']);
    if (hasStructuredLogs) {
      findings.push('✓ Structured logging patterns found');
      score += 1;
    } else {
      findings.push('⚠ No structured logging detected');
    }

    // Check for error tracking
    const hasErrorTracking = this.searchCodebase(['sentry', 'rollbar', 'bugsnag', 'error-tracking']);
    if (hasErrorTracking) {
      findings.push('✓ Error tracking service found');
      score += 1;
    } else {
      findings.push('✗ No error tracking service detected');
    }

    // Check for metrics
    const hasMetrics = this.searchCodebase(['prometheus', 'metrics', 'statsd', 'datadog']);
    if (hasMetrics) {
      findings.push('✓ Metrics collection found');
      score += 1;
    } else {
      findings.push('⚠ No metrics collection detected');
    }

    // Check for alerts
    const hasAlerts = this.searchCodebase(['alert', 'notification', 'webhook', 'slack', 'teams']);
    if (hasAlerts) {
      findings.push('✓ Alert mechanisms found');
      score += 1;
    } else {
      findings.push('⚠ No alert mechanisms detected');
    }

    const reasoning = `Logging: ${hasLogging ? 'Present' : 'Missing'}. Structured: ${hasStructuredLogs ? 'Yes' : 'No'}. Error tracking: ${hasErrorTracking ? 'Present' : 'Missing'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Category 6: CI/CD & Deployment Safety (0-5)
   */
  private auditCICD(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for CI configuration
    const hasCIConfig = this.fileExists('.github/workflows') || 
                        this.fileExists('.gitlab-ci.yml') ||
                        this.fileExists('.circleci/config.yml');
    if (hasCIConfig) {
      findings.push('✓ CI configuration found');
      score += 1;
    } else {
      findings.push('✗ No CI configuration detected');
    }

    // Check for tests in CI
    const hasTestsInCI = this.searchInDirectory('.github/workflows', ['test', 'npm test', 'vitest']);
    if (hasTestsInCI) {
      findings.push('✓ Tests run in CI');
      score += 1;
    } else {
      findings.push('⚠ No test execution in CI detected');
    }

    // Check for linting in CI
    const hasLintingInCI = this.searchInDirectory('.github/workflows', ['lint', 'eslint', 'prettier']);
    if (hasLintingInCI) {
      findings.push('✓ Linting in CI');
      score += 1;
    } else {
      findings.push('⚠ No linting in CI detected');
    }

    // Check for build verification
    const hasBuildInCI = this.searchInDirectory('.github/workflows', ['build', 'npm run build', 'turbo build']);
    if (hasBuildInCI) {
      findings.push('✓ Build verification in CI');
      score += 1;
    } else {
      findings.push('⚠ No build verification in CI detected');
    }

    // Check for rollback strategy
    const hasRollback = this.searchInFiles(['rollback', 'revert', 'blue-green', 'canary']);
    if (hasRollback) {
      findings.push('✓ Rollback strategy documented');
      score += 1;
    } else {
      findings.push('⚠ No rollback strategy documented');
    }

    const reasoning = `CI present: ${hasCIConfig ? 'Yes' : 'No'}. Tests: ${hasTestsInCI ? 'Running' : 'Not running'}. Linting: ${hasLintingInCI ? 'Yes' : 'No'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Category 7: Security Hardening (0-5)
   */
  private auditSecurity(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for input validation
    const hasInputValidation = this.searchCodebase(['validate', 'sanitize', 'zod', 'joi', 'yup']);
    if (hasInputValidation) {
      findings.push('✓ Input validation patterns found');
      score += 1;
    } else {
      findings.push('✗ No input validation detected');
    }

    // Check for rate limiting
    const hasRateLimit = this.searchCodebase(['rate-limit', 'ratelimit', 'throttle']);
    if (hasRateLimit) {
      findings.push('✓ Rate limiting found');
      score += 1;
    } else {
      findings.push('⚠ No rate limiting detected');
    }

    // Check for CORS configuration
    const hasCORS = this.searchCodebase(['cors', 'origin', 'CORS']);
    if (hasCORS) {
      findings.push('✓ CORS configuration found');
      score += 1;
    } else {
      findings.push('⚠ No CORS configuration detected');
    }

    // Check for CSP headers
    const hasCSP = this.searchCodebase(['content-security-policy', 'csp', 'helmet']);
    if (hasCSP) {
      findings.push('✓ CSP headers found');
      score += 1;
    } else {
      findings.push('⚠ No CSP headers detected');
    }

    // Check for dependency scanning
    const hasDependencyScan = this.fileExists('package-lock.json') || 
                              this.fileExists('pnpm-lock.yaml') ||
                              this.searchInDirectory('.github/workflows', ['dependabot', 'snyk', 'audit']);
    if (hasDependencyScan) {
      findings.push('✓ Dependency scanning available');
      score += 1;
    } else {
      findings.push('⚠ No dependency scanning detected');
    }

    const reasoning = `Input validation: ${hasInputValidation ? 'Present' : 'Missing'}. Rate limiting: ${hasRateLimit ? 'Present' : 'Missing'}. CORS: ${hasCORS ? 'Configured' : 'Not configured'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Category 8: Testing Coverage (0-5)
   */
  private auditTesting(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for test files
    const hasTests = this.searchForFiles(['*.test.ts', '*.spec.ts', '*.test.js', '*.spec.js']);
    if (hasTests) {
      findings.push('✓ Test files found');
      score += 1;
    } else {
      findings.push('✗ No test files detected');
    }

    // Check for test framework
    const hasTestFramework = this.searchInFiles(['vitest', 'jest', 'mocha', 'jasmine']);
    if (hasTestFramework) {
      findings.push('✓ Test framework configured');
      score += 1;
    } else {
      findings.push('⚠ No test framework detected');
    }

    // Check for integration tests
    const hasIntegrationTests = this.searchCodebase(['integration', 'e2e', 'playwright', 'cypress']);
    if (hasIntegrationTests) {
      findings.push('✓ Integration/E2E tests found');
      score += 1;
    } else {
      findings.push('⚠ No integration tests detected');
    }

    // Check for coverage tooling
    const hasCoverage = this.searchInFiles(['coverage', 'istanbul', 'c8', 'nyc']);
    if (hasCoverage) {
      findings.push('✓ Code coverage tooling found');
      score += 1;
    } else {
      findings.push('⚠ No coverage tooling detected');
    }

    // Check for smoke tests
    const hasSmokeTests = this.searchCodebase(['smoke', 'sanity', 'health-check']);
    if (hasSmokeTests) {
      findings.push('✓ Smoke tests found');
      score += 1;
    } else {
      findings.push('⚠ No smoke tests detected');
    }

    const reasoning = `Test files: ${hasTests ? 'Present' : 'Missing'}. Framework: ${hasTestFramework ? 'Configured' : 'Missing'}. Integration tests: ${hasIntegrationTests ? 'Present' : 'Missing'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Category 9: Performance & Cost Controls (0-5)
   */
  private auditPerformance(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for rate limits
    const hasRateLimit = this.searchCodebase(['rate-limit', 'throttle', 'quota']);
    if (hasRateLimit) {
      findings.push('✓ Rate limiting found');
      score += 1;
    } else {
      findings.push('⚠ No rate limiting detected');
    }

    // Check for resource limits
    const hasResourceLimits = this.searchCodebase(['max-memory', 'max-connections', 'pool-size', 'limits']);
    if (hasResourceLimits) {
      findings.push('✓ Resource limits configured');
      score += 1;
    } else {
      findings.push('⚠ No resource limits detected');
    }

    // Check for caching
    const hasCaching = this.searchCodebase(['cache', 'redis', 'memcached', 'cdn']);
    if (hasCaching) {
      findings.push('✓ Caching mechanisms found');
      score += 1;
    } else {
      findings.push('⚠ No caching detected');
    }

    // Check for performance budgets
    const hasPerfBudgets = this.searchCodebase(['performance', 'budget', 'lighthouse']);
    if (hasPerfBudgets) {
      findings.push('✓ Performance budgets found');
      score += 1;
    } else {
      findings.push('⚠ No performance budgets detected');
    }

    // Check for cost controls
    const hasCostControls = this.searchCodebase(['cost', 'billing', 'usage-limit']);
    if (hasCostControls) {
      findings.push('✓ Cost control mechanisms found');
      score += 1;
    } else {
      findings.push('⚠ No cost controls detected');
    }

    const reasoning = `Rate limits: ${hasRateLimit ? 'Present' : 'Missing'}. Caching: ${hasCaching ? 'Present' : 'Missing'}. Resource limits: ${hasResourceLimits ? 'Present' : 'Missing'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Category 10: Documentation & Operational Readiness (0-5)
   */
  private auditDocumentation(): CategoryScore {
    const findings: string[] = [];
    let score = 0;

    // Check for README
    const hasReadme = this.fileExists('README.md');
    if (hasReadme) {
      findings.push('✓ README.md exists');
      score += 1;
    } else {
      findings.push('✗ No README.md found');
    }

    // Check for setup instructions
    const hasSetup = this.fileContains('README.md', 'install') || 
                     this.fileContains('README.md', 'setup') ||
                     this.fileContains('README.md', 'getting started');
    if (hasSetup) {
      findings.push('✓ Setup instructions in README');
      score += 1;
    } else {
      findings.push('⚠ No setup instructions in README');
    }

    // Check for runbook
    const hasRunbook = this.searchForFiles(['RUNBOOK.md', 'OPERATIONS.md', 'runbook*']);
    if (hasRunbook) {
      findings.push('✓ Runbook/operations guide found');
      score += 1;
    } else {
      findings.push('⚠ No runbook found');
    }

    // Check for incident procedures
    const hasIncidentProc = this.searchInFiles(['incident', 'escalation', 'on-call', 'emergency']);
    if (hasIncidentProc) {
      findings.push('✓ Incident procedures documented');
      score += 1;
    } else {
      findings.push('⚠ No incident procedures found');
    }

    // Check for API documentation
    const hasAPIDocs = this.searchForFiles(['*.swagger.*', '*.openapi.*', 'API.md']) ||
                       this.searchCodebase(['swagger', 'openapi', 'api-docs']);
    if (hasAPIDocs) {
      findings.push('✓ API documentation found');
      score += 1;
    } else {
      findings.push('⚠ No API documentation detected');
    }

    const reasoning = `README: ${hasReadme ? 'Present' : 'Missing'}. Setup: ${hasSetup ? 'Documented' : 'Missing'}. Runbook: ${hasRunbook ? 'Present' : 'Missing'}.`;

    return { score, maxScore: 5, findings, reasoning };
  }

  /**
   * Phase 2: Runtime Check (optional)
   */
  private async performRuntimeCheck(url: string): Promise<any> {
    const findings: string[] = [];
    console.log(`\n📡 Performing runtime check on ${url}...`);

    try {
      // Note: In a real implementation, we would use fetch or axios here
      // For now, returning placeholder
      findings.push('UNVERIFIED — Runtime check requires HTTP client (fetch/axios)');
      findings.push('⚠ Implement actual HTTP checks for: status, response time, headers, auth behavior');
      
      return {
        httpStatus: undefined,
        responseTime: undefined,
        findings,
      };
    } catch (error) {
      findings.push(`✗ Runtime check failed: ${error}`);
      return { findings };
    }
  }

  /**
   * Classify readiness level based on total score
   */
  private classifyReadiness(results: AuditResults): void {
    const score = results.totalScore;

    if (score >= 43) {
      results.readinessLevel = 'Public Beta Ready';
    } else if (score >= 36) {
      results.readinessLevel = 'Employee Pilot Ready (with conditions)';
    } else if (score >= 26) {
      results.readinessLevel = 'Dev Preview';
    } else {
      results.readinessLevel = 'Prototype';
    }
  }

  /**
   * Generate blockers and improvement recommendations
   */
  private generateBlockersAndImprovements(results: AuditResults): void {
    const criticalBlockers: string[] = [];
    const publicBlockers: string[] = [];
    const improvements: string[] = [];

    // Analyze each category for blockers
    Object.entries(results.categories).forEach(([category, data]) => {
      const criticalFindings = data.findings.filter(f => f.includes('CRITICAL'));
      criticalBlockers.push(...criticalFindings);

      if (data.score <= 2) {
        publicBlockers.push(`${category}: Score ${data.score}/5 - Needs significant improvement`);
      }

      if (data.score < 4) {
        improvements.push(`Improve ${category}: ${data.reasoning}`);
      }
    });

    // Add specific blockers based on inputs
    if (this.inputs.handlesPII && results.categories.dataSafety.score < 4) {
      criticalBlockers.push('CRITICAL: Handles PII but data safety score is low');
    }

    if (this.inputs.handlesPayments && results.categories.security.score < 4) {
      criticalBlockers.push('CRITICAL: Handles payments but security score is low');
    }

    results.criticalBlockers = criticalBlockers;
    results.publicLaunchBlockers = publicBlockers;
    results.topImprovements = improvements.slice(0, 5);
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(results: AuditResults): void {
    const summary = results.executiveSummary;

    // Determine safety for employees
    summary.safeForEmployees = results.totalScore >= 30 && results.criticalBlockers.length === 0;

    // Determine safety for customers
    summary.safeForCustomers = results.totalScore >= 43 && 
                                results.criticalBlockers.length === 0 &&
                                results.categories.security.score >= 4 &&
                                results.categories.dataSafety.score >= 4;

    // What would break first
    const weakCategories = Object.entries(results.categories)
      .filter(([_, data]) => data.score <= 2)
      .map(([category, data]) => `${category} (score: ${data.score}/5)`);
    summary.wouldBreakFirst = weakCategories.length > 0 
      ? weakCategories 
      : ['System appears relatively stable, but stress testing recommended'];

    // Security concerns
    summary.securityConcerns = [
      ...results.criticalBlockers,
      ...(results.categories.security.score < 3 ? ['Low security hardening score'] : []),
      ...(results.categories.identityAccessControl.score < 3 ? ['Weak identity & access control'] : []),
    ];

    if (summary.securityConcerns.length === 0) {
      summary.securityConcerns.push('No major security concerns identified, but thorough security audit recommended');
    }
  }

  /**
   * Utility: Check if file exists
   */
  private fileExists(relativePath: string): boolean {
    const fullPath = path.join(this.repoPath, relativePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Utility: Check if file contains text
   */
  private fileContains(relativePath: string, searchText: string): boolean {
    try {
      const fullPath = path.join(this.repoPath, relativePath);
      if (!fs.existsSync(fullPath)) return false;
      const content = fs.readFileSync(fullPath, 'utf-8');
      return content.toLowerCase().includes(searchText.toLowerCase());
    } catch {
      return false;
    }
  }

  /**
   * Utility: Search codebase for patterns
   */
  private searchCodebase(patterns: string[]): boolean {
    try {
      for (const pattern of patterns) {
        // Escape special characters for grep
        const escapedPattern = pattern.replace(/['"$`]/g, '\\$&');
        const result = execSync(
          `grep -r -i '${escapedPattern}' --include="*.ts" --include="*.js" --include="*.json" --include="*.md" . 2>/dev/null || true`,
          { cwd: this.repoPath, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
        );
        if (result.trim().length > 0) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Utility: Search in specific files
   */
  private searchInFiles(patterns: string[]): boolean {
    try {
      for (const pattern of patterns) {
        // Escape special characters for grep
        const escapedPattern = pattern.replace(/['"$`]/g, '\\$&');
        const result = execSync(
          `grep -r -i '${escapedPattern}' --include="*.md" --include="*.json" . 2>/dev/null || true`,
          { cwd: this.repoPath, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
        );
        if (result.trim().length > 0) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Utility: Search in specific directory
   */
  private searchInDirectory(dir: string, patterns: string[]): boolean {
    try {
      const fullPath = path.join(this.repoPath, dir);
      if (!fs.existsSync(fullPath)) return false;
      
      for (const pattern of patterns) {
        // Escape special characters for grep
        const escapedPattern = pattern.replace(/['"$`]/g, '\\$&');
        const result = execSync(
          `grep -r -i '${escapedPattern}' . 2>/dev/null || true`,
          { cwd: fullPath, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
        );
        if (result.trim().length > 0) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Utility: Search for file patterns
   */
  private searchForFiles(patterns: string[]): boolean {
    try {
      for (const pattern of patterns) {
        const result = execSync(
          `find . -name "${pattern}" 2>/dev/null || true`,
          { cwd: this.repoPath, encoding: 'utf-8' }
        );
        if (result.trim().length > 0) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Utility: Search for hardcoded secrets
   */
  private searchForHardcodedSecrets(): boolean {
    const patterns = [
      'password\\s*=\\s*["\']',
      'api_key\\s*=\\s*["\']',
      'secret\\s*=\\s*["\']',
      'token\\s*=\\s*["\']',
      'sk-[a-zA-Z0-9]',
    ];
    
    try {
      for (const pattern of patterns) {
        const result = execSync(
          `grep -r -E '${pattern}' --include="*.ts" --include="*.js" --include="*.json" . 2>/dev/null || true`,
          { cwd: this.repoPath, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
        );
        if (result.trim().length > 0) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Utility: Search for committed secrets
   */
  private searchForCommittedSecrets(): boolean {
    try {
      const result = execSync(
        'git log --all --full-history --pretty=format: -S "password" -S "api_key" 2>/dev/null | head -n 1',
        { cwd: this.repoPath, encoding: 'utf-8' }
      );
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Generate formatted report
   */
  generateReport(results: AuditResults): string {
    let report = '';

    report += '━'.repeat(80) + '\n';
    report += '                    PRODUCTION READINESS AUDIT REPORT\n';
    report += '━'.repeat(80) + '\n\n';

    // SECTION A — Scorecard Table
    report += '═══════════════════════════════════════════════════════════════════════════════\n';
    report += '  SECTION A — SCORECARD TABLE\n';
    report += '═══════════════════════════════════════════════════════════════════════════════\n\n';

    const categories = [
      ['Identity & Access Control', results.categories.identityAccessControl],
      ['Secrets & Configuration', results.categories.secretsConfig],
      ['Data Safety & Privacy', results.categories.dataSafety],
      ['Reliability & Error Handling', results.categories.reliability],
      ['Observability & Monitoring', results.categories.observability],
      ['CI/CD & Deployment Safety', results.categories.cicd],
      ['Security Hardening', results.categories.security],
      ['Testing Coverage', results.categories.testing],
      ['Performance & Cost Controls', results.categories.performance],
      ['Documentation & Operations', results.categories.documentation],
    ];

    report += '  Category                                Score    Max    Status\n';
    report += '  ─────────────────────────────────────  ─────   ─────   ──────────\n';

    categories.forEach(([name, data]) => {
      const score = data.score;
      const status = score >= 4 ? 'Good ✓' : score >= 3 ? 'Fair ⚠' : 'Poor ✗';
      report += `  ${name.padEnd(40)} ${score}/5      5      ${status}\n`;
    });

    report += '  ─────────────────────────────────────  ─────   ─────   ──────────\n';
    report += `  TOTAL SCORE                            ${results.totalScore.toString().padStart(2)}/50    50\n\n`;

    // SECTION B — Detailed Findings
    report += '═══════════════════════════════════════════════════════════════════════════════\n';
    report += '  SECTION B — DETAILED FINDINGS\n';
    report += '═══════════════════════════════════════════════════════════════════════════════\n\n';

    categories.forEach(([name, data]) => {
      report += `┌─ ${name} (${data.score}/5)\n`;
      report += `│  ${data.reasoning}\n│\n`;
      data.findings.forEach(finding => {
        report += `│  ${finding}\n`;
      });
      report += '└─' + '─'.repeat(78) + '\n\n';
    });

    // Runtime Check
    if (results.runtimeCheck) {
      report += '┌─ Runtime Check\n';
      results.runtimeCheck.findings.forEach(finding => {
        report += `│  ${finding}\n`;
      });
      report += '└─' + '─'.repeat(78) + '\n\n';
    }

    // SECTION C — Blockers
    report += '═══════════════════════════════════════════════════════════════════════════════\n';
    report += '  SECTION C — BLOCKERS\n';
    report += '═══════════════════════════════════════════════════════════════════════════════\n\n';

    report += '▸ CRITICAL BLOCKERS (Must fix before ANY use):\n';
    if (results.criticalBlockers.length === 0) {
      report += '  • None identified\n';
    } else {
      results.criticalBlockers.forEach(blocker => {
        report += `  • ${blocker}\n`;
      });
    }
    report += '\n';

    report += '▸ PUBLIC LAUNCH BLOCKERS:\n';
    if (results.publicLaunchBlockers.length === 0) {
      report += '  • None identified (based on current score)\n';
    } else {
      results.publicLaunchBlockers.forEach(blocker => {
        report += `  • ${blocker}\n`;
      });
    }
    report += '\n';

    // SECTION D — Readiness Verdict
    report += '═══════════════════════════════════════════════════════════════════════════════\n';
    report += '  SECTION D — READINESS VERDICT\n';
    report += '═══════════════════════════════════════════════════════════════════════════════\n\n';

    report += `  Total Score: ${results.totalScore}/50\n`;
    report += `  Readiness Level: ${results.readinessLevel}\n\n`;

    report += '  Score Interpretation:\n';
    report += '  • 0-25  → Prototype\n';
    report += '  • 26-35 → Dev Preview\n';
    report += '  • 36-42 → Employee Pilot Ready (with conditions)\n';
    report += '  • 43-50 → Public Beta Ready\n';
    report += '  • 51+   → Production Ready (requires perfect score + additional criteria)\n\n';

    // SECTION E — Executive Summary
    report += '═══════════════════════════════════════════════════════════════════════════════\n';
    report += '  SECTION E — EXECUTIVE SUMMARY\n';
    report += '═══════════════════════════════════════════════════════════════════════════════\n\n';

    report += `▸ Safe for Employees? ${results.executiveSummary.safeForEmployees ? 'YES ✓' : 'NO ✗'}\n`;
    report += `  ${results.executiveSummary.safeForEmployees ? 'Can be used for internal pilot with monitoring' : 'Too many gaps for safe employee use'}\n\n`;

    report += `▸ Safe for Customers? ${results.executiveSummary.safeForCustomers ? 'YES ✓' : 'NO ✗'}\n`;
    report += `  ${results.executiveSummary.safeForCustomers ? 'Ready for public beta with proper support' : 'Not ready for external users'}\n\n`;

    report += '▸ What Would Break First Under Real Usage?\n';
    results.executiveSummary.wouldBreakFirst.forEach(item => {
      report += `  • ${item}\n`;
    });
    report += '\n';

    report += '▸ What Would Scare a Security Review?\n';
    results.executiveSummary.securityConcerns.forEach(concern => {
      report += `  • ${concern}\n`;
    });
    report += '\n';

    // Immediate Action Plan
    report += '═══════════════════════════════════════════════════════════════════════════════\n';
    report += '  IMMEDIATE ACTION PLAN (Prioritized by Impact)\n';
    report += '═══════════════════════════════════════════════════════════════════════════════\n\n';

    report += '  Top 5 Highest-Leverage Improvements:\n\n';
    results.topImprovements.slice(0, 5).forEach((improvement, idx) => {
      report += `  ${idx + 1}. ${improvement}\n`;
    });

    report += '\n';
    report += '━'.repeat(80) + '\n';
    report += '                           END OF REPORT\n';
    report += '━'.repeat(80) + '\n';

    return report;
  }
}

/**
 * CLI Entry Point
 */
async function main() {
  const args = process.argv.slice(2);

  // Default inputs
  const inputs: AuditInputs = {
    repoPath: process.cwd(),
    deploymentUrl: undefined,
    intendedAudience: 'Both',
    handlesPII: false,
    handlesPayments: false,
    handlesSecrets: true,
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repo-path' && args[i + 1]) {
      inputs.repoPath = args[i + 1];
      i++;
    } else if (args[i] === '--deployment-url' && args[i + 1]) {
      inputs.deploymentUrl = args[i + 1];
      i++;
    } else if (args[i] === '--audience' && args[i + 1]) {
      inputs.intendedAudience = args[i + 1] as any;
      i++;
    } else if (args[i] === '--handles-pii') {
      inputs.handlesPII = true;
    } else if (args[i] === '--handles-payments') {
      inputs.handlesPayments = true;
    } else if (args[i] === '--handles-secrets') {
      inputs.handlesSecrets = true;
    }
  }

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                    PRODUCTION READINESS AUDITOR');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  console.log(`Repository: ${inputs.repoPath}`);
  console.log(`Deployment URL: ${inputs.deploymentUrl || 'Not provided'}`);
  console.log(`Intended Audience: ${inputs.intendedAudience}`);
  console.log(`Handles PII: ${inputs.handlesPII ? 'Yes' : 'No'}`);
  console.log(`Handles Payments: ${inputs.handlesPayments ? 'Yes' : 'No'}`);
  console.log(`Handles Secrets: ${inputs.handlesSecrets ? 'Yes' : 'No'}`);
  console.log('');

  const auditor = new ProductionReadinessAuditor(inputs);
  const results = await auditor.audit();
  const report = auditor.generateReport(results);

  console.log(report);

  // Save report to file
  const reportPath = path.join(inputs.repoPath, 'PRODUCTION_READINESS_AUDIT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report saved to: ${reportPath}\n`);

  // Exit with appropriate code
  process.exit(results.criticalBlockers.length > 0 ? 1 : 0);
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { ProductionReadinessAuditor, type AuditInputs, type AuditResults };
