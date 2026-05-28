/**
 * MAXSON MATHEW — PORTFOLIO OS
 * contextmenu.js — Custom Right-Click Context Menu
 *
 * Different menus for:
 *  - Desktop background click
 *  - Desktop icon click
 *  - Window header click
 *  - Window body click
 */

'use strict';

const ContextMenuManager = (() => {

  let menuEl;
  let lastTarget = null;

  /* ============================================================
     MENU DEFINITIONS
     Each menu is an array of items.
     type: 'item' | 'separator'
     ============================================================ */

  const DESKTOP_MENU = [
    { type:'item', icon:'🔄', label:'Refresh Desktop',    action: refreshDesktop },
    { type:'item', icon:'🎨', label:'Change Theme',        action: toggleTheme },
    { type:'item', icon:'📐', label:'Arrange Icons',       action: arrangeIcons },
    { type:'separator' },
    { type:'item', icon:'📂', label:'Open All Windows',    action: openAll },
    { type:'item', icon:'🗗',  label:'Close All Windows',   action: closeAll },
    { type:'separator' },
    { type:'item', icon:'💬', label:'Ask Me Anything',     action: () => WindowManager.open('window-chatbot') },
    { type:'separator' },
    { type:'item', icon:'👁', label:'View Page Source',    action: viewSource },
    { type:'item', icon:'🐙', label:'GitHub',              action: () => window.open('https://github.com/maxx1404', '_blank') },
    { type:'separator' },
    { type:'item', icon:'ℹ️', label:'About This OS',       action: aboutOS },
  ];

  const ICON_MENU = (icon) => [
    { type:'item', icon:'↗',  label:`Open ${icon.querySelector('.icon-label')?.textContent || 'Window'}`, action: () => WindowManager.open(icon.dataset.window) },
    { type:'separator' },
    { type:'item', icon:'📌', label:'Pin to Top',          action: () => pinWindow(icon.dataset.window) },
    { type:'item', icon:'↺',  label:'Reset Icon Position', action: () => resetIconPosition(icon) },
  ];

  const WINDOW_MENU = (win) => [
    { type:'item', icon:'⬛', label:'Minimise',            action: () => WindowManager.minimise(win) },
    { type:'item', icon:'⬜', label:'Maximise / Restore',  action: () => WindowManager.toggleMaximise(win) },
    { type:'item', icon:'✕',  label:'Close',               action: () => WindowManager.close(win), cssClass: 'ctx-danger' },
    { type:'separator' },
    { type:'item', icon:'⬆', label:'Bring to Front',      action: () => WindowManager.focus(win) },
  ];

  /* ============================================================
     ACTION IMPLEMENTATIONS
     ============================================================ */

  function refreshDesktop() {
    // Animate icons out and back in
    document.querySelectorAll('.desktop-icon').forEach((icon, i) => {
      icon.style.transition = 'opacity 0.2s, transform 0.2s';
      icon.style.opacity = '0';
      icon.style.transform = 'translateY(8px)';
      setTimeout(() => {
        icon.style.opacity = '1';
        icon.style.transform = 'translateY(0)';
      }, 200 + i * 40);
    });
  }

  function toggleTheme() {
    ThemeManager.toggle();
  }

  function arrangeIcons() {
    // Reset all free-positioned icons back to grid
    IconDragManager.resetPositions();
  }

  function openAll() {
    const windowIds = ['window-about','window-experience','window-projects',
                       'window-skills','window-achievements','window-contact'];
    windowIds.forEach((id, i) => {
      setTimeout(() => WindowManager.open(id), i * 80);
    });
  }

  function closeAll() {
    document.querySelectorAll('.os-window').forEach(w => WindowManager.close(w));
  }

  function viewSource() {
    window.open('https://github.com/maxx1404', '_blank');
  }

  function aboutOS() {
    // Open a small about dialog
    WindowManager.open('window-about');
  }

  function pinWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
      win.style.zIndex = 9000;
      win.dataset.pinned = 'true';
    }
  }

  function resetIconPosition(iconEl) {
    iconEl.style.position = '';
    iconEl.style.left = '';
    iconEl.style.top = '';
    iconEl.classList.remove('free-positioned');
  }

  /* ============================================================
     BUILD MENU DOM
     ============================================================ */
  function buildMenu(items) {
    menuEl.innerHTML = '';

    items.forEach(item => {
      if (item.type === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'ctx-separator';
        menuEl.appendChild(sep);
        return;
      }

      const el = document.createElement('div');
      el.className = 'ctx-item' + (item.cssClass ? ' ' + item.cssClass : '');

      el.innerHTML = `<span class="ctx-icon">${item.icon}</span>${item.label}`;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        hide();
        if (item.action) item.action();
      });

      menuEl.appendChild(el);
    });
  }

  /* ============================================================
     SHOW / HIDE
     ============================================================ */
  function show(x, y, items) {
    buildMenu(items);

    // Position — keep within viewport
    menuEl.style.left = x + 'px';
    menuEl.style.top  = y + 'px';
    menuEl.classList.add('visible');

    // After render, check if it overflows
    requestAnimationFrame(() => {
      const rect = menuEl.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menuEl.style.left = (x - rect.width) + 'px';
      }
      if (rect.bottom > window.innerHeight - 44) {
        menuEl.style.top = (y - rect.height) + 'px';
      }
    });
  }

  function hide() {
    menuEl.classList.remove('visible');
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    menuEl = document.getElementById('context-menu');
    if (!menuEl) return;

    // Intercept right-click on desktop
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      lastTarget = e.target;

      const icon   = e.target.closest('.desktop-icon');
      const win    = e.target.closest('.os-window');
      const header = e.target.closest('.window-header');

      if (icon) {
        show(e.clientX, e.clientY, ICON_MENU(icon));
      } else if (header && win) {
        show(e.clientX, e.clientY, WINDOW_MENU(win));
      } else if (win) {
        show(e.clientX, e.clientY, WINDOW_MENU(win));
      } else {
        show(e.clientX, e.clientY, DESKTOP_MENU);
      }
    });

    // Hide on any click
    document.addEventListener('click', hide);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hide();
    });
  }

  return { init, hide };

})();
