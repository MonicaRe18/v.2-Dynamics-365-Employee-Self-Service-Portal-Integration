import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { d365Router } from './src/server/d365Router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// JSON and URL-encoded parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Microsoft Dynamics 365 REST & OData API router
app.use('/api/d365', d365Router);

// Vite middleware in development vs static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[D365 Backend Server] Running on http://0.0.0.0:${port}`);
    console.log(`[D365 API Endpoints] Mounted at /api/d365`);
  });
}

startServer();
