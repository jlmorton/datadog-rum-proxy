import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

const DATADOG_SITE = process.env.DATADOG_SITE || 'datadoghq.com';
const DATADOG_INTAKE_ORIGINS = {
  'datadoghq.com': 'https://browser-intake-datadoghq.com',
  'us3.datadoghq.com': 'https://browser-intake-us3-datadoghq.com',
  'us5.datadoghq.com': 'https://browser-intake-us5-datadoghq.com',
  'datadoghq.eu': 'https://browser-intake-datadoghq.eu',
  'ddog-gov.com': 'https://browser-intake-ddog-gov.com',
  'ap1.datadoghq.com': 'https://browser-intake-ap1-datadoghq.com',
};
const DATADOG_INTAKE = DATADOG_INTAKE_ORIGINS[DATADOG_SITE] || DATADOG_INTAKE_ORIGINS['datadoghq.com'];

// CORS middleware
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.set('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// parse JSON bodies (Datadog RUM always sends JSON)
app.use(express.json());

app.all('/d', async (req, res) => {
  const ddforward = req.query.ddforward;
  if (!ddforward) {
    return res.status(400).send('Missing `ddforward` query parameter');
  }

  const targetUrl = `${DATADOG_INTAKE}${ddforward}`;

  // clone headers and remove host/cookie so fetch can set it correctly
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.cookie;

  // Add X-Forwarded-For for geoIP accuracy
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (clientIp) {
    headers['x-forwarded-for'] = clientIp;
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method)
        ? undefined
        : JSON.stringify(req.body),
    });

    // mirror status
    res.status(response.status);

    // forward all response headers from Datadog (plus our CORS headers already set)
    response.headers.forEach((val, name) => {
      res.set(name, val);
    });

    // stream body back without deprecation warning
    const arrayBuf = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuf));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).send('Bad gateway');
  }
});

app.listen(PORT, () => {
  console.log(`Datadog proxy listening on port ${PORT}`);
});

