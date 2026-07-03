/* ── Cup of Joy — Shared Nav + Footer ── */

const FB = 'https://www.facebook.com/profile.php?id=61579999162949';
const IG = 'https://www.instagram.com/cupofjoy2506/';

const FB_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
const IG_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;

/* ── Detect current page ── */
const path = window.location.pathname.split('/').pop() || 'index.html';
const page = path.replace('.html', '') || 'index';

/* ── NAV ── */
document.body.insertAdjacentHTML('afterbegin', `
<nav id="mainNav">
  <a class="nav-logo" href="index.html">
    <img src="Logo.png" alt="Cup of Joy" />
  </a>
  <div class="nav-links-wrap">
    <ul class="nav-links">
      <li><a href="index.html"   class="${page === 'index'   ? 'active' : ''}">Home</a></li>
      <li><a href="menu.html"    class="${page === 'menu'    ? 'active' : ''}">Menu</a></li>
      <li><a href="about.html"   class="${page === 'about'   ? 'active' : ''}">About</a></li>
      <li><a href="contact.html" class="${page === 'contact' ? 'active' : ''}">Contact</a></li>
    </ul>
  </div>
  <div class="nav-actions">
    <a href="order-online.html" class="btn-order-online">Order Online</a>
    <button class="hamburger" id="hamburger" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<div class="mobile-menu" id="mobileMenu">
  <a href="index.html"   class="${page === 'index'   ? 'active' : ''}">Home</a>
  <a href="menu.html"    class="${page === 'menu'    ? 'active' : ''}">Menu</a>
  <a href="about.html"   class="${page === 'about'   ? 'active' : ''}">About</a>
  <a href="contact.html" class="${page === 'contact' ? 'active' : ''}">Contact</a>
  <a href="order-online.html" class="btn-order-online">Order Online</a>
</div>
`);

/* ── FOOTER ── */
document.body.insertAdjacentHTML('beforeend', `
<footer>
  <div class="footer-inner">
    <img src="Logo.png" alt="Cup of Joy" style="filter:brightness(0) invert(1);" />
    <p>📍 Rosario Town Plaza, Poblacion East, Rosario, La Union</p>
    <p>🛵 For deliveries, message us on Facebook!</p>
    <div class="footer-socials">
      <a href="${FB}" target="_blank" rel="noopener" class="social-btn fb">${FB_SVG} Facebook</a>
      <a href="${IG}" target="_blank" rel="noopener" class="social-btn ig">${IG_SVG} Instagram</a>
    </div>
    <div class="footer-links">
      <a href="index.html">Home</a>
      <a href="menu.html">Menu</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
    </div>
    <hr />
    <small>© 2024 Cup of Joy. Crafted with ☕ and 💛 in Rosario, La Union, Philippines.</small>
  </div>
</footer>
`);

/* ── Messenger Float Button ── */
document.body.insertAdjacentHTML('beforeend', `
<style>
  .messenger-float {
    position: fixed;
    bottom: 1.75rem;
    right: 1.75rem;
    z-index: 999;
    display: flex;
    align-items: center;
    gap: .65rem;
  }
  .messenger-tooltip {
    background: var(--brown);
    color: #fff;
    font-family: 'Nunito', sans-serif;
    font-size: .82rem;
    font-weight: 700;
    white-space: nowrap;
    padding: .45rem .9rem;
    border-radius: 50px;
    box-shadow: 0 4px 14px rgba(61,32,0,.28);
    opacity: 0;
    transform: translateX(8px);
    transition: opacity .22s ease, transform .22s ease;
    pointer-events: none;
  }
  .messenger-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--brown);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 18px rgba(61,32,0,.35);
    transition: background .2s, transform .2s, box-shadow .2s;
    flex-shrink: 0;
    text-decoration: none;
  }
  .messenger-float:hover .messenger-tooltip {
    opacity: 1;
    transform: translateX(0);
  }
  .messenger-float:hover .messenger-btn {
    background: #6b3a00;
    transform: scale(1.07);
    box-shadow: 0 8px 24px rgba(61,32,0,.4);
  }
  @media (max-width: 768px) {
    .messenger-float { bottom: 1.25rem; right: 1.25rem; }
    .messenger-tooltip { display: none; }
    .messenger-btn { width: 50px; height: 50px; }
  }
</style>
<div class="messenger-float">
  <span class="messenger-tooltip">Chat with us for orders!</span>
  <a class="messenger-btn"
     href="https://m.me/61579999162949"
     target="_blank"
     rel="noopener"
     aria-label="Chat with us on Messenger">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1C5.925 1 1 5.637 1 11.375c0 3.115 1.447 5.899 3.738 7.832V22l3.489-1.914A11.86 11.86 0 0 0 12 20.75c6.075 0 11-4.637 11-10.375C23 5.637 18.075 1 12 1Z" fill="white"/>
      <path d="m5.5 14.5 3.728-3.955 2.272 2.272 3.5-2.272 3.5 3.955-3.728-4.273-2.272 2.272-2.272-2.272L5.5 14.5Z" fill="#3D2000"/>
    </svg>
  </a>
</div>
`);

/* ── Scroll: transparent → solid ── */
const nav = document.getElementById('mainNav');
const heroPage = document.body.dataset.hero === 'true';

function updateNav() {
  if (heroPage) {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  } else {
    nav.classList.add('scrolled');
  }
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ── Hamburger ── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});
