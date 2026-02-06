import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
app.disable('x-powered-by');

const PORT = Number(process.env.PORT || 3001);
const SERVING_STATIC = process.env.SERVING_STATIC === '1' || process.env.NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

const DOLIBARR_API_URL = process.env.DOLIBARR_API_URL || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const CODA_API_TOKEN = process.env.CODA_API_TOKEN || '';
const CODA_DOC_ID = process.env.CODA_DOC_ID || '';
const CODA_TABLE_EMPRESAS = process.env.CODA_TABLE_EMPRESAS || '';
const CODA_TABLE_PRODUCTOS = process.env.CODA_TABLE_PRODUCTOS || '';
const CODA_TABLE_FACTURAS = process.env.CODA_TABLE_FACTURAS || '';

const CODA_COL_NOMBRE_EMPRESA = process.env.CODA_COL_NOMBRE_EMPRESA || '';
const CODA_COL_CIF_EMPRESA = process.env.CODA_COL_CIF_EMPRESA || '';
const CODA_COL_NOMBRE_PRODUCTO = process.env.CODA_COL_NOMBRE_PRODUCTO || '';
const CODA_COL_PRECIO_PRODUCTO = process.env.CODA_COL_PRECIO_PRODUCTO || '';
const CODA_COL_EMPRESA_FACTURA = process.env.CODA_COL_EMPRESA_FACTURA || '';
const CODA_COL_FECHA_FACTURA = process.env.CODA_COL_FECHA_FACTURA || '';
const CODA_COL_PRODUCTOS_FACTURA = process.env.CODA_COL_PRODUCTOS_FACTURA || '';
const CODA_COL_PRECIO_FACTURA = process.env.CODA_COL_PRECIO_FACTURA || '';

app.use(express.json({ limit: '1mb' }));

