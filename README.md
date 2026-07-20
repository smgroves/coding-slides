# Intro to Coding — interactive slides

Interactive intro-to-coding lecture deck, built with
[reveal.js](https://revealjs.com/). It runs **real Python in the browser**
via [Pyodide](https://pyodide.org/) — students can edit and run code cells
live inside the slides, no install and no server required.

Content order: **Python → GitHub → Jupyter**, tied together by a running
"coding is like running a restaurant" metaphor.

🔗 **Live:** https://smgroves.github.io/coding-slides/

## What's interactive

- **Live Python cells** (▶ Run) — real execution, incl. `numpy`, `pandas`,
  and `matplotlib` plots. First run downloads the interpreter (~10 MB) from a
  CDN; after that it's instant.
- **Sliders / toggles** — Fibonacci loop, "same recipe, different chef"
  (Python versions), conda "kitchens".
- **Git workflow animation** — click clone → commit → push → pull.
- **Branch + merge graph** — open a pull request and watch it merge.
- **Notebook quality toggle** — high- vs low-quality notebook, side by side.

## Running locally

Any static server works (needed so the browser can load `js/` and `css/`):

```bash
cd "General Coding Slides"
python3 -m http.server 4599
# open http://localhost:4599
```

## Keyboard

`←` `→` / Space navigate · `F` fullscreen · `O` slide overview ·
`S` speaker view · `Esc` (inside a code cell) to release focus and navigate.

## File layout

```
index.html          the deck (all slide content)
css/theme.css        visual theme (restaurant feel)
css/widgets.css      styles for code cells + widgets
js/pyodide-cell.js   turns .pycell blocks into runnable Python
js/widgets.js        sliders, git workflow, branch graph, notebook toggle
.nojekyll            tells GitHub Pages to serve files as-is
```

## Editing content

- **Slides** live in `index.html`. Each `<section>` is one slide.
- **A live code cell:**
  ```html
  <div class="pycell" data-file="demo.py"><script type="text/python">
  print("hello")
  </script></div>
  ```
- **A widget:** `<div data-widget="forloop"></div>` — available widgets:
  `forloop`, `pyversion`, `condaenv`, `gitflow`, `branches`, `notebook`.

## Deploying to GitHub Pages

See the one-time setup commands your instructor session generated, or:

1. Create a repo named **`coding-slides`** under the `smgroves` account.
2. Push this folder's contents to the `main` branch.
3. In the repo: **Settings → Pages → Source: Deploy from a branch →
   `main` / `root`**.
4. It goes live at `https://smgroves.github.io/coding-slides/`
   (first build takes a minute or two).
