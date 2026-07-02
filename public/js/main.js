'use strict';

// ── THEME ─────────────────────────────────────
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
html.setAttribute('data-theme', localStorage.getItem('vipline-theme') || 'dark');
themeToggle?.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('vipline-theme', next);
});

// ── PRELOADER ─────────────────────────────────
window.addEventListener('load', () => {
  loadAllContent().then(() => {
    setTimeout(() => {
      document.getElementById('preloader')?.classList.add('hidden');
      initCanvas();
      startCounters();
      AOS.refresh();
    }, 2200);
  });
});

// ── LOAD ALL FROM DB ──────────────────────────
async function loadAllContent() {
  await Promise.all([loadSettings(), loadServices(), loadTestimonials(), loadPortfolio()]);
}

// ── SETTINGS ──────────────────────────────────
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const s = await res.json();

    // ── PAGE TITLE & SEO ──
    if (s.seo_title) {
      document.title = s.seo_title;
      document.querySelector('meta[name="og:title"]')?.setAttribute('content', s.seo_title);
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', s.seo_title);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', s.seo_title);
    }
    if (s.seo_description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', s.seo_description);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', s.seo_description);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', s.seo_description);
    }

    // ── NAVBAR LOGO NAME ──
    const logoMain = document.querySelector('.logo-main');
    const logoSub  = document.querySelector('.logo-sub');
    if (s.company_name && logoMain) logoMain.textContent = s.company_name;
    if (s.tagline && logoSub) logoSub.textContent = s.tagline;

    // ── DYNAMIC LOGO IMAGE (dark + light) ──
    if (s.logo_dark_url || s.logo_light_url) {
      // Store URLs globally for theme toggle to use
      window._logoDark  = s.logo_dark_url  || '';
      window._logoLight = s.logo_light_url || '';

      // Build logo img element for navbar
      function buildLogoImg() {
        const isDark = html.getAttribute('data-theme') !== 'light';
        const url = isDark ? (window._logoDark || window._logoLight) : (window._logoLight || window._logoDark);
        if (!url) return null;
        const img = document.createElement('img');
        img.src = url;
        img.alt = s.company_name || 'ViplineTech';
        img.style.cssText = 'height:52px;max-width:220px;object-fit:contain;display:block';
        img.id = 'navLogoImg';
        return img;
      }

      // Replace SVG mark with image in navbar
      function applyNavLogo() {
        const navLogo = document.querySelector('.nav-logo');
        const mark = document.querySelector('.nav-logo-mark');
        const logoText = document.querySelector('.nav-logo .logo-text');
        if (!mark) return;
        const img = buildLogoImg();
        if (!img) return;
        // Replace SVG with real logo image
        const existing = document.getElementById('navLogoImg');
        if (existing) { existing.src = img.src; }
        else { mark.innerHTML = ''; mark.appendChild(img); }
        // Hide the text — logo image already has the name inside it
        if (logoText) logoText.style.display = 'none';
        // Make the mark full width of the logo area
        if (mark) mark.style.display = 'flex';
      }

      // Replace footer logo too
      function applyFooterLogo() {
        const footerMarks = document.querySelectorAll('.footer-logo .nav-logo-mark');
        footerMarks.forEach(mark => {
          const isDark = html.getAttribute('data-theme') !== 'light';
          const url = isDark ? (window._logoDark || window._logoLight) : (window._logoLight || window._logoDark);
          if (!url) return;
          const existing = mark.querySelector('img');
          if (existing) { existing.src = url; }
          else {
            const img = document.createElement('img');
            img.src = url;
            img.alt = s.company_name || 'ViplineTech';
            img.style.cssText = 'height:52px;max-width:220px;object-fit:contain;display:block';
            mark.innerHTML = '';
            mark.appendChild(img);
          }
          // Hide text in footer too
          const footerLogoText = mark.closest('.footer-logo')?.querySelector('.logo-text');
          if (footerLogoText) footerLogoText.style.display = 'none';
        });
      }

      applyNavLogo();
      applyFooterLogo();

      // Re-apply on theme toggle
      const origToggle = themeToggle?.onclick;
      themeToggle?.addEventListener('click', () => {
        setTimeout(() => { applyNavLogo(); applyFooterLogo(); }, 50);
      });
    }

    // ── FAVICON (dynamic swap) ──
    if (s.favicon_url) {
      const url = s.favicon_url;
      // Detect file type from URL
      const isPng = url.match(/\.png(\?|$)/i);
      const isIco = url.match(/\.ico(\?|$)/i);
      const isSvg = url.match(/\.svg(\?|$)/i);
      const type = isIco ? 'image/x-icon' : isPng ? 'image/png' : isSvg ? 'image/svg+xml' : 'image/png';

      // Remove ALL existing favicon links first
      document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']").forEach(el => el.remove());

      // Create fresh favicon link with correct type
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = type;
      link.href = url;
      document.head.appendChild(link);

      // Also add shortcut icon for older browsers
      const link2 = document.createElement('link');
      link2.rel = 'shortcut icon';
      link2.href = url;
      document.head.appendChild(link2);

      // Apple touch icon
      const link3 = document.createElement('link');
      link3.rel = 'apple-touch-icon';
      link3.href = url;
      document.head.appendChild(link3);
    }

    // ── STATS ──
    const stats = [
      { num: 'stat_1_number', suf: 'stat_1_suffix', lbl: 'stat_1_label' },
      { num: 'stat_2_number', suf: 'stat_2_suffix', lbl: 'stat_2_label' },
      { num: 'stat_3_number', suf: 'stat_3_suffix', lbl: 'stat_3_label' },
      { num: 'stat_4_number', suf: 'stat_4_suffix', lbl: 'stat_4_label' },
    ];
    const statItems = document.querySelectorAll('.stat-item');
    stats.forEach((keys, i) => {
      const el = statItems[i];
      if (!el) return;
      const numEl  = el.querySelector('.stat-num');
      const sufEl  = el.querySelector('.stat-suffix');
      const lblEl  = el.querySelector('.stat-label');
      if (numEl && s[keys.num]) { numEl.setAttribute('data-target', s[keys.num]); numEl.textContent = '0'; }
      if (sufEl && s[keys.suf] !== undefined) sufEl.textContent = s[keys.suf];
      if (lblEl && s[keys.lbl]) lblEl.textContent = s[keys.lbl];
    });

    // ── WHY CHOOSE US ──
    if (s.why_title) {
      const whyH2 = document.getElementById('why-heading');
      if (whyH2) whyH2.innerHTML = s.why_title.replace('Delivering More.', '<span class="gradient-text">Delivering More.</span>');
    }
    if (s.why_subtitle) {
      const whyP = document.querySelector('.why-text > p');
      if (whyP) whyP.textContent = s.why_subtitle;
    }
    const whyPoints = [
      { title: 'why_point_1_title', desc: 'why_point_1_desc', num: 'why_point_1_num' },
      { title: 'why_point_2_title', desc: 'why_point_2_desc', num: 'why_point_2_num' },
      { title: 'why_point_3_title', desc: 'why_point_3_desc', num: 'why_point_3_num' },
    ];
    const whyItems = document.querySelectorAll('.why-item');
    whyPoints.forEach((keys, i) => {
      const el = whyItems[i];
      if (!el) return;
      if (s[keys.num])   el.querySelector('.why-num').textContent   = s[keys.num];
      if (s[keys.title]) el.querySelector('h4').textContent          = s[keys.title];
      if (s[keys.desc])  el.querySelector('.why-content p').textContent = s[keys.desc];
    });

    // ── MARQUEE ──
    if (s.marquee_items) {
      const items = s.marquee_items.split(',').map(i => i.trim()).filter(Boolean);
      const doubled = [...items, ...items];
      const marquee = document.querySelector('.marquee-content');
      if (marquee) {
        marquee.innerHTML = doubled.map(item =>
          `<span>${esc(item)}</span><span class="sep">✦</span>`
        ).join('');
      }
    }

    // ── FOOTER COMPANY NAME ──
    document.querySelectorAll('[data-setting="company_name"]').forEach(el => {
      if (s.company_name) el.textContent = s.company_name;
    });
    const footerTagline = document.querySelector('.footer-brand > p');
    if (footerTagline && s.footer_tagline) footerTagline.textContent = s.footer_tagline;

    // ── CONTACT / SOCIAL ──
    document.querySelectorAll('[data-setting="phone"]').forEach(el => {
      if (s.phone) { el.textContent = s.phone; if (el.href !== undefined) el.href = 'tel:' + s.phone; }
    });
    document.querySelectorAll('[data-setting="email"]').forEach(el => {
      if (s.email) { el.textContent = s.email; if (el.href !== undefined) el.href = 'mailto:' + s.email; }
    });
    document.querySelectorAll('[data-setting="address"]').forEach(el => {
      if (s.address) el.textContent = s.address;
    });
    document.querySelectorAll('[data-setting="rc_number"]').forEach(el => {
      if (s.rc_number) el.textContent = s.rc_number;
    });
    if (s.whatsapp) {
      const waNum = s.whatsapp.replace(/\D/g, '');
      document.querySelectorAll('[data-setting="whatsapp"]').forEach(el => { el.href = 'https://wa.me/' + waNum; });
      const waFloat = document.querySelector('.whatsapp-float');
      if (waFloat) waFloat.href = 'https://wa.me/' + waNum;
    }
    ['facebook','twitter','instagram','linkedin'].forEach(p => {
      if (s[p] && s[p] !== '#') document.querySelectorAll(`[data-setting="${p}"]`).forEach(el => { el.href = s[p]; });
    });

    // ── ABOUT ──
    const aboutEl = document.getElementById('aboutText');
    if (aboutEl && s.about_text) aboutEl.textContent = s.about_text;

  } catch(e) { console.warn('Settings load failed:', e); }
}

