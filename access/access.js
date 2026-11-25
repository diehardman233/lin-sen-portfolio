// A temporary browsing gate, not server-side access control.
(() => {
  'use strict';
  const root = document.documentElement;
  const key = 'sen-portfolio-access-v1';
  const digest = '5c0342a8477e6bb1ccf977489f3d7e047927a055f791b2d15375f3feb1475d0b';
  let granted = false;
  try { granted = sessionStorage.getItem(key) === digest; } catch {}
  const access = window.PortfolioAccess = { locked: !granted };
  root.classList.toggle('access-locked', access.locked);
  let destination = '', replay = null, dialog, input, error, submit, quietUntil = 0;
  const protectedHash = hash => !!hash && hash !== '#home' && hash !== '#';
  function captureRoute(event) {
    if (!access.locked || !protectedHash(location.hash)) return;
    replay = null;
    destination = location.hash;
    history.replaceState(null, '', location.pathname + location.search + '#home');
    event?.stopImmediatePropagation();
    if (dialog) requestAccess();
  }
  captureRoute();
  window.addEventListener('hashchange', captureRoute, true);
  window.addEventListener('popstate', captureRoute, true);
  function requestAccess() {
    if (!access.locked || !dialog || dialog.open) return;
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    dialog.showModal();
    input.focus({ preventScroll: true });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.animate([{ opacity: 0, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'none' }],
        { duration: 280, easing: 'cubic-bezier(.2,.75,.2,1)' });
    }
  }
  document.addEventListener('click', event => {
    if (!access.locked || dialog?.contains(event.target)) return;
    const control = event.target.closest('a[href], .resume-toggle');
    if (!control) return;
    const hash = control.getAttribute('href');
    if (control.matches('.resume-toggle') || protectedHash(hash?.startsWith('#') ? hash : '')) {
      event.preventDefault(); event.stopImmediatePropagation();
      replay = control.matches('.resume-toggle') ? control : null;
      destination = replay ? '' : hash;
      requestAccess();
    }
  }, true);
  function scrollRequest() {
    if (access.locked && !dialog?.open && performance.now() > quietUntil) {
      replay = null; destination = '#work'; requestAccess();
    }
  }
  window.addEventListener('wheel', event => { if (event.deltaY > 1) scrollRequest(); }, { passive: true });
  let touchY = null;
  window.addEventListener('touchstart', event => { touchY = event.touches[0]?.clientY; }, { passive: true });
  window.addEventListener('touchend', event => {
    if (touchY !== null && touchY - event.changedTouches[0]?.clientY > 45) scrollRequest();
    touchY = null;
  }, { passive: true });
  window.addEventListener('keydown', event => {
    if (access.locked && !dialog?.open && ['PageDown', 'ArrowDown', 'End', ' '].includes(event.key) &&
        !event.target.closest('input,textarea') && !(event.key === ' ' && event.target.closest('button,a'))) {
      event.preventDefault(); scrollRequest();
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    dialog = document.createElement('dialog');
    dialog.id = 'portfolio-access';
    dialog.setAttribute('aria-labelledby', 'access-title');
    dialog.innerHTML = `<button class="access-close" type="button" aria-label="返回首页"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      <p class="access-kicker">LIN SEN / PORTFOLIO</p><h2 id="access-title">继续探索。</h2>
      <p class="access-intro">输入访问密码，查看作品与经历。</p>
      <form class="access-form"><label for="access-password">访问密码</label><div class="access-field"><input id="access-password" name="password" type="password" inputmode="numeric" autocomplete="current-password" required maxlength="128" aria-describedby="access-error"><button class="access-visibility" type="button" aria-label="显示密码" aria-pressed="false">显示</button></div>
      <p id="access-error" role="status" aria-live="polite"></p><button class="access-submit" type="submit">解锁浏览</button></form>
      <p class="access-footnote">本次浏览仅需验证一次</p>`;
    document.body.append(dialog);
    input = dialog.querySelector('input'); error = dialog.querySelector('#access-error');
    submit = dialog.querySelector('.access-submit');
    function close() {
      quietUntil = performance.now() + 900;
      destination = ''; replay = null;
      dialog.close(); input.value = '';
    }
    dialog.querySelector('.access-close').addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.querySelector('.access-visibility').addEventListener('click', event => {
      const show = input.type === 'password'; input.type = show ? 'text' : 'password';
      event.currentTarget.textContent = show ? '隐藏' : '显示';
      event.currentTarget.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
      event.currentTarget.setAttribute('aria-pressed', String(show));
    });
    input.addEventListener('input', () => { error.textContent = ''; input.removeAttribute('aria-invalid'); });
    dialog.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault(); if (submit.disabled) return;
      submit.disabled = true; submit.textContent = '正在验证…';
      try {
        const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.value));
        const entered = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
        if (entered !== digest) {
          error.textContent = '密码不正确，请重试。'; input.setAttribute('aria-invalid', 'true');
          input.select(); return;
        }
        try { sessionStorage.setItem(key, digest); } catch {}
        access.locked = false; root.classList.remove('access-locked'); input.value = ''; dialog.close();
        window.dispatchEvent(new Event('resize'));
        requestAnimationFrame(() => {
          if (replay) { replay.click(); replay = null; }
          else if (destination) {
            location.hash = destination;
            if (/^#[\w-]+$/.test(destination)) document.querySelector(destination)?.scrollIntoView({ behavior: 'smooth' });
          }
        });
      } catch { error.textContent = '暂时无法验证，请刷新页面后重试。'; }
      finally { submit.disabled = false; submit.textContent = '解锁浏览'; }
    });
    {
      const footer = document.querySelector('.footer-row');
      if (footer) {
        const lock = document.createElement('button'); lock.type = 'button'; lock.className = 'access-relock';
        lock.textContent = '锁定浏览'; lock.addEventListener('click', () => {
          try { sessionStorage.removeItem(key); } catch {}
          history.replaceState(null, '', location.pathname + location.search + '#home'); location.reload();
        }); footer.append(lock);
      }
    }
    if (access.locked && destination) requestAccess();
  }, { once: true });
})();
