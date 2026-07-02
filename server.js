require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ─────────────────────────────────
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'viplinetech_super_secret_2026_xK9#mP',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ── STATIC FILES ────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── ADMIN PROTECTION ────────────────────────────
app.use('/admin', (req, res, next) => {
  const publicFiles = ['/admin/login.html', '/admin/login'];
  if (publicFiles.some(p => req.path.endsWith(p.replace('/admin', ''))) || req.path === '/login.html') {
    return next();
  }
  if (req.path.match(/\.(css|js|png|jpg|ico|woff|woff2)$/)) return next();
  if (req.path === '/' || req.path === '/index.html' || req.path === '') {
    if (!req.session?.adminId) return res.redirect('/admin/login.html');
  }
  next();
});
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ── API ROUTES ──────────────────────────────────
const authRoutes = require('./routes/auth');
const apiRoutes  = require('./routes/api');
const adminRoutes = require('./routes/adminApi');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// ── HEALTH CHECK (used by keep-alive ping) ──────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    company: 'Vipline Technologies Limited',
    time: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's'
  });
});

// ── FALLBACK ────────────────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ────────────────────────────────────────
async function start() {
  const { getDb } = require('./database/db');
  const db = await getDb();
  console.log('✓ Database initialized');

  // ── AUTO-CREATE ADMIN ONLY IF NONE EXISTS ───────
  // This runs ONCE on fresh database, never overwrites existing admin
  try {
    const bcrypt = require('bcryptjs');
    const result = db.exec(`SELECT id FROM admins LIMIT 1`);
    const hasAdmin = result.length && result[0].values.length;
    if (!hasAdmin) {
      const hash = await bcrypt.hash('@ViplineTech@@', 12);
      db.run(`INSERT INTO admins (username, password, email) VALUES (?, ?, ?)`,
        ['ViplineTech', hash, 'viplinetech@gmail.com']);
      const { saveDb } = require('./database/db');
      saveDb();
      console.log('✓ Admin user created — username: ViplineTech');
    } else {
      console.log('✓ Admin user exists — skipping seed');
    }
  } catch(e) {
    console.warn('⚠ Admin setup skipped:', e.message);
  }

  app.listen(PORT, () => {
    console.log(`✓ Vipline Technologies running on http://localhost:${PORT}`);
    console.log(`✓ Admin panel: http://localhost:${PORT}/admin`);
    console.log(`✓ Health check: http://localhost:${PORT}/api/health`);

    // ── KEEP-ALIVE SELF PING ──────────────────────
    // Only runs in production (Railway) — not on localhost
    if (process.env.NODE_ENV === 'production' && process.env.SITE_URL) {
      const PING_INTERVAL = 14 * 60 * 1000; // every 14 minutes
      const SITE_URL = process.env.SITE_URL;

      setTimeout(() => {
        setInterval(async () => {
          try {
            const res = await fetch(`${SITE_URL}/api/health`);
            const data = await res.json();
            console.log(`✓ Keep-alive ping OK — uptime: ${data.uptime}`);
          } catch (err) {
            console.warn(`⚠ Keep-alive ping failed: ${err.message}`);
          }
        }, PING_INTERVAL);

        console.log(`✓ Keep-alive started — pinging ${SITE_URL} every 14 minutes`);
      }, 30000); // wait 30s after startup before first ping
    }
  });
}

start().catch(console.error);