const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'viplinetech.db');

let db;

async function getDb() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  initSchema();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT DEFAULT 'fas fa-cog',
      order_index INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
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
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      company TEXT,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
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
    )
  `);

  // Seed default data
  const adminCheck = db.exec("SELECT COUNT(*) as count FROM admins");
  const adminCount = adminCheck[0].values[0][0];
  
  if (adminCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('Admin@ViplineTech2026', 10);
    db.run("INSERT INTO admins (username, password, email) VALUES (?, ?, ?)", 
      ['ViplineTech', hashedPassword, 'viplinetech@gmail.com']);

    // Default services
    const services = [
      ['Software Development', 'Custom, scalable software built for your exact business needs — web apps, desktop tools, APIs, SaaS platforms and enterprise systems tailored from the ground up.', 'fas fa-code', 1],
      ['App Development', 'Native and cross-platform mobile applications for iOS and Android — fast, intuitive and built to delight users from day one.', 'fas fa-mobile-alt', 2],
      ['Website Design & UI/UX', 'Stunning, conversion-focused websites and interfaces — pixel-perfect design meets seamless user experience and blazing performance.', 'fas fa-palette', 3],
      ['Product Design', 'End-to-end product design from wireframes to high-fidelity prototypes — crafting digital experiences users love and businesses trust.', 'fas fa-pen-nib', 4],
      ['Ecommerce Solutions', 'Launch and scale powerful online stores with payment integration, inventory management and optimized shopping experiences that convert visitors to buyers.', 'fas fa-shopping-cart', 5],
      ['Digital Marketing & SEO', 'Data-driven digital marketing that grows your brand — SEO, social media management, content strategy and targeted paid campaigns.', 'fas fa-chart-line', 6],
    ];
    services.forEach(([title, desc, icon, idx]) => {
      db.run("INSERT INTO services (title, description, icon, order_index) VALUES (?, ?, ?, ?)", [title, desc, icon, idx]);
    });

    // Default settings
    const settings = [
      ['company_name', 'Vipline Technologies Limited'],
      ['tagline', 'Innovating the Future, One Solution at a Time'],
      ['hero_title', 'Technology & Digital Services for Nigeria and Beyond'],
      ['hero_subtitle', 'We build software, design experiences, power ecommerce, and create digital solutions that transform businesses across Africa.'],
      ['about_text', 'Vipline Technologies Limited is a registered technology and digital services company based in Port Harcourt, Rivers State, Nigeria. Founded in 2026, we are committed to delivering innovative, high-quality technology solutions that empower businesses and individuals to thrive in the digital economy. From software development to ecommerce, web design to music production — we bring expertise, creativity, and dedication to every project.'],
      ['phone', '+2347039369336'],
      ['email', 'viplinetech@gmail.com'],
      ['address', 'House 3, Cherry Drive, Ceedarwood Estate, SARS Road, Port Harcourt, Rivers State, Nigeria'],
      ['rc_number', 'RC 9644291'],
      ['facebook', '#'],
      ['twitter', '#'],
      ['instagram', '#'],
      ['linkedin', '#'],
      ['whatsapp', '+2347039369336'],
    ];
    settings.forEach(([key, value]) => {
      db.run("INSERT INTO site_settings (key, value) VALUES (?, ?)", [key, value]);
    });

    // Default testimonials
    const testimonials = [
      ['Emeka Okafor', 'CEO', 'Okafor Trading Ltd', 'Vipline Technologies transformed our business with a world-class ecommerce platform. Their attention to detail and professionalism is unmatched.', 5],
      ['Amina Yusuf', 'Marketing Director', 'Apex Digital Agency', 'The web design team at Vipline delivered beyond our expectations. Clean, modern, and incredibly fast.', 5],
      ['Chidi Nwosu', 'Founder', 'TechHub Port Harcourt', 'Outstanding software development team. They understood our vision and delivered a flawless product on time.', 5],
    ];
    testimonials.forEach(([name, role, company, content, rating]) => {
      db.run("INSERT INTO testimonials (name, role, company, content, rating) VALUES (?, ?, ?, ?, ?)", [name, role, company, content, rating]);
    });

    saveDb();
    addDynamicSettings();
  }
  // Always run to add any missing settings on existing installs
  addDynamicSettings();
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified() };
}

function get(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

module.exports = { getDb, query, run, get, saveDb };

// Call this to add new dynamic settings fields
function addDynamicSettings() {
  const newSettings = [
    ['hero_badge', 'CAC Registered · RC 9644291 · Port Harcourt, Nigeria'],
    ['hero_title_line1', 'We Build the'],
    ['hero_title_line2', 'Digital Future'],
    ['hero_title_line3', 'of Africa'],
    ['hero_subtitle', 'Nigeria\'s premier technology and digital services company — delivering world-class software, apps, websites and digital solutions that transform businesses across Africa.'],
    ['stat_1_number', '50'],
    ['stat_1_suffix', '+'],
    ['stat_1_label', 'Projects Delivered'],
    ['stat_2_number', '30'],
    ['stat_2_suffix', '+'],
    ['stat_2_label', 'Happy Clients'],
    ['stat_3_number', '6'],
    ['stat_3_suffix', ''],
    ['stat_3_label', 'Core Services'],
    ['stat_4_number', '100'],
    ['stat_4_suffix', '%'],
    ['stat_4_label', 'Client Satisfaction'],
    ['why_title', 'Built Different. Delivering More.'],
    ['why_subtitle', 'We don\'t just build products — we build partnerships. Every project is treated as our own, combining deep technical expertise, creative design thinking, and sharp business strategy.'],
    ['why_point_1_num', '01'],
    ['why_point_1_title', 'Agile & Rapid Delivery'],
    ['why_point_1_desc', 'Structured development cycles with transparent progress tracking and on-time delivery every time.'],
    ['why_point_2_num', '02'],
    ['why_point_2_title', 'End-to-End Solutions'],
    ['why_point_2_desc', 'From concept to launch and beyond — strategy, design, development, deployment and ongoing support.'],
    ['why_point_3_num', '03'],
    ['why_point_3_title', 'Nigeria-Rooted, World-Class'],
    ['why_point_3_desc', 'Deep understanding of the Nigerian and African market, combined with international standards.'],
    ['marquee_items', 'Software Development,App Development,Website Design & UI/UX,Product Design,Ecommerce Solutions,Digital Marketing,SEO Optimization,Cloud Solutions'],
    ['logo_dark_url',  ''],
    ['logo_light_url', ''],
    ['favicon_url',    ''],
    ['seo_description', 'ViplineTech is a CAC-registered technology company in Port Harcourt delivering software development, app development, website design, UI/UX, product design and digital marketing across Nigeria and Africa.'],
    ['about_heading', 'Pioneering Digital Innovation in Nigeria'],
    ['footer_tagline', 'A CAC-registered Nigerian technology company delivering world-class software, apps and digital solutions across Africa and beyond.'],
  ];

  newSettings.forEach(([key, value]) => {
    try {
      db.run('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)', [key, value]);
    } catch(e) {}
  });
  saveDb();
}
