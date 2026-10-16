import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from './app.js';

const app = createApp();
const port = Number(process.env.PORT ?? 3010);
const webDir = process.env.WEB_DIR ?? resolve(process.cwd(), '../web/dist');

if (existsSync(webDir)) {
  app.use('/*', serveStatic({ root: webDir, rewriteRequestPath: (p) => p }));
  app.get('/*', serveStatic({ root: webDir, path: 'index.html' }));
}

serve({ fetch: app.fetch, port }, () => {
  console.log(`kanca api :${port}${existsSync(webDir) ? ' (web dahil)' : ''}`);
});