// ── SERVICES ──────────────────────────────────
async function loadServices() {
  try {
    const res = await fetch('/api/services');
    const services = await res.json();
    if (!services.length) return;

    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    const iconColors = ['#0066FF','#00D4FF','#FFB800','#FF6B6B','#7C3AED','#22C55E'];
    grid.innerHTML = services.map((s, i) => `
      <div class="service-card ${i === 2 ? 'featured-service' : ''}" data-aos="fade-up" data-aos-delay="${i * 80}">
        ${i === 2 ? '<div class="featured-badge">Most Popular</div>' : ''}
        <div class="service-icon-wrap">
          <div class="service-icon" style="color:${iconColors[i % iconColors.length]}">
            <i class="${s.icon || 'fas fa-cog'}"></i>
          </div>
          <div class="service-icon-glow"></div>
        </div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description)}</p>
        
      </div>`).join('');

    // Update typed words
    words.length = 0;
    services.forEach(s => words.push(s.title));

    // Update footer services list
    const footerList = document.getElementById('footerServicesList');
    if (footerList) {
      footerList.innerHTML = services.map(s =>
        `<li><a href="#services">${esc(s.title)}</a></li>`).join('');
    }

    // Update contact form subject dropdown
    const select = document.getElementById('contactSubject');
    if (select) {
      const placeholder = select.querySelector('option[value=""]');
      select.innerHTML = '';
      if (placeholder) select.appendChild(placeholder);
      services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.title; opt.textContent = s.title;
        select.appendChild(opt);
      });
      const other = document.createElement('option');
      other.value = 'Other'; other.textContent = 'Other Inquiry';
      select.appendChild(other);
    }
  } catch(e) { console.warn('Services load failed:', e); }
}

