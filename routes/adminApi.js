const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session?.adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  next();
};
router.use(requireAuth);

// ── DB HELPER ─────────────────────────────────
const db = () => require('../database/db');

// ── STATS ─────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const { getDb, get, query } = db();
    await getDb();
    const services = get('SELECT COUNT(*) as c FROM services WHERE active=1')?.c || 0;
    const portfolio = get('SELECT COUNT(*) as c FROM portfolio WHERE active=1')?.c || 0;
    const messages = get('SELECT COUNT(*) as c FROM messages')?.c || 0;
    const unread = get('SELECT COUNT(*) as c FROM messages WHERE read=0')?.c || 0;
    const recentMessages = query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 5');
    res.json({ services, portfolio, messages, unread, recentMessages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SERVICES ──────────────────────────────────
router.get('/services', async (req, res) => {
  const { getDb, query } = db(); await getDb();
  res.json(query('SELECT * FROM services ORDER BY order_index'));
});
router.post('/services', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  const { title, description, icon, order_index, active } = req.body;
  if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required' });
  run('INSERT INTO services (title,description,icon,order_index,active) VALUES (?,?,?,?,?)',
    [title, description, icon||'fas fa-cog', order_index||0, active??1]);
  res.json({ success: true });
});
router.put('/services/:id', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  const { title, description, icon, order_index, active } = req.body;
  run('UPDATE services SET title=?,description=?,icon=?,order_index=?,active=? WHERE id=?',
    [title, description, icon, order_index||0, active??1, req.params.id]);
  res.json({ success: true });
});
router.delete('/services/:id', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  run('DELETE FROM services WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ── PORTFOLIO ─────────────────────────────────
router.get('/portfolio', async (req, res) => {
  const { getDb, query } = db(); await getDb();
  res.json(query('SELECT * FROM portfolio ORDER BY order_index'));
});
router.post('/portfolio', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  const { title, description, category, link, image_url, order_index, active } = req.body;
  if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required' });
  run('INSERT INTO portfolio (title,description,category,link,image_url,order_index,active) VALUES (?,?,?,?,?,?,?)',
    [title, description, category||'General', link||null, image_url||null, order_index||0, active??1]);
  res.json({ success: true });
});
router.put('/portfolio/:id', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  const { title, description, category, link, image_url, order_index, active } = req.body;
  run('UPDATE portfolio SET title=?,description=?,category=?,link=?,image_url=?,order_index=?,active=? WHERE id=?',
    [title, description, category, link||null, image_url||null, order_index||0, active??1, req.params.id]);
  res.json({ success: true });
});
router.delete('/portfolio/:id', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  run('DELETE FROM portfolio WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ── TESTIMONIALS ──────────────────────────────
router.get('/testimonials', async (req, res) => {
  const { getDb, query } = db(); await getDb();
  res.json(query('SELECT * FROM testimonials ORDER BY id DESC'));
});
router.post('/testimonials', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  const { name, company, role, content, rating, active } = req.body;
  if (!name || !content) return res.status(400).json({ success: false, message: 'Name and content required' });
  run('INSERT INTO testimonials (name,company,role,content,rating,active) VALUES (?,?,?,?,?,?)',
    [name, company||null, role||null, content, rating||5, active??1]);
  res.json({ success: true });
});
router.put('/testimonials/:id', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  const { name, company, role, content, rating, active } = req.body;
  run('UPDATE testimonials SET name=?,company=?,role=?,content=?,rating=?,active=? WHERE id=?',
    [name, company||null, role||null, content, rating||5, active??1, req.params.id]);
  res.json({ success: true });
});
router.delete('/testimonials/:id', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  run('DELETE FROM testimonials WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ── TEAM ──────────────────────────────────────
router.get('/team', async (req, res) => {
  const { getDb, query } = db(); await getDb();
  res.json(query('SELECT * FROM team_members ORDER BY order_index'));
});
router.post('/team', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  const { name, role, bio, linkedin, twitter, order_index, active } = req.body;
  if (!name || !role) return res.status(400).json({ success: false, message: 'Name and role required' });
  run('INSERT INTO team_members (name,role,bio,linkedin,twitter,order_index,active) VALUES (?,?,?,?,?,?,?)',
    [name, role, bio||null, linkedin||null, twitter||null, order_index||0, active??1]);
  res.json({ success: true });
});
router.put('/team/:id', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  const { name, role, bio, linkedin, twitter, order_index, active } = req.body;
  run('UPDATE team_members SET name=?,role=?,bio=?,linkedin=?,twitter=?,order_index=?,active=? WHERE id=?',
    [name, role, bio||null, linkedin||null, twitter||null, order_index||0, active??1, req.params.id]);
  res.json({ success: true });
});
router.delete('/team/:id', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  run('DELETE FROM team_members WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ── MESSAGES ──────────────────────────────────
router.get('/messages', async (req, res) => {
  const { getDb, query } = db(); await getDb();
  res.json(query('SELECT * FROM messages ORDER BY created_at DESC'));
});
router.get('/messages/:id', async (req, res) => {
  const { getDb, get } = db(); await getDb();
  const msg = get('SELECT * FROM messages WHERE id=?', [req.params.id]);
  if (!msg) return res.status(404).json({ success: false, message: 'Not found' });
  res.json(msg);
});
router.put('/messages/:id/read', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  run('UPDATE messages SET read=1 WHERE id=?', [req.params.id]);
  res.json({ success: true });
});
router.delete('/messages/:id', async (req, res) => {
  const { getDb, run } = db(); await getDb();
  run('DELETE FROM messages WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ── SETTINGS ──────────────────────────────────
router.get('/settings', async (req, res) => {
  const { getDb, query } = db(); await getDb();
  const rows = query('SELECT key, value FROM site_settings');
  const s = {}; rows.forEach(r => s[r.key] = r.value);
  res.json(s);
});
router.put('/settings', async (req, res) => {
  try {
    const { getDb, run } = db(); await getDb();
    Object.entries(req.body).forEach(([key, value]) => {
      run('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?, updated_at=CURRENT_TIMESTAMP',
        [key, value, value]);
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── ACCOUNT ───────────────────────────────────
router.put('/account/password', async (req, res) => {
  try {
    const { getDb, get, run } = db(); await getDb();
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });

    const admin = get('SELECT * FROM admins WHERE id=?', [req.session.adminId]);
    if (!admin) return res.status(404).json({ success: false, message: 'Account not found' });

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    run('UPDATE admins SET password=? WHERE id=?', [hashed, req.session.adminId]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
