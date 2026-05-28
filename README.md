# Maxson Mathew — Portfolio OS

A desktop OS-style portfolio built in plain HTML, CSS, and JavaScript.  
No build tools. No frameworks. Deploys directly to GitHub Pages.

---

## Project Structure

```
maxson-portfolio/
├── index.html                    ← Main page (the OS shell)
├── css/
│   └── style.css                 ← All styles — themes, windows, taskbar, animations
├── js/
│   └── main.js                   ← All logic — window manager, drag, theme, clock
├── assets/
│   ├── images/
│   │   ├── maxson-photo.jpg      ← ⏳ DROP YOUR PHOTO HERE
│   │   ├── project-resume-matcher.png   ← ⏳ Project 1 screenshot
│   │   ├── project-ambulance.png        ← ⏳ Project 2 screenshot
│   │   └── project-krishidrishti.png   ← ⏳ Project 3 screenshot
│   └── resume/
│       └── Maxson_Mathew_Resume.pdf    ← ⏳ DROP YOUR RESUME HERE
└── README.md
```

---

## Things To Fill In

| Item | File | What to do |
|------|------|------------|
| Profile photo | `assets/images/maxson-photo.jpg` | Drop image, uncomment `<img>` tag in About window |
| Resume PDF | `assets/resume/Maxson_Mathew_Resume.pdf` | Drop PDF — download link is already wired |
| Project 1 GitHub | `index.html` | Find `<!-- GITHUB LINK PLACEHOLDER — Project 1 -->`, replace `href="#"` |
| Project 2 GitHub | `index.html` | Find `<!-- GITHUB LINK PLACEHOLDER — Project 2 -->`, replace `href="#"` |
| Project 3 GitHub | `index.html` | Find `<!-- GITHUB LINK PLACEHOLDER — Project 3 -->`, replace `href="#"` |
| KrishiDrishti details | `index.html` | Find project 3 card, add bullet points and tech tags |
| Tagline | `index.html` | Find `#desktop-identity`, update the `<p>` text |
| Project screenshots | `assets/images/` | Drop PNGs, swap out placeholder divs with `<img>` tags |

All placeholders in the code are marked with prominent comments so they're easy to find.

---

## Adding Your Photo

1. Drop your photo into `assets/images/maxson-photo.jpg`  
2. In `index.html`, find the `PHOTO PLACEHOLDER` comment inside `#window-about`  
3. Replace the inner `<span>` with:
   ```html
   <img src="assets/images/maxson-photo.jpg"
        alt="Maxson Mathew"
        style="width:100%; height:100%; object-fit:cover; border-radius:8px;">
   ```

---

## Adding Project Screenshots

For each project, find the `SCREENSHOT PLACEHOLDER` comment and replace the placeholder `<div>` with:

```html
<img src="assets/images/project-NAME.png"
     alt="Project Name"
     style="width:100%; height:100%; object-fit:cover;">
```

---

## Themes

Two themes, toggled via the taskbar button:

| Theme | Palette | Vibe |
|-------|---------|------|
| 🌿 Forest | Deep greens, warm cream, earthy gold | Grounded, premium, literary |
| ⚡ Electric | Near-black, electric cyan, neon accents | Live dashboard, data-forward |

Theme preference is saved in `localStorage` — it persists across page reloads.

To change the default theme: open `css/style.css` and on the `:root` selector,  
change `--bg-wallpaper` and the other variables, or change the `data-theme` attribute  
on `<html>` in `index.html` from `forest` to `electric`.

---

## How the OS Works

- **Desktop icons** — single-click selects, **double-click opens** the window
- **Windows** — draggable by the title bar, closeable, minimisable, maximisable
- **Taskbar** — shows open window buttons; click to minimise/restore
- **Theme toggle** — top right of taskbar, smooth CSS variable transition
- **Keyboard** — `Escape` closes the focused window

---

## Local Development

No build step needed. Just open `index.html` in a browser.

For best results, use a local server to avoid CORS issues with assets:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx)
npx serve .

# VS Code — use the Live Server extension
```

Then open `http://localhost:8000` in your browser.

---

## Deploy to GitHub Pages

### Option A — Root of repo (simplest)

1. Push the entire project to a GitHub repo (e.g. `your-username.github.io` or any repo name)
2. Go to **Settings → Pages**
3. Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)`
4. Save. GitHub Pages will build and give you a URL in ~30 seconds.

### Option B — `docs/` folder

1. Rename the project folder to `docs/` inside your repo
2. Settings → Pages → Source: branch `main`, folder `/docs`

### Option C — Custom domain

1. Deploy via Option A
2. Settings → Pages → Custom domain → enter your domain
3. Add a CNAME record pointing to `your-username.github.io`

---

## Customisation Reference

| What | Where in CSS |
|------|-------------|
| Forest theme colours | `:root, [data-theme="forest"]` block in `style.css` |
| Electric theme colours | `[data-theme="electric"]` block |
| Window size defaults | Per-window `style="width:Xpx; height:Ypx"` in `index.html` |
| Desktop dot grid size | `background-size: 32px 32px` on `#desktop` |
| Icon grid position | `top`, `left` on `#icon-grid` |
| Font choices | `--font-display`, `--font-body`, `--font-mono`, `--font-ui` variables |
| Animation speed | `windowOpen` keyframe duration in `style.css` |

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).  
Mobile shows a graceful fallback message — the OS experience is desktop-only by design.

---

*Built with plain HTML, CSS, and JavaScript. Zero dependencies. Zero build steps.*
