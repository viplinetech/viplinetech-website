const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DB_URL || 'libsql://viplinetech-viplinetech.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODMwMDkyNDIsImlkIjoiMDE5ZjIzYTAtYTMwMS03OTdmLTk2ODMtM2VlZWUwNDgyY2M4Iiwia2lkIjoiLXRQUnhhYUNmOWgzSkRyMDZnSkMyMUFXWUNpQnJIY3NlMHZQU005WjFOYyIsInJpZCI6IjFmMGUxNDQ5LWVjYWEtNGZjMC1iNzY4LWNlODc1MDI0MWZmMCJ9.fYxFFw8jd8JjdmIhx0G4tI8ZTmYkHAmmhfLgYFtuVAFlRFkHdxldUglC3_2jpaOjHJ6PK94qi8mqbRQdtATvBQ',
});

let initialized = false;

async function getDb() {
  if (!initialized) {
    await initSchema();
    initialized = true;
  }
  return client;
}

async function initSchema() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT DEFAULT 'fas fa-cog',
      order_index INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      image_url TEXT,
      link TEXT,
      order_index INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      company TEXT,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT,
      image_url TEXT,
      linkedin TEXT,
      twitter TEXT,
      order_index INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data if empty
  const adminCheck = await client.execute('SELECT COUNT(*) as count FROM admins');
  const adminCount = adminCheck.rows[0].count;

  if (adminCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('@ViplineTech@@', 10);

    await client.execute({
      sql: 'INSERT INTO admins (username, password, email) VALUES (?, ?, ?)',
      args: ['ViplineTech', hashedPassword, 'viplinetech@gmail.com']
    });

    // Default services
    const services = [
      ['Custom Software Engineering', 'We design and build scalable, high-performance software tailored to your exact business needs, from web applications and APIs to enterprise systems and SaaS platforms built to grow with you.', 'fas fa-code', 1],
      ['Mobile App Development', 'We craft native and cross-platform mobile apps for iOS and Android that are fast, intuitive and built to deliver exceptional user experiences from day one.', 'fas fa-mobile-alt', 2],
      ['Website Design & Development', 'We build stunning, high-performance websites that combine pixel-perfect design with seamless functionality, optimized for speed, SEO and conversion across all devices.', 'fas fa-palette', 3],
      ['UI/UX & Product Design', 'From wireframes to high-fidelity prototypes, we design digital products that users love, blending research-driven UX thinking with bold, modern visual design.', 'fas fa-pen-nib', 4],
      ['Ecommerce Solutions', 'We build and scale powerful online stores with secure payment integration, inventory management and conversion-optimized shopping experiences that turn visitors into loyal customers.', 'fas fa-shopping-cart', 5],
      ['Digital Marketing & SEO', 'We grow your brand online through data-driven strategies: search engine optimization, social media management, content marketing and targeted paid campaigns that deliver real results.', 'fas fa-chart-line', 6],
    ];
    for (const [title, desc, icon, idx] of services) {
      await client.execute({
        sql: 'INSERT INTO services (title, description, icon, order_index) VALUES (?, ?, ?, ?)',
        args: [title, desc, icon, idx]
      });
    }

    // Default settings
    const settings = [
      ['company_name', 'Vipline Technologies Limited'],
      ['tagline', 'Innovating Africa\'s Digital Future'],
      ['hero_title', 'Technology & Digital Services for Nigeria and Beyond'],
      ['hero_subtitle', 'We build software, design experiences, power ecommerce, and create digital solutions that transform businesses across Africa.'],
      ['about_text', 'Vipline Technologies Limited is a registered technology and digital services company based in Nigeria. Founded in 2026, we are committed to delivering innovative, high-quality technology solutions that empower businesses and individuals to thrive in the digital economy.'],
      ['phone', '+2347039369336'],
      ['email', 'viplinetech@gmail.com'],
      ['address', 'House 3, Cherry Drive, Ceedarwood Estate, SARS Road, Nigeria'],
      ['rc_number', 'RC 9644291'],
      ['facebook', '#'],
      ['twitter', '#'],
      ['instagram', '#'],
      ['linkedin', '#'],
      ['whatsapp', '+2347039369336'],
      ['hero_badge', 'CAC Registered · RC 9644291 · Nigeria'],
      ['hero_title_line1', 'We Build the'],
      ['hero_title_line2', 'Digital Future'],
      ['hero_title_line3', 'of Africa'],
      ['stat_1_number', '50'], ['stat_1_suffix', '+'], ['stat_1_label', 'Projects Delivered'],
      ['stat_2_number', '30'], ['stat_2_suffix', '+'], ['stat_2_label', 'Happy Clients'],
      ['stat_3_number', '6'],  ['stat_3_suffix', ''],  ['stat_3_label', 'Core Services'],
      ['stat_4_number', '100'],['stat_4_suffix', '%'], ['stat_4_label', 'Client Satisfaction'],
      ['logo_dark_url', ''], ['logo_light_url', ''], ['favicon_url', ''],
      ['footer_tagline', 'A CAC-registered Nigerian technology company delivering world-class software, apps and digital solutions across Africa and beyond.'],
      ['seo_description', 'ViplineTech is a CAC-registered technology company in Nigeria delivering software development, app development, website design, UI/UX, product design and digital marketing across Nigeria and Africa.'],
    ];
    for (const [key, value] of settings) {
      await client.execute({
        sql: 'INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)',
        args: [key, value]
      });
    }

    // Default testimonials
    const testimonials = [
      ['Emeka Okafor', 'CEO', 'Okafor Trading Ltd', 'Vipline Technologies transformed our business with a world-class ecommerce platform. Their attention to detail and professionalism is unmatched.', 5],
      ['Amina Yusuf', 'Marketing Director', 'Apex Digital Agency', 'The web design team at Vipline delivered beyond our expectations. Clean, modern, and incredibly fast.', 5],
      ['Chidi Nwosu', 'Founder', 'TechHub Nigeria', 'Outstanding software development team. They understood our vision and delivered a flawless product on time.', 5],
    ];
    for (const [name, role, company, content, rating] of testimonials) {
      await client.execute({
        sql: 'INSERT INTO testimonials (name, role, company, content, rating) VALUES (?, ?, ?, ?, ?)',
        args: [name, role, company, content, rating]
      });
    }

    console.log('✓ Database seeded with default data');
  }

  // Backfill SEO settings keys for installs seeded before these fields existed
  const seoDefaults = [
    ['seo_title', 'ViplineTech | Custom Software Development, Web Design, Mobile Apps & Digital Solutions Worldwide'],
    ['seo_keywords', 'software development Nigeria, web design Nigeria, mobile app development Nigeria, UI UX design Nigeria, ecommerce development Africa, digital marketing Nigeria, custom software company Nigeria, tech company Nigeria, ViplineTech, Vipline Technologies'],
    ['og_image_url', 'https://www.viplinetech.com/og-image.jpg'],
    ['twitter_image_url', 'https://www.viplinetech.com/og-image.jpg'],
    ['seo_robots', 'index'],
  ];
  for (const [key, value] of seoDefaults) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)',
      args: [key, value]
    });
  }
}

async function query(sql, params = []) {
  const result = await client.execute({ sql, args: params });
  return result.rows;
}

async function run(sql, params = []) {
  const result = await client.execute({ sql, args: params });
  return { changes: result.rowsAffected, lastInsertRowid: result.lastInsertRowid };
}

async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

function saveDb() {
  // No-op for Turso — data is saved automatically in the cloud
  return Promise.resolve();
}

module.exports = { getDb, query, run, get, saveDb };