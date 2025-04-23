import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { URL } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Map DATADOG_SITE to the correct intake origin
const SITE = process.env.DATADOG_SITE || 'datadoghq.com';
const ORIGINS = {
  'datadoghq.com':   'https://browser-intake-datadoghq.com',      // US1 (default)
  'us3.datadoghq.com':'https://browser-intake-us3-datadoghq.com', // US3
  'us5.datadoghq.com':'https://browser-intake-us5-datadoghq.com', // US5
  'datadoghq.eu':    'https://browser-intake-datadoghq.eu',       // EU1
  'ddog-gov.com':    'https://browser-intake-ddog-gov.com',       // US1-FED
  'ap1.datadoghq.com':'https://browser-intake-ap1-datadoghq.com', // AP1
};

const TARGET = ORIGINS[SITE] || ORIGINS['datadoghq.com'];

// 2) Debug logging toggle
const isDebug = (process.env.LOG_LEVEL || '').toLowerCase() === 'debug';

// --- 3) CORS & preflight ---
app.options('*', (req, res) =>
  res
    .set('Access-Control-Allow-Origin', '*')
    .set('Access-Control-Allow-Credentials', 'true')
    .set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
    .set('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization')
    .sendStatus(204)
);
app.use((req, res, next) => {
  res
    .set('Access-Control-Allow-Origin', '*')
    .set('Access-Control-Allow-Credentials', 'true')
    .set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
    .set('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization');
  next();
});

// --- 4) Proxy mount on /d ---
app.use(
  '/d',
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    secure: true,
    logLevel: isDebug ? 'debug' : 'silent',

    // rewrite URL path using ddforward
    pathRewrite: (path, req) => {
      const raw = req.query.ddforward;
      if (isDebug) console.debug('[proxy] raw ddforward:', raw);
      if (!raw) return path;  // missing → let it 404
      if (isDebug) console.debug('[proxy] rewritten to    :', raw);
      return raw;
    },

    // strip dd-api-key into header before sending upstream
    onProxyReq: (proxyReq, req, res) => {
      if (isDebug) console.debug('[proxy] final proxied URL:', proxyReq.path);
    },

    onError: (err, req, res) => {
      console.error('[proxy] error:', err);
      res.status(502).send('Bad gateway');
    },
  })
);

app.listen(PORT, () => {
  console.log(`Datadog proxy listening on 0.0.0.0:${PORT}/d → ${TARGET}`);
});

