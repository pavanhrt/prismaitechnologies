/* ================================================================
   PRISM AI — main.js
   Shared behaviour for every page. Every block is guarded, so a page
   that has no marquee / form / mega-menu costs nothing and throws
   nothing. Loaded with `defer` on all pages.
   ================================================================ */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav: scroll state + mobile toggle ---------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');

  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close the panel after navigating (incl. same-page anchors).
    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- nav: services mega-menu ----------
     Hover opens on pointer devices; click/Enter works everywhere, so
     the menu is fully reachable by keyboard and on touch.           */
  var megaItem = document.querySelector('.nav__item');
  if (megaItem) {
    var trigger = megaItem.querySelector('.nav__trigger');
    var panel = megaItem.querySelector('.mega');
    var hoverable = window.matchMedia('(hover:hover) and (min-width:861px)');

    var setOpen = function (state) {
      megaItem.classList.toggle('open', state);
      if (trigger) trigger.setAttribute('aria-expanded', state ? 'true' : 'false');
    };

    if (trigger) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        setOpen(!megaItem.classList.contains('open'));
      });
    }

    megaItem.addEventListener('mouseenter', function () {
      if (hoverable.matches) setOpen(true);
    });
    megaItem.addEventListener('mouseleave', function () {
      if (hoverable.matches) setOpen(false);
    });

    // Click-away and Escape both dismiss.
    document.addEventListener('click', function (e) {
      if (!megaItem.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && megaItem.classList.contains('open')) {
        setOpen(false);
        if (trigger) trigger.focus();
      }
    });
    // Closing on blur-out keeps tab order sane.
    megaItem.addEventListener('focusout', function (e) {
      if (hoverable.matches && !megaItem.contains(e.relatedTarget)) setOpen(false);
    });
    if (panel) {
      panel.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { setOpen(false); });
      });
    }
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window && !reducedMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ---------- technologies marquee ----------
     Read from data-techs so a page can carry its own stack list.    */
  var track = document.getElementById('marqueeTrack');
  if (track) {
    var raw = track.getAttribute('data-techs');
    var techs = raw
      ? raw.split('|')
      : ['Next.js', 'TypeScript', 'TailwindCSS', 'shadcn/ui', 'Framer Motion', 'GSAP',
         'Three.js', 'React Three Fiber', 'FastAPI', 'PostgreSQL', 'Auth.js', 'Vercel'];
    var html = '';
    for (var r = 0; r < 2; r++) {
      techs.forEach(function (t) {
        html += '<span class="tech-pill glass">' + t + '</span>';
      });
    }
    track.innerHTML = html;
  }

  /* ---------- FAQ accordion ----------
     Animates to the measured height, then releases to `none` so the
     answer can reflow if the viewport changes while it is open.     */
  var faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(function (item) {
    var q = item.querySelector('.faq__q');
    var a = item.querySelector('.faq__a');
    if (!q || !a) return;

    q.addEventListener('click', function () {
      var open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        a.style.maxHeight = a.scrollHeight + 'px';
        a.addEventListener('transitionend', function once() {
          if (item.classList.contains('open')) a.style.maxHeight = 'none';
          a.removeEventListener('transitionend', once);
        });
      } else {
        a.style.maxHeight = a.scrollHeight + 'px';
        requestAnimationFrame(function () { a.style.maxHeight = '0px'; });
      }
    });
  });

  /* ---------- contact form ----------
     Static hosting has no mail server, so this composes a mailto:
     draft. Swap for a Netlify Form or an API endpoint when ready —
     see the note in contact.html.                                   */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var get = function (n) { return form[n] ? form[n].value.trim() : ''; };
      var name = get('name');
      var email = get('email');
      var type = get('type');
      var message = get('message');

      if (!name || !email || !message) {
        if (status) status.textContent = 'Add your name, email, and a short brief before sending.';
        return;
      }

      var lines = [
        'Name: ' + name,
        'Email: ' + email,
        get('company') ? 'Company: ' + get('company') : '',
        get('phone') ? 'Phone: ' + get('phone') : '',
        'Project type: ' + type,
        '',
        message
      ].filter(Boolean).join('\n');

      window.location.href = 'mailto:mpawangangireddy@gmail.com'
        + '?subject=' + encodeURIComponent('New project brief: ' + type)
        + '&body=' + encodeURIComponent(lines);

      if (status) status.textContent = 'Opening your email client with this brief ready to send.';
    });
  }

  /* ---------- current year in footer ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
