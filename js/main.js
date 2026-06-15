/**
 * MAXSON MATHEW — PORTFOLIO OS  v2
 * main.js — Core Application Logic
 *
 * Modules:
 *  1.  ThemeManager      — Forest / Electric toggle + localStorage
 *  2.  WindowManager     — Open, close, minimise, maximise, z-index
 *  3.  DragManager       — Draggable windows
 *  4.  IconDragManager   — Draggable desktop icons + localStorage positions
 *  5.  TaskbarManager    — Window indicator buttons
 *  6.  ClockManager      — Live taskbar clock
 *  7.  IconManager       — Icon click/double-click handlers
 *  8.  FolderManager     — Nested folder navigation in windows
 *  9.  Init              — Boot sequence
 */

'use strict';

/* ============================================================
   1. THEME MANAGER
   ============================================================ */

const ThemeManager = (() => {

  const KEY = 'mm-theme';
  let current = 'forest';

  function apply(theme) {
    current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    updateBtn(theme);

    // Notify background manager of theme change
    if (typeof BackgroundManager !== 'undefined') {
      BackgroundManager.onThemeChange();
    }
  }

  function toggle() {
    apply(current === 'forest' ? 'electric' : 'forest');
  }

  function updateBtn(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.innerHTML = theme === 'forest'
      ? '<span>⚡</span> Night'
      : '<span>🌿</span> Day';
  }

  function init() {
    const saved = localStorage.getItem(KEY);
    apply(saved === 'electric' ? 'electric' : 'forest');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init, toggle, apply, getCurrent: () => current };
})();


/* ============================================================
   2. WINDOW MANAGER
   ============================================================ */

const WindowManager = (() => {

  let zTop = 200;
  const cascade = { count: 0 };

  function open(id) {
    const win = document.getElementById(id);
    if (!win) return;

    win.classList.remove('is-minimised');

    if (win.style.display !== 'none') {
      focus(win);
      TaskbarManager.update();
      return;
    }

    if (!win.dataset.opened) {
      positionNew(win);
      win.dataset.opened = 'true';
    }

    win.style.display = 'flex';
    win.style.animation = 'none';
    win.offsetHeight;
    win.style.animation = '';

    focus(win);
    TaskbarManager.update();
    setIconOpen(id, true);
  }

  function close(winOrId) {
    const win = resolve(winOrId);
    if (!win) return;
    win.style.display = 'none';
    win.classList.remove('is-minimised', 'is-maximised', 'is-focused');
    delete win.dataset.opened;
    TaskbarManager.update();
    setIconOpen(win.id, false);
  }

  function minimise(winOrId) {
    const win = resolve(winOrId);
    if (!win) return;
    win.classList.add('is-minimised');
    win.style.display = 'none';
    win.classList.remove('is-focused');
    TaskbarManager.update();
  }

  function toggleMaximise(winOrId) {
    const win = resolve(winOrId);
    if (!win) return;
    if (win.classList.contains('is-maximised')) {
      win.classList.remove('is-maximised');
      const saved = win.dataset.savedRect;
      if (saved) {
        const r = JSON.parse(saved);
        win.style.top    = r.top + 'px';
        win.style.left   = r.left + 'px';
        win.style.width  = r.width + 'px';
        win.style.height = r.height + 'px';
      }
    } else {
      win.dataset.savedRect = JSON.stringify({
        top:    parseInt(win.style.top)    || win.offsetTop,
        left:   parseInt(win.style.left)   || win.offsetLeft,
        width:  parseInt(win.style.width)  || win.offsetWidth,
        height: parseInt(win.style.height) || win.offsetHeight,
      });
      win.classList.add('is-maximised');
    }
  }

  function focus(win) {
    document.querySelectorAll('.os-window.is-focused').forEach(w => w.classList.remove('is-focused'));
    if (win.dataset.pinned) return;
    zTop++;
    win.style.zIndex = zTop;
    win.classList.add('is-focused');
  }

  function positionNew(win) {
    const desktop = document.getElementById('desktop');
    const dw = desktop.offsetWidth;
    const dh = desktop.offsetHeight;
    const ww = win.offsetWidth  || parseInt(win.style.width)  || 680;
    const wh = win.offsetHeight || parseInt(win.style.height) || 520;
    const offset = cascade.count * 30;
    cascade.count = (cascade.count + 1) % 8;
    const x = Math.min(Math.max(Math.round((dw - ww) / 2) + offset, 100), dw - ww - 20);
    const y = Math.min(Math.max(Math.round((dh - wh) / 3) + offset, 10),  dh - wh - 20);
    win.style.left = x + 'px';
    win.style.top  = y + 'px';
  }

  function resolve(winOrId) {
    return typeof winOrId === 'string' ? document.getElementById(winOrId) : winOrId;
  }

  function setIconOpen(windowId, isOpen) {
    const icon = document.querySelector(`.desktop-icon[data-window="${windowId}"]`);
    if (icon) icon.classList.toggle('is-open', isOpen);
  }

  function getOpenWindows() {
    return Array.from(document.querySelectorAll('.os-window'))
      .filter(w => w.style.display !== 'none');
  }

  return { open, close, minimise, toggleMaximise, focus, getOpenWindows };
})();


