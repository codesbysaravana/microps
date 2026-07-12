import { fetchFileContent } from './scanner.service';
import { IDetector, ActiveDetection, DeployType, PackageManager, PreflightFix } from '../../types/preflight.types';

export const NodeDetector: IDetector = {
  name: 'Node.js',
  canDetect: (fileSet) => fileSet.has('package.json'),
  detect: async (owner, repo, fileSet): Promise<ActiveDetection> => {
    let framework = 'Node.js (Generic)';
    let detectedPort = 3000;
    let deployType: DeployType = 'BACKEND_API';
    let packageManager: PackageManager = 'npm';
    const requiredEnvVars = new Set<string>(['PORT']);
    const warnings: string[] = [];
    const preflightFixes: PreflightFix[] = [];

    // --- Lock File Intelligence: Auto-detect the correct package manager ---
    if (fileSet.has('pnpm-lock.yaml')) {
      packageManager = 'pnpm';
      preflightFixes.push({ fix: 'SET_INSTALL_CMD', value: 'pnpm install --no-frozen-lockfile', reason: 'pnpm-lock.yaml detected' });
    } else if (fileSet.has('yarn.lock')) {
      packageManager = 'yarn';
      preflightFixes.push({ fix: 'SET_INSTALL_CMD', value: 'yarn install', reason: 'yarn.lock detected' });
    }
    // npm is the default, no fix needed

    const content = await fetchFileContent(owner, repo, 'package.json');
    if (content) {
      try {
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const scripts = pkg.scripts || {};

        // --- Framework Detection (preserving all existing logic) ---
        if (deps['next']) framework = 'Next.js (SSR)';
        else if (deps['@nestjs/core']) framework = 'NestJS Enterprise API';
        else if (deps['express'] && !deps['vite'] && !deps['react']) framework = 'Express.js API';
        else if (deps['vite'] || deps['@vitejs/plugin-react']) framework = 'Vite React SPA';
        else if (deps['react']) framework = 'React SPA';

        // --- Deploy Type Classification ---
        const hasFrontendFramework = !!(deps['vite'] || deps['@vitejs/plugin-react'] || deps['next'] || deps['react'] || deps['vue'] || deps['@angular/core'] || deps['svelte']);
        const hasBackendFramework = !!(deps['express'] || deps['fastify'] || deps['@nestjs/core'] || deps['koa'] || deps['hapi']);

        if (hasFrontendFramework && hasBackendFramework) {
          deployType = 'FULLSTACK';
          warnings.push('Fullstack monorepo detected (both frontend & backend deps). Verify the correct entry point is configured.');
        } else if (hasFrontendFramework && !hasBackendFramework) {
          deployType = 'FRONTEND_SPA';
        } else {
          deployType = 'BACKEND_API';
        }

        // --- Monorepo Detection ---
        if (pkg.workspaces || fileSet.has('pnpm-workspace.yaml') || fileSet.has('lerna.json') || fileSet.has('turbo.json')) {
          warnings.push('Monorepo workspace detected. Ensure the correct sub-directory or build target is specified.');
        }

        // --- Vite Build Intelligence ---
        if (deps['vite'] || deps['@vitejs/plugin-react'] || fileSet.has('vite.config.ts') || fileSet.has('vite.config.js')) {
          if (!scripts.build || scripts.build === 'tsc') {
            preflightFixes.push({ fix: 'SET_BUILD_CMD', value: 'npx vite build', reason: 'Vite detected but build script missing or set to tsc-only' });
          }
          if (!scripts.start && !scripts.preview) {
            preflightFixes.push({ fix: 'SET_START_CMD', value: 'npx serve -s dist -l 3000', reason: 'Vite SPA has no start/preview script — needs static file serving' });
          }
        }

        // --- Missing Start Script Detection ---
        if (!scripts.start && !scripts.preview && !scripts.dev && deployType === 'FRONTEND_SPA') {
          // Check if build outputs to dist/ or build/ based on common patterns
          preflightFixes.push({ fix: 'SET_START_CMD', value: 'npx serve -s dist -l 3000', reason: 'Frontend SPA has no start script — auto-configuring static server' });
        }

        // --- Existing dependency env detection (preserved exactly) ---
        if (deps['pg'] || deps['pg-pool'] || deps['sequelize'] || deps['prisma'] || deps['@prisma/client']) {
          requiredEnvVars.add('DATABASE_URL');
        }
        if (deps['redis'] || deps['ioredis'] || deps['bullmq']) {
          requiredEnvVars.add('REDIS_HOST');
          requiredEnvVars.add('REDIS_PORT');
        }
        if (deps['jsonwebtoken']) requiredEnvVars.add('JWT_SECRET');

        const scriptsStr = JSON.stringify(scripts);
        if (scriptsStr.includes('8080')) {
          detectedPort = 8080;
          warnings.push('Detected Port 8080 in scripts. MicrOps ALB auto-routes to Port 3000 by default.');
        }
      } catch (err) {
        warnings.push('Could not parse package.json JSON.');
      }
    }

    // --- TypeScript Awareness ---
    if (fileSet.has('tsconfig.json')) {
      const tsContent = await fetchFileContent(owner, repo, 'tsconfig.json');
      if (tsContent) {
        try {
          // Strip comments for JSON parsing (tsconfig allows comments)
          const stripped = tsContent.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
          const tsconfig = JSON.parse(stripped);
          const compilerOptions = tsconfig.compilerOptions || {};

          if (compilerOptions.strict === true && !compilerOptions.skipLibCheck) {
            warnings.push('TypeScript strict mode enabled without skipLibCheck. Third-party type errors may cause build failures.');
          }
          if (compilerOptions.noEmit === true) {
            warnings.push('tsconfig.json has noEmit: true. This may prevent build output generation if tsc is the build tool.');
          }
        } catch {
          // tsconfig parse failure is non-critical
        }
      }
    }

    return {
      runtime: 'Node.js',
      framework,
      detectedPort,
      requiredEnvVars: Array.from(requiredEnvVars),
      warnings,
      computeCostMonthly: 11.40,
      computeSpec: '0.25 vCPU / 512MB Fargate Spot',
      deployType,
      packageManager,
      preflightFixes,
    };
  },
};