// ── TESTIMONIALS ──────────────────────────────
async function loadTestimonials() {
  try {
    const res = await fetch('/api/testimonials');
    const testimonials = await res.json();
    if (!testimonials.length) return;
    const track = document.getElementById('testimonialsTrack');
    const dotsContainer = document.getElementById('sliderDots');
    if (!track || !dotsContainer) return;
    track.innerHTML = testimonials.map((t, i) => `
      <div class="testimonial-card ${i === 0 ? 'active' : ''}">
        <div class="testimonial-quote"><i class="fas fa-quote-left"></i></div>
        <p class="testimonial-text">"${esc(t.content)}"</p>
        <div class="testimonial-author">
          <div class="author-avatar">${esc(t.name).substring(0,2).toUpperCase()}</div>
          <div class="author-info">
            <strong>${esc(t.name)}</strong>
            <span>${t.role ? esc(t.role) : ''}${t.company ? ', ' + esc(t.company) : ''}</span>
          </div>
          <div class="author-stars">${'<i class="fas fa-star"></i>'.repeat(t.rating || 5)}</div>
        </div>
      </div>`).join('');
    dotsContainer.innerHTML = testimonials.map((_, i) =>
      `<div class="dot ${i === 0 ? 'active' : ''}"></div>`).join('');
    initSlider();
  } catch(e) { console.warn('Testimonials load failed:', e); }
}