/* ============================================================
   3. WINDOW DRAG MANAGER
   ============================================================ */

const DragManager = (() => {

  function attach(win, header) {
    let dragging = false, sx, sy, sl, st;

    header.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('wc-btn')) return;
      if (win.classList.contains('is-maximised')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      sl = parseInt(win.style.left) || win.offsetLeft;
      st = parseInt(win.style.top)  || win.offsetTop;
      header.setPointerCapture(e.pointerId);
      WindowManager.focus(win);
      e.preventDefault();
    });

    header.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const desktop = document.getElementById('desktop');
      const dw = desktop.offsetWidth, dh = desktop.offsetHeight;
      const nx = Math.min(Math.max(sl + e.clientX - sx, -win.offsetWidth + 80), dw - 60);
      const ny = Math.min(Math.max(st + e.clientY - sy, 0), dh - 40);
      win.style.left = nx + 'px';
      win.style.top  = ny + 'px';
    });

    header.addEventListener('pointerup',    () => { dragging = false; });
    header.addEventListener('pointercancel',() => { dragging = false; });
  }

  function initAll() {
    document.querySelectorAll('.os-window').forEach(win => {
      const header = win.querySelector('.window-header');
      if (header) attach(win, header);
    });
  }

  return { attach, initAll };
})();


/* ============================================================
   4. ICON DRAG MANAGER
   Draggable desktop icons, positions saved to localStorage.
   ============================================================ */

const IconDragManager = (() => {

  const STORAGE_KEY = 'mm-icon-positions';
  let positions = {};

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }

  function load() {
    try {
      positions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { positions = {}; }
  }

  function applyPositions() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      const id = icon.dataset.window || icon.dataset.id;
      if (positions[id]) {
        icon.classList.add('free-positioned');
        icon.style.position = 'absolute';
        icon.style.left = positions[id].x + 'px';
        icon.style.top  = positions[id].y + 'px';
      }
    });
  }

  function attach(icon) {
    let dragging = false;
    let sx, sy, startLeft, startTop;
    let moved = false;
    const id = icon.dataset.window || icon.dataset.id;

    icon.addEventListener('pointerdown', (e) => {
      // Only left button
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      sx = e.clientX;
      sy = e.clientY;

      // Get current position
      if (icon.classList.contains('free-positioned')) {
        startLeft = parseInt(icon.style.left) || 0;
        startTop  = parseInt(icon.style.top)  || 0;
      } else {
        // Convert from grid layout to absolute
        const rect = icon.getBoundingClientRect();
        const deskRect = document.getElementById('desktop').getBoundingClientRect();
        startLeft = rect.left - deskRect.left;
        startTop  = rect.top  - deskRect.top;
      }

      icon.setPointerCapture(e.pointerId);
    });

    icon.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;

      // Only start dragging if moved more than 4px (to allow clicks)
      if (!moved && Math.sqrt(dx*dx + dy*dy) < 4) return;
      moved = true;

      icon.classList.add('free-positioned', 'dragging');
      icon.style.position = 'absolute';

      const desktop = document.getElementById('desktop');
      const dw = desktop.offsetWidth, dh = desktop.offsetHeight;
      const nx = Math.min(Math.max(startLeft + dx, 0), dw - 76);
      const ny = Math.min(Math.max(startTop  + dy, 0), dh - 80);

      icon.style.left = nx + 'px';
      icon.style.top  = ny + 'px';
    });

    icon.addEventListener('pointerup', () => {
      if (dragging && moved) {
        icon.classList.remove('dragging');
        if (id) {
          positions[id] = {
            x: parseInt(icon.style.left),
            y: parseInt(icon.style.top),
          };
          save();
        }
      }
      dragging = false;
    });

    icon.addEventListener('pointercancel', () => {
      dragging = false;
      icon.classList.remove('dragging');
    });
  }

  function resetPositions() {
    positions = {};
    save();
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      icon.classList.remove('free-positioned', 'dragging');
      icon.style.position = '';
      icon.style.left = '';
      icon.style.top  = '';
    });
  }

  function initAll() {
    load();
    applyPositions();
    document.querySelectorAll('.desktop-icon').forEach(attach);
  }

  return { initAll, resetPositions };
})();


/* ============================================================
   5. TASKBAR MANAGER
   ============================================================ */

const TaskbarManager = (() => {

  function update() {
    const container = document.getElementById('taskbar-windows');
    if (!container) return;
    container.innerHTML = '';

    document.querySelectorAll('.os-window').forEach(win => {
      if (!win.dataset.opened) return;
      const isVisible   = win.style.display !== 'none';
      const isMinimised = win.classList.contains('is-minimised');
      const title = win.querySelector('.window-title')?.textContent?.trim() || 'Window';
      const icon  = win.dataset.icon || '';

      const btn = document.createElement('button');
      btn.className = 'taskbar-window-btn' + (!isMinimised && isVisible ? ' is-active' : '');
      btn.title = title;
      btn.textContent = `${icon} ${title}`;

      btn.addEventListener('click', () => {
        if (isMinimised || !isVisible) {
          win.classList.remove('is-minimised');
          win.style.display = 'flex';
          WindowManager.focus(win);
        } else {
          WindowManager.minimise(win);
        }
        update();
      });

      container.appendChild(btn);
    });
  }

  return { update };
})();


