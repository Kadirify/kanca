import { handle } from '@hono/node-server/vercel';
import { createApp } from '../apps/api/src/app.js';

export default handle(createApp());
