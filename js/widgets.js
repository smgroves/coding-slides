/* ============================================================
   widgets.js — hand-built interactive teaching widgets.
   Each widget is a <div data-widget="NAME"> that this script
   fills in. All logic is client-side; no dependencies.
   ============================================================ */
(function () {
  const $ = (sel, r) => (r || document).querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---------------- 1. for-loop / Fibonacci slider ---------------- */
  function forloop(root) {
    root.innerHTML = `
      <div class="wlabel">Drag: how many terms of the Fibonacci sequence?</div>
      <input type="range" min="1" max="20" value="8">
      <div>terms = <span class="wval">8</span></div>
      <div class="wout"></div>`;
    const range = $("input", root), val = $(".wval", root), out = $(".wout", root);
    function render() {
      const n = +range.value; val.textContent = n;
      const seq = []; let a = 0, b = 1;
      for (let i = 0; i < n; i++) { seq.push(a); [a, b] = [b, a + b]; }
      out.textContent =
        `a, b = 0, 1\nfor i in range(${n}):\n    print(a)\n    a, b = b, a + b\n\n` +
        `→ ${seq.join(", ")}`;
    }
    range.addEventListener("input", render); render();
  }

  /* ---------------- 2. "same recipe, different chef" ---------------- */
  function pyversion(root) {
    const chefs = {
      "3.7":  { pantry: "numpy 1.16 · pandas 0.24", note: "dict keeps insertion order (new in 3.7)" },
      "3.11": { pantry: "numpy 1.24 · pandas 2.0",  note: "up to 60% faster than 3.10" },
      "3.13": { pantry: "numpy 2.1 · pandas 2.2",   note: "experimental no-GIL build available" },
    };
    root.innerHTML = `
      <div class="wlabel">Same recipe, different chef (Python version)</div>
      <div class="toggle-row"></div>
      <div class="wout"></div>`;
    const row = $(".toggle-row", root), out = $(".wout", root);
    Object.keys(chefs).forEach((v, i) => {
      const b = el("button", i === 1 ? "active" : "", "Python " + v);
      b.onclick = () => { [...row.children].forEach(c => c.classList.remove("active")); b.classList.add("active"); show(v); };
      row.appendChild(b);
    });
    function show(v) {
      out.textContent =
        `$ python --version\nPython ${v}\n\n` +
        `pantry: ${chefs[v].pantry}\nnote:   ${chefs[v].note}`;
    }
    show("3.11");
  }

  /* ---------------- 3. conda "kitchens" ---------------- */
  function condaenv(root) {
    const envs = {
      "base":       ["python 3.12", "numpy 2.1", "pandas 2.2", "…everything"],
      "myclass":    ["python 3.12", "numpy 2.1", "pandas 2.2", "scipy", "matplotlib", "ipykernel"],
      "legacy_proj":["python 3.7", "numpy 1.16", "special-lib 1.0"],
    };
    root.innerHTML = `
      <div class="wlabel">Which kitchen (conda environment) is active?</div>
      <div class="toggle-row"></div>
      <div class="wout"></div>
      <div class="chip-row"></div>`;
    const row = $(".toggle-row", root), out = $(".wout", root), chips = $(".chip-row", root);
    Object.keys(envs).forEach((name, i) => {
      const b = el("button", i === 1 ? "active" : "", name);
      b.onclick = () => { [...row.children].forEach(c => c.classList.remove("active")); b.classList.add("active"); show(name); };
      row.appendChild(b);
    });
    function show(name) {
      out.textContent = `$ conda activate ${name}\n(${name}) $ python my_analysis.py`;
      chips.innerHTML = "";
      envs[name].forEach(p => chips.appendChild(el("span", "chip", p)));
    }
    show("myclass");
  }

  /* ---------------- 4. git workflow animation ---------------- */
  function gitflow(root) {
    // state
    let remote = 1, local = 0, ahead = 0, dirty = 0, cloned = false;
    root.innerHTML = `
      <svg viewBox="0 0 640 240" role="img" aria-label="git workflow"></svg>
      <div class="btns">
        <button class="b-clone">git clone</button>
        <button class="b-commit">edit + commit</button>
        <button class="b-push">git push</button>
        <button class="b-pull">git pull</button>
        <button class="b-reset">reset</button>
      </div>
      <div class="log"></div>`;
    const svg = $("svg", root), log = $(".log", root);
    const btn = c => $(c, root);

    function line(x) { return `<span class="${x.a?'a':'g'}">${x.t}</span>`; }
    const history = [];
    function say(t, a) { history.push({ t, a }); if (history.length > 8) history.shift();
      log.innerHTML = history.map(line).join("<br>"); log.scrollTop = log.scrollHeight; }

    function commitStack(x, label, sub, n, color, extra) {
      let s = `<rect x="${x}" y="30" width="200" height="180" rx="14" fill="#fff" stroke="#E7DFD3"/>
        <text x="${x+100}" y="58" text-anchor="middle" font-family="Inter" font-weight="700" font-size="15" fill="#2B2724">${label}</text>
        <text x="${x+100}" y="76" text-anchor="middle" font-family="JetBrains Mono" font-size="10" fill="#8A8079">${sub}</text>`;
      for (let i = 0; i < n; i++) {
        const cy = 190 - i * 26;
        s += `<circle cx="${x+100}" cy="${cy}" r="9" fill="${color}"/>`;
        if (i > 0) s += `<line x1="${x+100}" y1="${cy+9}" x2="${x+100}" y2="${cy+17}" stroke="${color}" stroke-width="2"/>`;
      }
      s += extra || "";
      return s;
    }
    function render() {
      const localStr = cloned ? `${local} commit${local!==1?'s':''}${ahead?` (+${ahead} ahead)`:''}${dirty?` • ${dirty} unsaved`:''}` : "no repo yet";
      let mid = "";
      if (cloned) mid = `<line x1="230" y1="120" x2="410" y2="120" stroke="#E7DFD3" stroke-width="2" stroke-dasharray="4 4"/>`;
      svg.innerHTML =
        commitStack(20, "💻 Your computer", localStr, cloned ? local : 0, "#2E7D6B",
          dirty ? `<circle cx="120" cy="${190-local*26}" r="9" fill="#E3A21A" opacity="0.9"/>` : "") +
        mid +
        commitStack(420, "☁️ GitHub (remote)", `${remote} commit${remote!==1?'s':''}`, remote, "#6E40C9");
    }

    btn(".b-clone").onclick = () => {
      if (cloned) { say("already cloned — nothing to do", true); return; }
      cloned = true; local = remote; ahead = 0;
      say("$ git clone …  → local copy of the shared book"); render();
    };
    btn(".b-commit").onclick = () => {
      if (!cloned) { say("clone the repo first!", true); return; }
      dirty++; render();
      setTimeout(() => { local++; ahead++; dirty--; say("$ git commit -m '…'  → saved locally (ahead of remote)"); render(); }, 350);
    };
    btn(".b-push").onclick = () => {
      if (!cloned) { say("clone first!", true); return; }
      if (!ahead) { say("nothing to push", true); return; }
      remote += ahead; say(`$ git push  → sent ${ahead} commit(s) to GitHub`); ahead = 0; render();
    };
    btn(".b-pull").onclick = () => {
      if (!cloned) { say("clone first!", true); return; }
      if (remote <= local - ahead) { say("already up to date", true); return; }
      say("$ git pull  → got your partner's changes"); local = remote + ahead - ahead; local = Math.max(local, remote); render();
    };
    btn(".b-reset").onclick = () => { remote = 1; local = 0; ahead = 0; dirty = 0; cloned = false; history.length = 0; log.innerHTML = ""; render(); };
    render();
  }

  /* ---------------- 5. branch + merge graph ---------------- */
  function branches(root) {
    let merged = false;
    root.innerHTML = `
      <svg viewBox="0 0 640 210" role="img" aria-label="branches"></svg>
      <div class="btns">
        <button class="b-commit">open pull request → merge</button>
        <button class="b-reset">reset</button>
      </div>`;
    const svg = $("svg", root);
    function render() {
      const main = "#6E40C9", feat = "#D2603A";
      let s = `
        <text x="20" y="70" font-family="JetBrains Mono" font-size="12" fill="#6E40C9">main</text>
        <text x="20" y="160" font-family="JetBrains Mono" font-size="12" fill="#D2603A">lastname</text>
        <line x1="80" y1="65" x2="600" y2="65" stroke="${main}" stroke-width="3"/>`;
      [110, 200].forEach(x => s += `<circle cx="${x}" cy="65" r="9" fill="${main}"/>`);
      // branch off
      s += `<path d="M200 65 C 240 65, 250 150, 290 150" fill="none" stroke="${feat}" stroke-width="3"/>`;
      s += `<line x1="290" y1="150" x2="480" y2="150" stroke="${feat}" stroke-width="3"/>`;
      [290, 380, 470].forEach(x => s += `<circle cx="${x}" cy="150" r="9" fill="${feat}"/>`);
      if (merged) {
        s += `<path d="M470 150 C 520 150, 530 65, 570 65" fill="none" stroke="${feat}" stroke-width="3" stroke-dasharray="5 4"/>`;
        s += `<circle cx="570" cy="65" r="11" fill="${main}" stroke="${feat}" stroke-width="3"/>`;
        s += `<text x="570" y="45" text-anchor="middle" font-family="Inter" font-size="11" fill="#2E7D6B" font-weight="700">merged ✓</text>`;
      } else {
        s += `<text x="470" y="185" text-anchor="middle" font-family="Inter" font-size="11" fill="#8A8079">your work (not merged)</text>`;
      }
      svg.innerHTML = s;
    }
    $(".b-commit", root).onclick = () => { merged = true; render(); };
    $(".b-reset", root).onclick = () => { merged = false; render(); };
    render();
  }

  /* ---------------- 6. notebook quality toggle ---------------- */
  function notebook(root) {
    const plot = `<svg viewBox="0 0 260 130"><rect width="260" height="130" fill="#fff"/>
      <line x1="40" y1="10" x2="40" y2="110" stroke="#333"/><line x1="40" y1="110" x2="250" y2="110" stroke="#333"/>
      <polyline points="45,100 90,70 135,78 180,40 245,25" fill="none" stroke="#D2603A" stroke-width="2.5"/>
      <text x="145" y="126" text-anchor="middle" font-family="Inter" font-size="9" fill="#333">time (s)</text>
      <text x="12" y="60" font-family="Inter" font-size="9" fill="#333" transform="rotate(-90 12 60)">signal (mV)</text>
      <text x="145" y="9" text-anchor="middle" font-family="Inter" font-size="9" font-weight="700" fill="#333">EMG amplitude over time</text></svg>`;

    const HI = `
      <div class="nb">
        <div class="nb-cell"><div class="nb-gutter">md</div><div class="nb-body nb-md">
          <h4>Fatigue analysis of EMG signal</h4>
          <p><b>Goal:</b> measure how the signal amplitude changes as the muscle fatigues.</p></div></div>
        <div class="nb-cell"><div class="nb-gutter">[1]</div><div class="nb-body">
          <div class="nb-code">from analysis import load_emg, rms_envelope
signal, t = load_emg("trial_03.csv")
env = rms_envelope(signal)</div></div></div>
        <div class="nb-cell"><div class="nb-gutter">[2]</div><div class="nb-body">
          <div class="nb-code">plt.plot(t, env); plt.title("EMG amplitude over time")
plt.xlabel("time (s)"); plt.ylabel("signal (mV)")   # envelope rises → fatigue</div>
          <div class="nb-plot">${plot}</div></div></div>
        <div class="nb-cell"><div class="nb-gutter">[3]</div><div class="nb-body">
          <div class="nb-code">print("Correlation with time:", round(corr, 3))</div>
          <div class="nb-out">Correlation with time: 0.912</div></div></div>
      </div>`;

    const LO = `
      <div class="nb">
        <div class="nb-cell"><div class="nb-gutter">[1]</div><div class="nb-body">
          <div class="nb-code">import pandas as pd, numpy as np, matplotlib.pyplot as plt
d=pd.read_csv("trial_03.csv");s=d.iloc[:,1].values;t=d.iloc[:,0].values
w=50;env=np.array([np.sqrt(np.mean(s[i:i+w]**2)) for i in range(len(s)-w)])
plt.plot(env)
print(d)
c=np.corrcoef(np.arange(len(env)),env)[0,1];print(c)</div>
          <div class="nb-out ugly">      time   signal
0     0.000    0.012
1     0.001   -0.004
2     0.002    0.031
3     0.003    0.008
...   (2000 more rows) ...</div>
          <div class="nb-out">0.9117834...</div></div></div>
      </div>`;

    root.innerHTML = `
      <div class="toggle-row">
        <button data-q="lo">🚫 low quality</button>
        <button class="active" data-q="hi">✅ high quality</button>
      </div>
      <div class="nb-holder"></div>`;
    const holder = $(".nb-holder", root);
    root.querySelectorAll("button").forEach(b => b.onclick = () => {
      root.querySelectorAll("button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      holder.innerHTML = b.dataset.q === "hi" ? HI : LO;
    });
    holder.innerHTML = HI;
  }

  /* ---------------- two-partner collaboration + merge conflict ---------------- */
  function partnerflow(root) {
    const BASE = 5, NEWVAL = { you: 8, part: 10 }, label = { you: "You", part: "Partner" };
    let st, hist = [];
    const fresh = () => ({
      remoteVal: BASE, remoteVer: 1,
      you:  { val: BASE, syncedVal: BASE, syncedVer: 1, committed: false, conflict: false },
      part: { val: BASE, syncedVal: BASE, syncedVer: 1, committed: false, conflict: false },
    });
    const A = k => st[k];

    root.innerHTML = `
      <div class="pf-cols">
        <div class="pf-col"><h4>💻 You</h4><div class="pf-file"></div><div class="pf-status"></div></div>
        <div class="pf-col remote"><h4>☁️ GitHub (remote)</h4><div class="pf-file"></div><div class="pf-status"></div></div>
        <div class="pf-col"><h4>👩‍💻 Partner</h4><div class="pf-file"></div><div class="pf-status"></div></div>
      </div>
      <div class="pf-btns"><span class="who">You 💻</span>
        <button class="you" data-k="you" data-a="edit">✏️ edit</button>
        <button class="you" data-k="you" data-a="commit">💾 commit</button>
        <button class="you" data-k="you" data-a="push">⬆️ push</button>
        <button class="you" data-k="you" data-a="pull">🔄 pull</button>
        <button class="resolve" data-k="you" data-a="resolve" hidden>🔧 resolve</button></div>
      <div class="pf-btns"><span class="who">Partner 👩‍💻</span>
        <button class="part" data-k="part" data-a="edit">✏️ edit</button>
        <button class="part" data-k="part" data-a="commit">💾 commit</button>
        <button class="part" data-k="part" data-a="push">⬆️ push</button>
        <button class="part" data-k="part" data-a="pull">🔄 pull</button>
        <button class="resolve" data-k="part" data-a="resolve" hidden>🔧 resolve</button></div>
      <div class="pf-btns"><button class="reset" data-a="reset">reset</button></div>
      <div class="pf-log"></div>`;

    function say(t, cls) { hist.push({ t, cls: cls || "g" }); if (hist.length > 7) hist.shift();
      const log = root.querySelector(".pf-log"); log.innerHTML = hist.map(h => `<span class="${h.cls}">${h.t}</span>`).join("<br>"); log.scrollTop = log.scrollHeight; }

    const act = {
      edit(k) { const a = A(k); if (a.conflict) return say("resolve the conflict first", "r"); a.val = NEWVAL[k]; a.committed = false; say(label[k] + " edited the file → threshold = " + a.val, "a"); },
      commit(k) { const a = A(k); if (a.conflict) return say("resolve the conflict first", "r"); if (a.val === a.syncedVal && !a.committed) return say("nothing to commit", "a"); a.committed = true; say("$ git commit — " + label[k] + " saved locally", "g"); },
      push(k) { const a = A(k);
        if (a.conflict) return say("resolve the conflict first", "r");
        if (!a.committed) return say("nothing to push — commit first", "a");
        if (a.syncedVer < st.remoteVer) return say("! [rejected] " + label[k] + "'s push — remote has newer commits. pull first.", "r");
        st.remoteVal = a.val; st.remoteVer++; a.syncedVal = a.val; a.syncedVer = st.remoteVer; a.committed = false;
        say("$ git push ✓ — " + label[k] + " updated GitHub (threshold = " + st.remoteVal + ")", "g"); },
      pull(k) { const a = A(k);
        if (a.conflict) return say("resolve the conflict first", "r");
        if (a.syncedVer === st.remoteVer) return say(label[k] + " is already up to date", "a");
        if (a.committed && a.val !== st.remoteVal) { a.conflict = true; return say("$ git pull → MERGE CONFLICT in analysis.py — you both changed the same line!", "r"); }
        a.val = st.remoteVal; a.syncedVal = st.remoteVal; a.syncedVer = st.remoteVer; a.committed = false;
        say("$ git pull ✓ — " + label[k] + " merged cleanly (threshold = " + a.val + ")", "g"); },
      resolve(k) { const a = A(k); if (!a.conflict) return;
        a.val = st.remoteVal; a.conflict = false; a.committed = true; a.syncedVal = a.val; a.syncedVer = st.remoteVer;
        say("✔ resolved: kept threshold = " + a.val + " (talk to your partner!) — " + label[k] + " committed the merge", "g"); },
    };

    function fileBox(k) { const a = A(k);
      if (a.conflict) return `<span class="cf1">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD (${label[k]})</span>\nthreshold = ${a.val}\n<span class="mid">=======</span>\nthreshold = ${st.remoteVal}\n<span class="cf2">&gt;&gt;&gt;&gt;&gt;&gt;&gt; origin/main</span>`;
      return `threshold = ${a.val}`;
    }
    function statusText(k) { const a = A(k);
      if (a.conflict) return '<span class="conf">⚠ merge conflict</span>';
      const behind = a.syncedVer < st.remoteVer;
      if (a.committed && behind) return '<span class="warn">● commit · behind remote</span>';
      if (a.committed) return '<span class="warn">● 1 commit to push</span>';
      if (behind) return '<span class="warn">↓ behind remote</span>';
      if (a.val !== a.syncedVal) return '<span class="warn">✎ unsaved change</span>';
      return '<span class="ok">✓ in sync</span>';
    }
    function render() {
      const cols = root.querySelectorAll(".pf-col"), you = cols[0], rem = cols[1], part = cols[2];
      you.classList.toggle("conflict", st.you.conflict);
      part.classList.toggle("conflict", st.part.conflict);
      you.querySelector(".pf-file").innerHTML = fileBox("you");
      you.querySelector(".pf-status").innerHTML = statusText("you");
      rem.querySelector(".pf-file").innerHTML = `threshold = ${st.remoteVal}`;
      rem.querySelector(".pf-status").innerHTML = `<span class="ok">v${st.remoteVer} · latest</span>`;
      part.querySelector(".pf-file").innerHTML = fileBox("part");
      part.querySelector(".pf-status").innerHTML = statusText("part");
      root.querySelector('.resolve[data-k="you"]').hidden = !st.you.conflict;
      root.querySelector('.resolve[data-k="part"]').hidden = !st.part.conflict;
    }

    root.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.a === "reset") { st = fresh(); hist = []; root.querySelector(".pf-log").innerHTML = ""; render(); return; }
      act[b.dataset.a](b.dataset.k); render();
    });
    st = fresh(); render();
  }

  /* ---------------- clickable numbered labels (VS Code / github.com) ---------------- */
  function labelGroup(group) {
    const badges = [...group.querySelectorAll(".vs-badge")];
    const items = [...group.querySelectorAll(".vs-legend .li")];
    const itemByNum = {};
    items.forEach(li => { const n = (li.querySelector(".num")?.textContent || "").trim(); if (n) itemByNum[n] = li; });
    let current = null;
    function clear() { group.classList.remove("labels-active"); badges.forEach(b => b.classList.remove("on")); items.forEach(i => i.classList.remove("on")); current = null; }
    function select(n) {
      if (current === n) { clear(); return; }
      clear(); group.classList.add("labels-active"); current = n;
      badges.forEach(b => { if (b.textContent.trim() === n) b.classList.add("on"); });
      if (itemByNum[n]) itemByNum[n].classList.add("on");
    }
    badges.forEach(b => b.addEventListener("click", e => { e.stopPropagation(); select(b.textContent.trim()); }));
    items.forEach(li => {
      const n = (li.querySelector(".num")?.textContent || "").trim();
      if (n) li.addEventListener("click", e => { e.stopPropagation(); select(n); });
    });
  }

  const REG = { forloop, pyversion, condaenv, gitflow, branches, notebook, partnerflow };

  function initAll(root) {
    (root || document).querySelectorAll("[data-widget]").forEach(node => {
      if (node.dataset.wInit) return;
      const fn = REG[node.dataset.widget];
      if (fn) { node.classList.add("widget"); node.dataset.wInit = "1"; fn(node); }
    });
    (root || document).querySelectorAll(".vslabels").forEach(node => {
      if (node.dataset.lInit) return;
      node.dataset.lInit = "1"; labelGroup(node);
    });
  }
  window.Widgets = { initAll };
  document.addEventListener("DOMContentLoaded", () => initAll());
})();