// ── PORTFOLIO ─────────────────────────────────
async function loadPortfolio() {
  try {
    const res = await fetch('/api/portfolio');
    const items = await res.json();
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;

    // ── FILTER BUTTONS from DB categories ──
    const filtersEl = document.querySelector('.portfolio-filters');
    if (filtersEl) {
      if (items.length) {
        const cats = [...new Set(items.map(i => i.category))];
        filtersEl.innerHTML = `<button class="filter-btn active" data-filter="all">All Projects</button>` +
          cats.map(c => `<button class="filter-btn" data-filter="${c.toLowerCase()}">${esc(c)}</button>`).join('');
      }
      initFilters();
    }

    if (!items.length) return;
    const bgClasses = ['web-bg','ecom-bg','soft-bg','music-bg','web2-bg','soft2-bg'];
    const icons = ['fas fa-globe','fas fa-store','fas fa-laptop-code','fas fa-headphones','fas fa-mobile-alt','fas fa-chart-line'];

    // Store for modal use
    pfItems = items;

    grid.innerHTML = items.map((item, i) => `
      <div class="portfolio-item" data-category="${item.category.toLowerCase()}" data-aos="fade-up" data-aos-delay="${(i%3)*100}" style="cursor:pointer">
        <div class="portfolio-thumb">
          ${item.image_url
            ? `<div class="portfolio-real-img" style="background-image:url('${item.image_url}')"></div>`
            : `<div class="portfolio-placeholder ${bgClasses[i % bgClasses.length]}"><i class="${icons[i % icons.length]}"></i></div>`
          }
          <div class="portfolio-overlay">
            <div class="portfolio-overlay-content">
              <span class="portfolio-cat">${esc(item.category)}</span>
              <h4>${esc(item.title)}</h4>
              <p class="pf-click-hint"><i class="fas fa-expand-alt"></i> Click to view details</p>
            </div>
          </div>
        </div>
      </div>`).join('');

    initPortfolioClicks();
  } catch(e) { console.warn('Portfolio load failed:', e); }
}

// ── ESCAPE HTML ───────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── CUSTOM CURSOR ─────────────────────────────
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  if (dot) { dot.style.left = mouseX+'px'; dot.style.top = mouseY+'px'; }
});
function animateRing() {
  if (ring) {
    ringX += (mouseX-ringX)*0.12; ringY += (mouseY-ringY)*0.12;
    ring.style.left = ringX+'px'; ring.style.top = ringY+'px';
  }
  requestAnimationFrame(animateRing);
}
animateRing();
document.addEventListener('mouseover', e => {
  if (e.target.matches('a,button,.filter-btn,.slider-btn')) ring?.classList.add('hover');
  else ring?.classList.remove('hover');
});

