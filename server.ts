import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync, ChildProcess } from 'child_process';
import http from 'http';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const BACKEND_PORT = 5000;
const isProduction = process.env.NODE_ENV === 'production';

let dotnetProcess: ChildProcess | null = null;

function checkBackendHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/d365/config`, { timeout: 1500 }, (res) => {
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startBackend(): Promise<void> {
  const alreadyRunning = await checkBackendHealth();
  if (alreadyRunning) {
    console.log(`[ASP.NET Core] Backend is already running and healthy on port ${BACKEND_PORT}. Reusing existing instance.`);
    return;
  }

  // Ensure port 5000 is completely freed from dead or hung processes
  try {
    execSync(`fuser -k ${BACKEND_PORT}/tcp || true`, { stdio: 'ignore' });
  } catch {
    // Ignore error if fuser is unavailable
  }

  return new Promise((resolve) => {
    console.log(`[ASP.NET Core] Spawning backend process on http://127.0.0.1:${BACKEND_PORT}...`);

    const backendEnv = {
      ...process.env,
      ASPNETCORE_URLS: `http://127.0.0.1:${BACKEND_PORT}`,
      ASPNETCORE_ENVIRONMENT: isProduction ? 'Production' : 'Development',
      D365Settings__UseDemoMode: 'false',
    };

    const binaryPath = path.resolve(__dirname, 'backend/bin/Release/net8.0/D365.Ess.Api.dll');
    let cmd = 'dotnet';
    let args: string[] = [];

    if (fs.existsSync(binaryPath)) {
      args = [binaryPath, `--urls=http://127.0.0.1:${BACKEND_PORT}`];
    } else {
      args = ['run', '--project', 'backend/D365.Ess.Api.csproj', `--urls=http://127.0.0.1:${BACKEND_PORT}`];
    }

    dotnetProcess = spawn(cmd, args, {
      cwd: path.resolve(__dirname, 'backend'),
      env: backendEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let resolved = false;

    dotnetProcess.stdout?.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Now listening on:')) {
        console.log(`[ASP.NET Core] Ready on port ${BACKEND_PORT}`);
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }
    });

    dotnetProcess.stderr?.on('data', (data) => {
      const errStr = data.toString().trim();
      if (errStr.includes('address already in use')) {
        console.warn(`[ASP.NET Core Warning] Port ${BACKEND_PORT} already in use. Checking health...`);
        checkBackendHealth().then((healthy) => {
          if (healthy && !resolved) {
            resolved = true;
            resolve();
          }
        });
      } else {
        console.error(`[ASP.NET Core Error] ${errStr}`);
      }
    });

    dotnetProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`[ASP.NET Core] Process exited with code ${code}`);
      }
    });

    // Fallback timer
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 3500);
  });
}

function proxyRequestToBackend(req: Request, res: Response) {
  const targetUrl = new URL(req.originalUrl || req.url, `http://127.0.0.1:${BACKEND_PORT}`);
  const headers = { ...req.headers };
  delete headers['host'];

  const proxyReq = http.request(
    targetUrl,
    {
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('[Proxy Error] Could not reach ASP.NET Core backend:', err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: 'خادم ASP.NET Core Web API غير متاح أو قيد التشغيل.',
          details: err.message,
        },
      });
    }
  });

  req.pipe(proxyReq);
}

async function startServer() {
  await startBackend();

  const app = express();
  const server = http.createServer(app);

  // Proxy /api and /swagger directly to ASP.NET Core backend
  app.use(['/api', '/swagger'], (req, res) => {
    proxyRequestToBackend(req, res);
  });

  // Setup Vite in Dev mode or serve static assets in Production
  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: { server },
        ws: { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[D365 ESS Portal] Dev server listening on http://0.0.0.0:${PORT} (Mode: ${isProduction ? 'Production' : 'Development'})`);
  });

  const cleanShutdown = () => {
    console.log('[D365 ESS Portal] Shutting down...');
    if (dotnetProcess) {
      dotnetProcess.kill('SIGTERM');
    }
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', cleanShutdown);
  process.on('SIGTERM', cleanShutdown);
}

startServer().catch((err) => {
  console.error('[D365 ESS Portal] Server startup failed:', err);
  if (dotnetProcess) {
    dotnetProcess.kill('SIGTERM');
  }
  process.exit(1);
});