// CORS: en desarrollo Angular usa proxy (4200); en producción servimos todo en el mismo puerto.
const corsOrigin = SERVING_STATIC ? [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`] : ['http://localhost:4200'];
app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);

app.use(
  session({
    name: 'josemapp.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false // en producción detrás de HTTPS: true
    }
  })
);

function requireDolibarrSession(req, res, next) {
  if (!req.session?.dolibarrToken) {
    return res.status(401).json({ error: { message: 'No autenticado' } });
  }
  next();
}

function assertConfig(res, pairs) {
  const missing = pairs.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    res.status(500).json({
      error: { message: `BFF sin configurar. Faltan variables: ${missing.join(', ')}` }
    });
    return false;
  }
  return true;
}

// -------------------------
// Auth (Dolibarr) - cookie
// -------------------------
app.post('/bff/auth/login', async (req, res) => {
  if (!assertConfig(res, [['DOLIBARR_API_URL', DOLIBARR_API_URL]])) return;

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: { message: 'username y password son obligatorios' } });
  }

  const url = new URL(`${DOLIBARR_API_URL}/login`);
  url.searchParams.set('login', username);
  url.searchParams.set('password', password);

  const dolRes = await fetch(url.toString(), { method: 'GET' });
  const data = await dolRes.json().catch(() => ({}));

  if (!dolRes.ok || !data?.success?.token) {
    return res.status(401).json({ error: { message: 'Credenciales inválidas', details: data } });
  }

  req.session.dolibarrToken = data.success.token;
  req.session.username = username;

  // Devolvemos info sin token
  return res.json({
    success: {
      code: data.success.code,
      entity: data.success.entity,
      message: data.success.message
    }
  });
});

app.post('/bff/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('josemapp.sid');
    res.json({ success: true });
  });
});

app.get('/bff/auth/me', (req, res) => {
  const loggedIn = !!req.session?.dolibarrToken;
  res.json({ loggedIn, username: req.session?.username || null });
});

// -------------------------
// Dolibarr - fichajes proxy
// -------------------------
app.get('/bff/dolibarr/fichajes', requireDolibarrSession, async (req, res) => {
  if (!assertConfig(res, [['DOLIBARR_API_URL', DOLIBARR_API_URL]])) return;
  const url = `${DOLIBARR_API_URL}/fichajestrabajadoresapi/fichajes`;
  const dolRes = await fetch(url, {
    headers: {
      DOLAPIKEY: req.session.dolibarrToken
    }
  });
  const data = await dolRes.json().catch(() => ({}));
  res.status(dolRes.status).json(data);
});

async function dolibarrPost(req, res, path) {
  if (!assertConfig(res, [['DOLIBARR_API_URL', DOLIBARR_API_URL]])) return;
  const url = `${DOLIBARR_API_URL}${path}`;
  const dolRes = await fetch(url, {
    method: 'POST',
    headers: {
      DOLAPIKEY: req.session.dolibarrToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body || {})
  });
  const data = await dolRes.json().catch(() => ({}));
  res.status(dolRes.status).json(data);
}

app.post('/bff/dolibarr/registrarEntrada', requireDolibarrSession, (req, res) =>
  dolibarrPost(req, res, '/fichajestrabajadoresapi/registrarEntrada')
);
app.post('/bff/dolibarr/iniciarPausa', requireDolibarrSession, (req, res) =>
  dolibarrPost(req, res, '/fichajestrabajadoresapi/iniciarPausa')
);
app.post('/bff/dolibarr/terminarPausa', requireDolibarrSession, (req, res) =>
  dolibarrPost(req, res, '/fichajestrabajadoresapi/terminarPausa')
);
app.post('/bff/dolibarr/registrarSalida', requireDolibarrSession, (req, res) =>
  dolibarrPost(req, res, '/fichajestrabajadoresapi/registrarSalida')
);

// -------------------------
// DeepSeek - proxy seguro
// -------------------------
app.post('/bff/deepseek/chat/completions', async (req, res) => {
  if (!assertConfig(res, [['DEEPSEEK_API_KEY', DEEPSEEK_API_KEY]])) return;

  const payload = req.body || {};
  const model = payload.model || DEEPSEEK_MODEL;

  const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({ ...payload, model })
  });

  const data = await dsRes.json().catch(() => ({}));
  res.status(dsRes.status).json(data);
});

// -------------------------
// Coda - endpoints mínimos
// -------------------------
function codaHeaders() {
  return {
    Authorization: `Bearer ${CODA_API_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

async function codaGetRows(tableId) {
  const url = `https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${tableId}/rows`;
  const r = await fetch(url, { headers: codaHeaders() });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

function getValueByColumnId(values, columnId) {
  if (!values || !columnId) return null;
  return values[columnId] ?? null;
}

app.get('/bff/coda/empresas', async (req, res) => {
  if (
    !assertConfig(res, [
      ['CODA_API_TOKEN', CODA_API_TOKEN],
      ['CODA_DOC_ID', CODA_DOC_ID],
      ['CODA_TABLE_EMPRESAS', CODA_TABLE_EMPRESAS],
      ['CODA_COL_NOMBRE_EMPRESA', CODA_COL_NOMBRE_EMPRESA],
      ['CODA_COL_CIF_EMPRESA', CODA_COL_CIF_EMPRESA]
    ])
  )
    return;

  const { status, data } = await codaGetRows(CODA_TABLE_EMPRESAS);
  const items = Array.isArray(data?.items) ? data.items : [];
  const mapped = items.map((item) => ({
    id: item.id || '',
    nombre: getValueByColumnId(item.values, CODA_COL_NOMBRE_EMPRESA) || '',
    cif: getValueByColumnId(item.values, CODA_COL_CIF_EMPRESA) || ''
  }));
  res.status(status).json(mapped);
});

app.get('/bff/coda/productos', async (req, res) => {
  if (
    !assertConfig(res, [
      ['CODA_API_TOKEN', CODA_API_TOKEN],
      ['CODA_DOC_ID', CODA_DOC_ID],
      ['CODA_TABLE_PRODUCTOS', CODA_TABLE_PRODUCTOS],
      ['CODA_COL_NOMBRE_PRODUCTO', CODA_COL_NOMBRE_PRODUCTO],
      ['CODA_COL_PRECIO_PRODUCTO', CODA_COL_PRECIO_PRODUCTO]
    ])
  )
    return;

  const { status, data } = await codaGetRows(CODA_TABLE_PRODUCTOS);
  const items = Array.isArray(data?.items) ? data.items : [];
  const mapped = items.map((item) => ({
    id: item.id || '',
    nombre: getValueByColumnId(item.values, CODA_COL_NOMBRE_PRODUCTO) || '',
    precio: Number(getValueByColumnId(item.values, CODA_COL_PRECIO_PRODUCTO) || 0)
  }));
  res.status(status).json(mapped);
});

app.get('/bff/coda/facturas', async (req, res) => {
  if (
    !assertConfig(res, [
      ['CODA_API_TOKEN', CODA_API_TOKEN],
      ['CODA_DOC_ID', CODA_DOC_ID],
      ['CODA_TABLE_FACTURAS', CODA_TABLE_FACTURAS],
      ['CODA_COL_EMPRESA_FACTURA', CODA_COL_EMPRESA_FACTURA],
      ['CODA_COL_FECHA_FACTURA', CODA_COL_FECHA_FACTURA],
      ['CODA_COL_PRODUCTOS_FACTURA', CODA_COL_PRODUCTOS_FACTURA],
      ['CODA_COL_PRECIO_FACTURA', CODA_COL_PRECIO_FACTURA]
    ])
  )
    return;

  const { status, data } = await codaGetRows(CODA_TABLE_FACTURAS);
  const items = Array.isArray(data?.items) ? data.items : [];
  const mapped = items.map((item) => {
    const fechaRaw = getValueByColumnId(item.values, CODA_COL_FECHA_FACTURA);
    return {
      id: item.id || '',
      empresa: getValueByColumnId(item.values, CODA_COL_EMPRESA_FACTURA) || '',
      productos: getValueByColumnId(item.values, CODA_COL_PRODUCTOS_FACTURA) || [],
      total: Number(getValueByColumnId(item.values, CODA_COL_PRECIO_FACTURA) || 0),
      fecha: fechaRaw ? new Date(fechaRaw) : new Date()
    };
  });

  res.status(status).json(mapped);
});

async function codaAddRow(tableId, cells) {
  const url = `https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${tableId}/rows`;
  const payload = { rows: [{ cells }] };
  const r = await fetch(url, { method: 'POST', headers: codaHeaders(), body: JSON.stringify(payload) });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

app.post('/bff/coda/empresas', async (req, res) => {
  const { nombre, cif } = req.body || {};
  if (!nombre || !cif) return res.status(400).json({ error: { message: 'nombre y cif son obligatorios' } });
  if (
    !assertConfig(res, [
      ['CODA_API_TOKEN', CODA_API_TOKEN],
      ['CODA_DOC_ID', CODA_DOC_ID],
      ['CODA_TABLE_EMPRESAS', CODA_TABLE_EMPRESAS],
      ['CODA_COL_NOMBRE_EMPRESA', CODA_COL_NOMBRE_EMPRESA],
      ['CODA_COL_CIF_EMPRESA', CODA_COL_CIF_EMPRESA]
    ])
  )
    return;

  const { status, data } = await codaAddRow(CODA_TABLE_EMPRESAS, [
    { column: CODA_COL_NOMBRE_EMPRESA, value: nombre },
    { column: CODA_COL_CIF_EMPRESA, value: cif }
  ]);
  res.status(status).json(data);
});

app.post('/bff/coda/productos', async (req, res) => {
  const { nombre, precio } = req.body || {};
  if (!nombre || precio === undefined) return res.status(400).json({ error: { message: 'nombre y precio son obligatorios' } });
  if (
    !assertConfig(res, [
      ['CODA_API_TOKEN', CODA_API_TOKEN],
      ['CODA_DOC_ID', CODA_DOC_ID],
      ['CODA_TABLE_PRODUCTOS', CODA_TABLE_PRODUCTOS],
      ['CODA_COL_NOMBRE_PRODUCTO', CODA_COL_NOMBRE_PRODUCTO],
      ['CODA_COL_PRECIO_PRODUCTO', CODA_COL_PRECIO_PRODUCTO]
    ])
  )
    return;

  const { status, data } = await codaAddRow(CODA_TABLE_PRODUCTOS, [
    { column: CODA_COL_NOMBRE_PRODUCTO, value: nombre },
    { column: CODA_COL_PRECIO_PRODUCTO, value: precio }
  ]);
  res.status(status).json(data);
});

app.post('/bff/coda/facturas', async (req, res) => {
  const { empresa, fecha, productos, total } = req.body || {};
  if (!empresa || !fecha || !Array.isArray(productos) || total === undefined) {
    return res.status(400).json({ error: { message: 'empresa, fecha, productos[] y total son obligatorios' } });
  }
  if (
    !assertConfig(res, [
      ['CODA_API_TOKEN', CODA_API_TOKEN],
      ['CODA_DOC_ID', CODA_DOC_ID],
      ['CODA_TABLE_FACTURAS', CODA_TABLE_FACTURAS],
      ['CODA_COL_EMPRESA_FACTURA', CODA_COL_EMPRESA_FACTURA],
      ['CODA_COL_FECHA_FACTURA', CODA_COL_FECHA_FACTURA],
      ['CODA_COL_PRODUCTOS_FACTURA', CODA_COL_PRODUCTOS_FACTURA],
      ['CODA_COL_PRECIO_FACTURA', CODA_COL_PRECIO_FACTURA]
    ])
  )
    return;

  const { status, data } = await codaAddRow(CODA_TABLE_FACTURAS, [
    { column: CODA_COL_EMPRESA_FACTURA, value: empresa },
    { column: CODA_COL_FECHA_FACTURA, value: fecha },
    { column: CODA_COL_PRODUCTOS_FACTURA, value: productos },
    { column: CODA_COL_PRECIO_FACTURA, value: total }
  ]);
  res.status(status).json(data);
});

app.get('/health', (req, res) => res.json({ ok: true }));

// En despliegue unificado: servir la app Angular (SPA) desde el BFF
if (SERVING_STATIC) {
  const distRoot = path.join(__dirname, '..', '..', 'dist', 'josemapp');
  const browserPath = path.join(distRoot, 'browser');
  const servePath = fs.existsSync(browserPath) ? browserPath : distRoot;
  app.use(express.static(servePath, { index: false }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(servePath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`BFF escuchando en http://localhost:${PORT}${SERVING_STATIC ? ' (serviendo Angular)' : ''}`);
});