export const PythonDetector: IDetector = {
  name: 'Python',
  canDetect: (fileSet) => fileSet.has('requirements.txt') || fileSet.has('pyproject.toml') || fileSet.has('Pipfile'),
  detect: async (owner, repo, fileSet): Promise<ActiveDetection> => {
    let framework = 'Python (Generic)';
    const requiredEnvVars = new Set<string>(['PORT']);
    const warnings: string[] = [];

    let content = null;
    if (fileSet.has('requirements.txt')) content = await fetchFileContent(owner, repo, 'requirements.txt');
    else if (fileSet.has('pyproject.toml')) content = await fetchFileContent(owner, repo, 'pyproject.toml');

    if (content) {
      const lower = content.toLowerCase();
      if (lower.includes('fastapi')) framework = 'FastAPI';
      else if (lower.includes('flask')) framework = 'Flask';
      else if (lower.includes('django')) framework = 'Django';

      if (lower.includes('psycopg') || lower.includes('asyncpg') || lower.includes('sqlalchemy')) {
        requiredEnvVars.add('DATABASE_URL');
      }
      if (lower.includes('redis')) requiredEnvVars.add('REDIS_URL');
    }

    return {
      runtime: 'Python',
      framework,
      detectedPort: 3000,
      requiredEnvVars: Array.from(requiredEnvVars),
      warnings,
      computeCostMonthly: 11.40,
      computeSpec: '0.25 vCPU / 512MB Fargate Spot',
    };
  },
};

export const GoDetector: IDetector = {
  name: 'Go',
  canDetect: (fileSet) => fileSet.has('go.mod'),
  detect: async (owner, repo, fileSet): Promise<ActiveDetection> => {
    let framework = 'Go (Generic)';
    const requiredEnvVars = new Set<string>(['PORT']);
    const warnings: string[] = [];

    const content = await fetchFileContent(owner, repo, 'go.mod');
    if (content) {
      const lower = content.toLowerCase();
      if (lower.includes('gin-gonic/gin')) framework = 'Gin HTTP';
      else if (lower.includes('gofiber/fiber')) framework = 'Fiber';
      else if (lower.includes('labstack/echo')) framework = 'Echo';

      if (lower.includes('gorm') || lower.includes('pgx') || lower.includes('lib/pq')) {
        requiredEnvVars.add('DATABASE_URL');
      }
    }

    return {
      runtime: 'Go',
      framework,
      detectedPort: 3000,
      requiredEnvVars: Array.from(requiredEnvVars),
      warnings,
      computeCostMonthly: 11.40,
      computeSpec: '0.25 vCPU / 512MB Fargate Spot',
    };
  },
};

export const JavaDetector: IDetector = {
  name: 'Java',
  canDetect: (fileSet) => fileSet.has('pom.xml') || fileSet.has('build.gradle'),
  detect: async (owner, repo, fileSet): Promise<ActiveDetection> => {
    let framework = 'Java (Generic)';
    const requiredEnvVars = new Set<string>(['PORT']);
    const warnings: string[] = [];

    if (fileSet.has('pom.xml')) {
      const content = await fetchFileContent(owner, repo, 'pom.xml');
      if (content && content.toLowerCase().includes('spring-boot')) {
        framework = 'Spring Boot';
        requiredEnvVars.add('SPRING_DATASOURCE_URL');
      }
    }

    return {
      runtime: 'Java',
      framework,
      detectedPort: 8080,
      requiredEnvVars: Array.from(requiredEnvVars),
      warnings: ['Java runtimes typically require higher RAM allocations.'],
      computeCostMonthly: 18.20,
      computeSpec: '0.5 vCPU / 1GB Fargate Spot',
    };
  },
};

export const detectorPlugins: IDetector[] = [NodeDetector, PythonDetector, GoDetector, JavaDetector];
