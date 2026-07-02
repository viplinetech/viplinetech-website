const express = require('express');
const router = express.Router();

router.post('/contact', async (req, res) => {
  try {
    const { getDb, run } = require('../database/db');
    await getDb();
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address' });

    run('INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), phone?.trim() || null, subject?.trim() || null, message.trim()]);

    res.json({ success: true, message: 'Message received! We will get back to you within 24 hours.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.get('/services', async (req, res) => {
  try {
    const { getDb, query } = require('../database/db');
    await getDb();
    const services = query('SELECT * FROM services WHERE active = 1 ORDER BY order_index ASC');
    res.json(services);
  } catch (err) {
    res.status(500).json([]);
  }
});

router.get('/portfolio', async (req, res) => {
  try {
    const { getDb, query } = require('../database/db');
    await getDb();
    const items = query('SELECT * FROM portfolio WHERE active = 1 ORDER BY order_index ASC');
    res.json(items);
  } catch (err) {
    res.status(500).json([]);
  }
});

router.get('/testimonials', async (req, res) => {
  try {
    const { getDb, query } = require('../database/db');
    await getDb();
    const items = query('SELECT * FROM testimonials WHERE active = 1 ORDER BY id DESC');
    res.json(items);
  } catch (err) {
    res.status(500).json([]);
  }
});

router.get('/settings', async (req, res) => {
  try {
    const { getDb, query } = require('../database/db');
    await getDb();
    const rows = query('SELECT key, value FROM site_settings');
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (err) {
    res.status(500).json({});
  }
});

module.exports = router;