/* ============================================================
   6. CLOCK MANAGER
   ============================================================ */

const ClockManager = (() => {
  const pad = n => String(n).padStart(2, '0');

  function tick() {
    const el = document.getElementById('taskbar-clock');
    if (!el) return;
    const n = new Date();
    el.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  }

  function init() { tick(); setInterval(tick, 1000); }
  return { init };
})();


/* ============================================================
   7. ICON MANAGER — click / double-click
   ============================================================ */

const IconManager = (() => {

  function init() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      const windowId = icon.dataset.window;
      if (!windowId) return;

      icon.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        WindowManager.open(windowId);
      });

      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
      });
    });

    document.getElementById('desktop')?.addEventListener('click', (e) => {
      if (e.target.id === 'desktop' || e.target.id === 'bg-canvas') {
        document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
      }
    });
  }

  return { init };
})();


/* ============================================================
   8. FOLDER MANAGER
   Handles nested folder navigation within project windows.
   ============================================================ */

const FolderManager = (() => {

  function init() {
    // Folder item clicks — open sub-windows or load sub-views
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.folder-item[data-action]');
      if (!item) return;

      const action = item.dataset.action;
      const target = item.dataset.target;

      if (action === 'open-window') {
        WindowManager.open(target);
      } else if (action === 'load-view') {
        loadFolderView(item.closest('.os-window'), target);
      }
    });

    // Back button in folder windows
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.folder-nav-btn[data-back]');
      if (!btn) return;
      const win = btn.closest('.os-window');
      const view = btn.dataset.back;
      if (win && view) loadFolderView(win, view);
    });
  }

  function loadFolderView(win, viewId) {
    const viewEl = document.getElementById(viewId);
    if (!viewEl) return;

    // Hide all views in this window
    win.querySelectorAll('.folder-view-panel').forEach(v => {
      v.style.display = 'none';
    });

    // Show target view
    viewEl.style.display = 'block';

    // Update address bar
    const addrBar = win.querySelector('.addr-path');
    if (addrBar && viewEl.dataset.path) {
      addrBar.textContent = viewEl.dataset.path;
    }

    // Update status bar
    const statusBar = win.querySelector('.folder-status-bar');
    if (statusBar && viewEl.dataset.items) {
      statusBar.textContent = `${viewEl.dataset.items} item(s)`;
    }
  }

  return { init, loadFolderView };
})();


/* ============================================================
   WINDOW CONTROLS — wire up all in-window buttons
   ============================================================ */

function initWindowControls() {
  document.querySelectorAll('.os-window').forEach(win => {
    win.querySelector('.wc-btn.close')?.addEventListener('click', () => WindowManager.close(win));
    win.querySelector('.wc-btn.min')?.addEventListener('click', () => { WindowManager.minimise(win); TaskbarManager.update(); });
    win.querySelector('.wc-btn.max')?.addEventListener('click', () => WindowManager.toggleMaximise(win));

    win.addEventListener('pointerdown', () => {
      if (!win.dataset.pinned) WindowManager.focus(win);
    });
  });
}


/* ============================================================
   BOOT SEQUENCE
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Theme
  ThemeManager.init();

  // 2. Background canvas
  if (typeof BackgroundManager !== 'undefined') BackgroundManager.init();

  // 3. Window drag
  DragManager.initAll();

  // 4. Window controls
  initWindowControls();

  // 5. Desktop icons (click/dblclick)
  IconManager.init();

  // 6. Icon drag (movable icons)
  IconDragManager.initAll();

  // 7. Folder navigation
  FolderManager.init();

  // 8. Chatbot
  if (typeof ChatbotManager !== 'undefined') ChatbotManager.init();

  // 9. Right-click context menu
  if (typeof ContextMenuManager !== 'undefined') ContextMenuManager.init();

  // 10. Clock
  ClockManager.init();

  // 11. Taskbar
  TaskbarManager.update();

  // 12. Icon stagger animations
  document.querySelectorAll('.desktop-icon').forEach((icon, i) => {
    icon.style.animationDelay = `${0.05 + i * 0.06}s`;
  });

  // 13. Escape closes top focused window
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const focused = document.querySelector('.os-window.is-focused');
      if (focused) WindowManager.close(focused);
    }
  });

  console.log(
    '%c MAXSON MATHEW — PORTFOLIO OS v2 ',
    'background: #2d3d28; color: #c8d4bc; font-size: 13px; padding: 4px 8px;'
  );
  console.log('%c Right-click the desktop for options.', 'color: #5a8a5a;');
  console.log('%c Double-click icons to open windows.', 'color: #5a8a5a;');
});