// ── NAVBAR ────────────────────────────────────
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 60);
  updateActiveNav(); updateBackToTop();
});
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu?.classList.toggle('open');
  document.body.classList.toggle('menu-open');
});
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
    document.body.classList.remove('menu-open');
  });
});
function updateActiveNav() {
  const scrollPos = window.scrollY + 100;
  document.querySelectorAll('section[id]').forEach(section => {
    const link = document.querySelector(`.nav-link[href="#${section.id}"]`);
    if (link && scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

// ── BACK TO TOP ───────────────────────────────
const backToTop = document.getElementById('backToTop');
function updateBackToTop() { backToTop?.classList.toggle('visible', window.scrollY > 400); }
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── CANVAS PARTICLES ──────────────────────────
function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', () => { resize(); createParticles(); });
  function createParticles() {
    particles = Array.from({length:80}, () => ({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-0.5)*0.4, vy:(Math.random()-0.5)*0.4,
      size:Math.random()*2+0.5, opacity:Math.random()*0.5+0.1,
      color:Math.random()>0.5?'#0066FF':'#00D4FF'
    }));
  }
  createParticles();
  let mx=-1000,my=-1000;
  canvas.addEventListener('mousemove', e => { const r=canvas.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top; });
  function draw() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      const dx=p.x-mx,dy=p.y-my,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<100){p.x+=(dx/dist)*1.5;p.y+=(dy/dist)*1.5;}
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle=p.color; ctx.globalAlpha=p.opacity; ctx.fill();
    });
    ctx.globalAlpha=1;
    for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++){
      const a=particles[i],b=particles[j],dx=a.x-b.x,dy=a.y-b.y,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<120){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(0,102,255,${0.15*(1-dist/120)})`;ctx.lineWidth=0.5;ctx.stroke();}
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ── TYPED TEXT ────────────────────────────────
const typedEl = document.getElementById('typedText');
const words = ['Software Development','App Development','Website Design & UI/UX','Product Design','Ecommerce Solutions','Digital Marketing & SEO'];
let wordIdx=0,charIdx=0,isDeleting=false;
function typeEffect() {
  if (!typedEl) return;
  const current = words[wordIdx]||'';
  if (isDeleting) { typedEl.textContent=current.substring(0,--charIdx); }
  else { typedEl.textContent=current.substring(0,++charIdx); }
  if (!isDeleting && charIdx===current.length) setTimeout(()=>{isDeleting=true;},1800);
  if (isDeleting && charIdx===0) { isDeleting=false; wordIdx=(wordIdx+1)%words.length; }
  setTimeout(typeEffect, isDeleting?50:90);
}
setTimeout(typeEffect, 3500);

// ── COUNTERS ──────────────────────────────────
function startCounters() {
  document.querySelectorAll('.stat-num').forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    if (!target) return;
    let start=0;
    const step=target/(2000/16);
    const timer=setInterval(()=>{
      start=Math.min(start+step,target);
      counter.textContent=Math.floor(start);
      if(start>=target)clearInterval(timer);
    },16);
  });
}

// ── AOS ───────────────────────────────────────
AOS.init({duration:800,easing:'cubic-bezier(0.4,0,0.2,1)',once:true,offset:60});

// ── TESTIMONIALS SLIDER ───────────────────────
function initSlider() {
  let current=0;
  function show(idx) {
    const cards=document.querySelectorAll('.testimonial-card');
    const dots=document.querySelectorAll('.dot');
    if(!cards.length)return;
    idx=(idx+cards.length)%cards.length;
    cards.forEach(c=>c.classList.remove('active'));
    dots.forEach(d=>d.classList.remove('active'));
    cards[idx]?.classList.add('active');
    dots[idx]?.classList.add('active');
    current=idx;
  }
  document.getElementById('nextTestimonial')?.addEventListener('click',()=>show(current+1));
  document.getElementById('prevTestimonial')?.addEventListener('click',()=>show(current-1));
  document.addEventListener('click',e=>{
    if(e.target.classList.contains('dot')){
      const dots=[...document.querySelectorAll('.dot')];
      show(dots.indexOf(e.target));
    }
  });
  setInterval(()=>show(current+1),5000);
}
initSlider();

// ── PORTFOLIO MODAL ────────────────────────────
let pfItems = [];
let pfIndex = 0;
const bgClasses = ['web-bg','ecom-bg','soft-bg','music-bg','web2-bg','soft2-bg'];
const pfIcons   = ['fas fa-globe','fas fa-store','fas fa-laptop-code','fas fa-headphones','fas fa-mobile-alt','fas fa-chart-line'];

const pfOverlay = document.getElementById('portfolioModal');
const pfClose   = document.getElementById('pfModalClose');
const pfPrev    = document.getElementById('pfPrev');
const pfNext    = document.getElementById('pfNext');
const pfVisit   = document.getElementById('pfModalVisit');

function openPfModal(index) {
  if (!pfItems.length) return;
  pfIndex = ((index % pfItems.length) + pfItems.length) % pfItems.length;
  const item = pfItems[pfIndex];

  // Thumbnail — real image or gradient placeholder
  const thumb = document.getElementById('pfModalThumb');
  if (item.image_url) {
    thumb.innerHTML = `<div class="portfolio-real-img" style="background-image:url('${item.image_url}');min-height:320px;border-radius:var(--radius-xl) 0 0 var(--radius-xl)"></div>`;
  } else {
    const bg = bgClasses[pfIndex % bgClasses.length];
    const icon = pfIcons[pfIndex % pfIcons.length];
    thumb.innerHTML = `<div class="portfolio-placeholder ${bg}" style="min-height:320px;border-radius:var(--radius-xl) 0 0 var(--radius-xl);font-size:5rem;color:rgba(255,255,255,0.25)"><i class="${icon}"></i></div>`;
  }

  document.getElementById('pfModalCat').textContent = item.category || 'Project';
  document.getElementById('pfModalTitle').textContent = item.title || '';

  const tagsEl = document.getElementById('pfModalTags');
  const tags = item.tags ? item.tags.split(',') : [item.category];
  tagsEl.innerHTML = tags.filter(Boolean).map(t => `<span class="pf-modal-tag">${esc(t.trim())}</span>`).join('');

  document.getElementById('pfModalDesc').textContent = item.description || 'No description available.';

  const metaEl = document.getElementById('pfModalMeta');
  let mHTML = '';
  if (item.category) mHTML += `<div class="pf-meta-row"><i class="fas fa-tag"></i><span><strong>Category:</strong> ${esc(item.category)}</span></div>`;
  if (item.link)     mHTML += `<div class="pf-meta-row"><i class="fas fa-link"></i><span><strong>Live URL:</strong> <a href="${esc(item.link)}" target="_blank" style="color:var(--accent-cyan)">${esc(item.link)}</a></span></div>`;
  metaEl.innerHTML = mHTML;

  if (item.link) { pfVisit.href = item.link; pfVisit.style.display = 'inline-flex'; }
  else pfVisit.style.display = 'none';

  document.getElementById('pfModalDiscuss').onclick = () => {
    closePfModal();
    setTimeout(() => document.querySelector('#contact')?.scrollIntoView({behavior:'smooth'}), 300);
  };
  document.getElementById('pfNavCount').textContent = `${pfIndex + 1} / ${pfItems.length}`;
  pfOverlay?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePfModal() {
  pfOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

pfClose?.addEventListener('click', closePfModal);
pfOverlay?.addEventListener('click', e => { if (e.target === pfOverlay) closePfModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePfModal(); });
pfPrev?.addEventListener('click', () => openPfModal(pfIndex - 1));
pfNext?.addEventListener('click', () => openPfModal(pfIndex + 1));

function initPortfolioClicks() {
  document.querySelectorAll('.portfolio-item').forEach((el, i) => {
    el.style.cursor = 'pointer';
    el.onclick = () => openPfModal(i);
  });
}

// ── PORTFOLIO FILTERS ─────────────────────────
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      document.querySelectorAll('.portfolio-item').forEach(item => {
        const match = filter==='all' || item.getAttribute('data-category')===filter;
        item.classList.toggle('hidden',!match);
        if(match){item.style.animation='none';item.offsetHeight;item.style.animation='fadeUp 0.4s ease';}
      });
    });
  });
}
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.querySelectorAll('.wc-fill').forEach(f=>f.classList.add('animated')); });
},{threshold:0.3});
const whyStack=document.querySelector('.why-card-stack');
if(whyStack)observer.observe(whyStack);

// ── MATH CAPTCHA ──────────────────────────────
let captchaAnswer = 0;
function generateCaptcha() {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  if (op === '+') { a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1; answer = a+b; }
  else if (op === '-') { a = Math.floor(Math.random()*20)+10; b = Math.floor(Math.random()*10)+1; answer = a-b; }
  else { a = Math.floor(Math.random()*9)+2; b = Math.floor(Math.random()*9)+2; answer = a*b; }
  captchaAnswer = answer;
  const el = document.getElementById('captchaQ');
  if (el) el.textContent = `${a} ${op} ${b}`;
  const input = document.getElementById('captchaAnswer');
  if (input) input.value = '';
}
generateCaptcha();

// ── CONTACT FORM ──────────────────────────────
const contactForm=document.getElementById('contactForm');
const formAlert=document.getElementById('formAlert');
const submitBtn=document.getElementById('submitBtn');
contactForm?.addEventListener('submit',async e=>{
  e.preventDefault();

  // Validate captcha
  const captchaInput = document.getElementById('captchaAnswer');
  const captchaError = document.getElementById('captchaError');
  const userAnswer = parseInt(captchaInput?.value);
  if (isNaN(userAnswer) || userAnswer !== captchaAnswer) {
    captchaError?.classList.remove('hidden');
    captchaInput?.focus();
    generateCaptcha();
    return;
  }
  captchaError?.classList.add('hidden');

  submitBtn.disabled=true;
  submitBtn.querySelector('span').textContent='Sending...';
  try {
    const res=await fetch('/api/contact',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name:document.getElementById('contactName').value,
        email:document.getElementById('contactEmail').value,
        phone:document.getElementById('contactPhone').value,
        subject:document.getElementById('contactSubject').value,
        message:document.getElementById('contactMessage').value
      })
    });
    const result=await res.json();
    if(res.ok){
      showAlert('success','✓ Message sent! We\'ll get back to you within 24 hours.');
      contactForm.reset();
      generateCaptcha(); // refresh captcha after success
    } else showAlert('error',result.message||'Something went wrong. Please try again.');
  } catch { showAlert('error','Network error. Please check your connection and try again.'); }
  finally { submitBtn.disabled=false; submitBtn.querySelector('span').textContent='Send Message'; }
});
function showAlert(type,msg){
  if(!formAlert)return;
  formAlert.className=`form-alert ${type}`;
  formAlert.textContent=msg;
  setTimeout(()=>{formAlert.className='form-alert hidden';},5000);
}

// ── FOOTER YEAR ───────────────────────────────
const yearEl=document.getElementById('footerYear');
if(yearEl)yearEl.textContent=new Date().getFullYear();

// ── SMOOTH SCROLL ─────────────────────────────
// ── SMOOTH SCROLL (event delegation — works for dynamic content too) ──
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href === '#') return;
  const target = document.querySelector(href);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ── SITE PROTECTION ────────────────────────────────────────────────────────

(function() {

  // 1. Disable right-click context menu
  document.addEventListener('contextmenu', e => e.preventDefault());

  // 2. Disable text selection
  document.addEventListener('selectstart', e => e.preventDefault());

  // 3. Disable drag
  document.addEventListener('dragstart', e => e.preventDefault());

  // 4. Disable copy / cut
  document.addEventListener('copy', e => e.preventDefault());
  document.addEventListener('cut', e => e.preventDefault());

  // 5. Block keyboard shortcuts
  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();

    // Block F12
    if (e.key === 'F12') { e.preventDefault(); return false; }

    // Block Ctrl/Cmd combos: U (view source), S (save), A (select all),
    // C (copy), X (cut), P (print), Shift+I / Shift+J / Shift+C (devtools)
    if (e.ctrlKey || e.metaKey) {
      if (['u','s','a','c','x','p'].includes(key)) { e.preventDefault(); return false; }
      if (e.shiftKey && ['i','j','c'].includes(key)) { e.preventDefault(); return false; }
    }

    // Block Alt+F4 won't help but block Alt combos that open browser tools
    if (e.altKey && key === 'f4') { e.preventDefault(); return false; }
  });

  // 6. Disable print (Ctrl+P and window.print)
  window.addEventListener('beforeprint', e => e.preventDefault());
  const _print = window.print;
  window.print = function() { return false; };

  // 7. DevTools detection — blur and overlay page when devtools open
  const devtoolsOverlay = document.createElement('div');
  devtoolsOverlay.id = 'devtools-block';
  devtoolsOverlay.style.cssText = `
    display:none;position:fixed;inset:0;z-index:999999;
    background:#050A14;color:#fff;
    flex-direction:column;align-items:center;justify-content:center;
    font-family:sans-serif;text-align:center;
  `;
  devtoolsOverlay.innerHTML = `
    <div style="font-size:3rem;margin-bottom:16px">🔒</div>
    <h2 style="font-size:1.4rem;margin-bottom:8px;color:#0066FF">Access Restricted</h2>
    <p style="color:#aaa;font-size:0.9rem">This content is protected by ViplineTech.<br>Please close developer tools to continue.</p>
  `;
  document.body.appendChild(devtoolsOverlay);

  let devtoolsOpen = false;
  function checkDevTools() {
    const threshold = 160;
    const widthDiff  = window.outerWidth  - window.innerWidth  > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if (widthDiff || heightDiff) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        devtoolsOverlay.style.display = 'flex';
        document.body.style.filter = 'blur(10px)';
        document.body.style.pointerEvents = 'none';
      }
    } else {
      if (devtoolsOpen) {
        devtoolsOpen = false;
        devtoolsOverlay.style.display = 'none';
        document.body.style.filter = '';
        document.body.style.pointerEvents = '';
      }
    }
  }
  setInterval(checkDevTools, 1000);

  // 8. Disable image dragging
  document.querySelectorAll('img').forEach(img => {
    img.setAttribute('draggable', 'false');
    img.style.webkitUserDrag = 'none';
  });
  // Also catch dynamically added images
  const imgObserver = new MutationObserver(() => {
    document.querySelectorAll('img:not([draggable="false"])').forEach(img => {
      img.setAttribute('draggable', 'false');
    });
  });
  imgObserver.observe(document.body, { childList: true, subtree: true });

  // 9. CSS-level protection
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    img {
      -webkit-user-drag: none !important;

    }
    a, button, input, textarea, select, .service-link, .btn, [onclick],
    .service-card, .service-card *, .nav-link, .cta-btn {
      pointer-events: auto !important;
    }
    @media print {
      body { display: none !important; }
    }
  `;
  document.head.appendChild(style);

})();