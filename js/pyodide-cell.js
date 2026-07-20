/* ============================================================
   pyodide-cell.js
   Turns any <div class="pycell" data-code="..."> (or with a
   <script type="text/python"> child) into a runnable Python cell.
   Pyodide is loaded lazily on the first Run, then shared by all
   cells. Supports stdout/stderr, numpy, pandas, and matplotlib
   (figures are auto-rendered as PNG).
   Everything runs in the browser — nothing is sent to a server.
   ============================================================ */
(function () {
  const PYODIDE_VERSION = "0.26.4";
  const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

  let pyodidePromise = null;         // shared boot promise
  const loadedPkgs = new Set();

  function bootPyodide(onStatus) {
    if (pyodidePromise) return pyodidePromise;
    onStatus && onStatus("Downloading the Python interpreter (first run only)…");
    pyodidePromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CDN + "pyodide.js";
      s.onload = async () => {
        try {
          const py = await loadPyodide({ indexURL: CDN });
          resolve(py);
        } catch (e) { reject(e); }
      };
      s.onerror = () => reject(new Error("Failed to load Pyodide from CDN"));
      document.head.appendChild(s);
    });
    return pyodidePromise;
  }

  // crude but effective: scan code for imports we can preload
  function neededPackages(code) {
    const pkgs = [];
    const map = { numpy: "numpy", pandas: "pandas", matplotlib: "matplotlib",
                  scipy: "scipy", "matplotlib.pyplot": "matplotlib" };
    for (const key of Object.keys(map)) {
      const re = new RegExp("(import|from)\\s+" + key.replace(".", "\\."), "m");
      if (re.test(code) && !pkgs.includes(map[key])) pkgs.push(map[key]);
    }
    return pkgs;
  }

  async function ensurePackages(py, code, onStatus) {
    const needed = neededPackages(code).filter(p => !loadedPkgs.has(p));
    if (needed.length) {
      onStatus && onStatus("Stocking the pantry: " + needed.join(", ") + "…");
      await py.loadPackage(needed);
      needed.forEach(p => loadedPkgs.add(p));
    }
  }

  // Wrap user code so we can capture stdout and any matplotlib figure.
  const HARNESS = `
import sys, io, traceback
__out = io.StringIO()
__old = sys.stdout, sys.stderr
sys.stdout = sys.stderr = __out
__img = None
__err = None
try:
    exec(__USERCODE__, {"__name__": "__main__"})
    try:
        import matplotlib
        if "matplotlib.pyplot" in sys.modules:
            import matplotlib.pyplot as __plt
            if __plt.get_fignums():
                import base64
                __buf = io.BytesIO()
                __plt.gcf().savefig(__buf, format="png", dpi=110, bbox_inches="tight")
                __img = base64.b64encode(__buf.getvalue()).decode()
                __plt.close("all")
    except Exception:
        pass
except Exception:
    __err = traceback.format_exc()
finally:
    sys.stdout, sys.stderr = __old
`;

  async function runCell(py, code, onStatus) {
    // force AGG backend before any matplotlib import
    if (/matplotlib/.test(code) && !window.__mpl_ready) {
      await py.runPythonAsync(`import matplotlib; matplotlib.use("AGG")`);
      window.__mpl_ready = true;
    }
    py.globals.set("__USERCODE__", code);
    await py.runPythonAsync(HARNESS);
    const out = py.globals.get("__out").getvalue();
    const img = py.globals.get("__img");
    const err = py.globals.get("__err");
    return { out, img, err };
  }

  function esc(s) {
    return String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  function initCell(el) {
    if (el.dataset.init) return;
    el.dataset.init = "1";

    // source: <script type="text/python"> child, or data-code attr
    let src = "";
    const sc = el.querySelector('script[type="text/python"]');
    if (sc) src = sc.textContent.replace(/^\n/, "").replace(/\s+$/, "");
    else if (el.dataset.code) src = el.dataset.code;
    const original = src;
    const fname = el.dataset.file || "practice.py";
    const rows = Math.min(16, Math.max(3, src.split("\n").length));

    el.innerHTML = `
      <div class="pycell-bar">
        <span class="dots"><i></i><i></i><i></i></span>
        <span class="fname">${esc(fname)}</span>
        <button class="reset" title="Reset code">reset</button>
        <button class="run">▶ Run</button>
      </div>
      <textarea class="code" spellcheck="false" rows="${rows}"></textarea>
      <div class="out" hidden><div class="out-inner"></div></div>
      <div class="status" hidden></div>`;

    const ta = el.querySelector("textarea.code");
    const runBtn = el.querySelector(".run");
    const resetBtn = el.querySelector(".reset");
    const outBox = el.querySelector(".out");
    const outInner = el.querySelector(".out-inner");
    const statusBox = el.querySelector(".status");
    ta.value = src;

    // Tab inserts spaces; don't trap focus for accessibility (Esc first)
    let tabTrap = true;
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { tabTrap = false; ta.blur(); }
      if (e.key === "Tab" && tabTrap) {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 4;
      }
      // keep reveal.js from stealing keystrokes
      e.stopPropagation();
    });
    ta.addEventListener("focus", () => { tabTrap = true; });

    function status(msg) {
      if (!msg) { statusBox.hidden = true; return; }
      statusBox.hidden = false;
      statusBox.innerHTML = `<span class="spin"></span>${esc(msg)}`;
    }

    async function run() {
      runBtn.disabled = true;
      const label = runBtn.textContent;
      runBtn.textContent = "…";
      outBox.hidden = true;
      try {
        const py = await bootPyodide(status);
        await ensurePackages(py, ta.value, status);
        status("Chef Python is cooking…");
        const { out, img, err } = await runCell(py, ta.value, status);
        status(null);
        outBox.hidden = false;
        let html = "";
        if (out && out.trim()) html += `<span>${esc(out)}</span>`;
        if (err) html += `<span class="err">${esc(err)}</span>`;
        if (!out.trim() && !err && !img) html += `<span style="color:#6d655d">— no output —</span>`;
        outInner.innerHTML = html;
        if (img) {
          const im = document.createElement("img");
          im.src = "data:image/png;base64," + img;
          outInner.appendChild(im);
        }
      } catch (e) {
        status(null);
        outBox.hidden = false;
        outInner.innerHTML = `<span class="err">${esc(e.message || e)}</span>`;
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = label;
      }
    }

    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", () => { ta.value = original; outBox.hidden = true; status(null); });
    // Ctrl/Cmd+Enter to run
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
    });
  }

  function initAll(root) {
    (root || document).querySelectorAll(".pycell").forEach(initCell);
  }

  window.PyCell = { initAll };
  document.addEventListener("DOMContentLoaded", () => initAll());
})();
