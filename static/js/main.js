/* ============================================================
   Breast Cancer Risk Predictor — Main JavaScript
   ============================================================ */

"use strict";

// ── Theme Management ─────────────────────────────────────────
const THEME_KEY = "bc_theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

// ── Tab Navigation ───────────────────────────────────────────
function initTabs() {
  document.querySelectorAll(".tab-nav").forEach(nav => {
    nav.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        const tabGroup = btn.closest("[data-tabs]") || document.getElementById(btn.dataset.tabs) || document;

        nav.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        (tabGroup !== document ? tabGroup : document)
          .querySelectorAll(".tab-pane[data-tab]")
          .forEach(p => {
            p.classList.toggle("active", p.dataset.tab === target);
          });
      });
    });
  });
}

// ── Hamburger Menu ───────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("navLinks");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => menu.classList.toggle("open"));
  document.addEventListener("click", e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) menu.classList.remove("open");
  });
}

// ── Range Slider Sync ────────────────────────────────────────
function initRangeSliders() {
  document.querySelectorAll(".range-slider").forEach(slider => {
    const inputId = slider.dataset.input;
    const display = slider.parentElement.querySelector(".range-val");
    const numInput = document.getElementById(inputId);
    if (!numInput) return;

    slider.addEventListener("input", () => {
      numInput.value = slider.value;
      if (display) display.textContent = slider.value;
      numInput.dispatchEvent(new Event("input"));
    });

    numInput.addEventListener("input", () => {
      slider.value = numInput.value;
      if (display) display.textContent = numInput.value;
    });

    // init display
    if (display) display.textContent = numInput.value || slider.value;
  });
}

// ── Accordion ────────────────────────────────────────────────
function initAccordion() {
  document.querySelectorAll(".accordion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const content = btn.nextElementSibling;
      const isOpen = btn.classList.contains("open");

      // Close all
      document.querySelectorAll(".accordion-btn").forEach(b => {
        b.classList.remove("open");
        b.nextElementSibling.style.maxHeight = "0";
      });

      if (!isOpen) {
        btn.classList.add("open");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
}

// ── Form Validation ──────────────────────────────────────────
function validateField(input) {
  const min = parseFloat(input.min);
  const max = parseFloat(input.max);
  const val = parseFloat(input.value);
  const fbEl = input.parentElement.querySelector(".invalid-feedback");

  if (input.value.trim() === "") {
    input.classList.add("is-invalid");
    if (fbEl) fbEl.textContent = "This field is required.";
    return false;
  }
  if (isNaN(val)) {
    input.classList.add("is-invalid");
    if (fbEl) fbEl.textContent = "Must be a valid number.";
    return false;
  }
  if (!isNaN(min) && val < min) {
    input.classList.add("is-invalid");
    if (fbEl) fbEl.textContent = `Minimum value is ${min}.`;
    return false;
  }
  if (!isNaN(max) && val > max) {
    input.classList.add("is-invalid");
    if (fbEl) fbEl.textContent = `Maximum value is ${max}.`;
    return false;
  }

  input.classList.remove("is-invalid");
  input.classList.add("is-valid");
  return true;
}

function initFormValidation() {
  const form = document.getElementById("predictionForm");
  if (!form) return;

  form.querySelectorAll(".form-control[type='number']").forEach(input => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) validateField(input);
    });
  });
}

// ── Fill Demo / Sample Values ────────────────────────────────
const SAMPLE_BENIGN = {
  radius_mean: 12.46, texture_mean: 24.04, perimeter_mean: 83.97, area_mean: 475.9,
  smoothness_mean: 0.1186, compactness_mean: 0.2396, concavity_mean: 0.2273,
  "concave points_mean": 0.08543, symmetry_mean: 0.203, fractal_dimension_mean: 0.08243,
  radius_se: 0.2976, texture_se: 1.599, perimeter_se: 2.039, area_se: 23.94,
  smoothness_se: 0.007149, compactness_se: 0.07217, concavity_se: 0.07743,
  "concave points_se": 0.01432, symmetry_se: 0.01789, fractal_dimension_se: 0.01008,
  radius_worst: 15.09, texture_worst: 40.68, perimeter_worst: 97.65, area_worst: 711.4,
  smoothness_worst: 0.1853, compactness_worst: 1.058, concavity_worst: 1.105,
  "concave points_worst": 0.221, symmetry_worst: 0.4366, fractal_dimension_worst: 0.2075
};

const SAMPLE_MALIGNANT = {
  radius_mean: 20.57, texture_mean: 17.77, perimeter_mean: 132.9, area_mean: 1326.0,
  smoothness_mean: 0.08474, compactness_mean: 0.07864, concavity_mean: 0.0869,
  "concave points_mean": 0.07017, symmetry_mean: 0.1812, fractal_dimension_mean: 0.05667,
  radius_se: 0.5435, texture_se: 0.7339, perimeter_se: 3.398, area_se: 74.08,
  smoothness_se: 0.005225, compactness_se: 0.01308, concavity_se: 0.01860,
  "concave points_se": 0.01340, symmetry_se: 0.01389, fractal_dimension_se: 0.003532,
  radius_worst: 24.99, texture_worst: 23.41, perimeter_worst: 158.8, area_worst: 1956.0,
  smoothness_worst: 0.1238, compactness_worst: 0.1866, concavity_worst: 0.2416,
  "concave points_worst": 0.1860, symmetry_worst: 0.275, fractal_dimension_worst: 0.08902
};

function fillSample(type) {
  const data = type === "benign" ? SAMPLE_BENIGN : SAMPLE_MALIGNANT;
  const form = document.getElementById("predictionForm");
  if (!form) return;
  Object.entries(data).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input"));
      input.classList.remove("is-invalid");
    }
    const slider = form.querySelector(`.range-slider[data-input="${name}"]`);
    if (slider) {
      slider.value = value;
    }
  });
  showToast(`Sample ${type} values loaded ✓`, type === "benign" ? "success" : "danger");
}

// ── Reset Form ───────────────────────────────────────────────
function resetForm() {
  const form = document.getElementById("predictionForm");
  if (!form) return;
  form.reset();
  form.querySelectorAll(".form-control").forEach(el => {
    el.classList.remove("is-invalid", "is-valid");
  });
  form.querySelectorAll(".invalid-feedback").forEach(el => el.textContent = "");
  hideResult();
  showToast("Form cleared.", "info");
}

// ── Show / Hide Result ────────────────────────────────────────
function hideResult() {
  const section = document.getElementById("result-section");
  if (section) section.classList.add("hidden");
}

function showResult(data) {
  const section = document.getElementById("result-section");
  if (!section) return;
  section.classList.remove("hidden");

  const result = data.result;
  const isMalignant = result.prediction === "Malignant";
  const cls = isMalignant ? "malignant" : "benign";

  // Card
  const card = document.getElementById("resultCard");
  if (card) {
    card.className = `result-card ${cls}`;
  }

  // Icon
  const icon = document.getElementById("resultIcon");
  if (icon) icon.textContent = isMalignant ? "⚠️" : "✅";

  // Label
  const label = document.getElementById("resultLabel");
  if (label) {
    label.textContent = result.prediction;
    label.className = `result-label ${cls}`;
  }

  // Description
  const desc = document.getElementById("resultDesc");
  if (desc) {
    desc.textContent = isMalignant
      ? "The model predicts this tumor profile as Malignant. Please consult a qualified oncologist immediately."
      : "The model predicts this tumor profile as Benign. Continue regular screenings and follow preventive guidelines.";
  }

  // Confidence
  const confSection = document.getElementById("confidenceSection");
  if (result.confidence !== null && result.confidence !== undefined) {
    if (confSection) confSection.classList.remove("hidden");
    const confVal = document.getElementById("confidenceValue");
    const confBar = document.getElementById("confidenceBar");
    if (confVal) confVal.textContent = result.confidence.toFixed(1) + "%";
    if (confBar) {
      confBar.style.width = "0%";
      confBar.className = `confidence-bar-fill ${cls}`;
      setTimeout(() => { confBar.style.width = result.confidence + "%"; }, 50);
    }
  } else {
    if (confSection) confSection.classList.add("hidden");
  }

  // Probability Doughnut Chart
  if (result.probabilities && Object.keys(result.probabilities).length > 0) {
    renderProbChart(result.probabilities);
  } else {
    const probSection = document.getElementById("probChartSection");
    if (probSection) probSection.classList.add("hidden");
  }

  // Scroll to result
  section.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ── Probability Doughnut (pure SVG, no external lib) ─────────
function renderProbChart(probs) {
  const section = document.getElementById("probChartSection");
  if (!section) return;
  section.classList.remove("hidden");

  const canvas = document.getElementById("probCanvas");
  if (!canvas) return;

  // We use a simple SVG donut
  const keys = Object.keys(probs);
  const vals = keys.map(k => Math.max(0, parseFloat(probs[k]) * 100));
  const total = vals.reduce((a, b) => a + b, 0) || 100;
  const colors = { M: "#dc2626", B: "#16a34a" };
  const labels = { M: "Malignant", B: "Benign" };

  const SIZE = 200, CX = 100, CY = 100, R = 70, INNER = 44;
  let svgPaths = "";
  let legend = "";
  let start = -Math.PI / 2;

  keys.forEach((k, i) => {
    const pct = vals[i] / total;
    const angle = pct * 2 * Math.PI;
    const x1 = CX + R * Math.cos(start);
    const y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(start + angle);
    const y2 = CY + R * Math.sin(start + angle);
    const xi1 = CX + INNER * Math.cos(start);
    const yi1 = CY + INNER * Math.sin(start);
    const xi2 = CX + INNER * Math.cos(start + angle);
    const yi2 = CY + INNER * Math.sin(start + angle);
    const large = angle > Math.PI ? 1 : 0;
    const col = colors[k] || "#64748b";

    svgPaths += `<path d="M ${xi1} ${yi1} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${INNER} ${INNER} 0 ${large} 0 ${xi1} ${yi1} Z" fill="${col}" opacity="0.9"/>`;
    legend += `<div style="display:flex;align-items:center;gap:.4rem;font-size:.8rem;margin:.15rem 0">
      <span style="width:12px;height:12px;border-radius:2px;background:${col};display:inline-block;flex-shrink:0"></span>
      <span>${labels[k] || k}: <strong>${vals[i].toFixed(1)}%</strong></span>
    </div>`;
    start += angle;
  });

  canvas.innerHTML = `<svg viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="Probability chart">
    ${svgPaths}
    <text x="${CX}" y="${CY - 6}" text-anchor="middle" font-size="11" fill="var(--text-muted)" font-family="var(--font)">Prob.</text>
    <text x="${CX}" y="${CY + 10}" text-anchor="middle" font-size="11" fill="var(--text-muted)" font-family="var(--font)">Distribution</text>
  </svg>`;

  const lgEl = document.getElementById("probLegend");
  if (lgEl) lgEl.innerHTML = legend;
}

// ── Prediction Submit ─────────────────────────────────────────
async function submitPrediction(e) {
  e.preventDefault();
  const form = document.getElementById("predictionForm");
  if (!form) return;

  // Validate all fields
  let valid = true;
  form.querySelectorAll(".form-control[type='number']").forEach(input => {
    if (!validateField(input)) valid = false;
  });

  if (!valid) {
    // Switch to first tab with error
    const firstError = form.querySelector(".is-invalid");
    if (firstError) {
      const pane = firstError.closest(".tab-pane");
      if (pane) {
        const tabId = pane.dataset.tab;
        const btn = form.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (btn) btn.click();
      }
      firstError.focus();
    }
    showToast("Please fix the highlighted errors.", "danger");
    return;
  }

  // Show loading
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.remove("hidden");
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Analyzing…"; }

  try {
    const formData = new FormData(form);
    const resp = await fetch("/predict", { method: "POST", body: formData });
    const data = await resp.json();

    if (!resp.ok || !data.success) {
      const msg = data.errors
        ? Object.values(data.errors).join(" ")
        : (data.error || "Prediction failed. Check your IBM configuration.");
      showAlert(msg, "danger");
      hideResult();
    } else {
      showResult(data);
      addHistoryRow(data.history_entry);
      showAlert("", "");  // clear
    }
  } catch (err) {
    console.error(err);
    showAlert("Network error. Please verify the server is running and IBM credentials are configured.", "danger");
  } finally {
    if (overlay) overlay.classList.add("hidden");
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "🔬 Analyze & Predict"; }
  }
}

// ── Alert Helper ──────────────────────────────────────────────
function showAlert(msg, type) {
  const el = document.getElementById("formAlert");
  if (!el) return;
  if (!msg) { el.classList.add("hidden"); return; }
  el.className = `alert alert-${type} mt-2`;
  el.innerHTML = `<span>${type === "danger" ? "❌" : "✅"}</span><span>${msg}</span>`;
  el.classList.remove("hidden");
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText = "position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:9998;display:flex;flex-direction:column;gap:.5rem;align-items:center;pointer-events:none;";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  const colors = { info: "#0891b2", danger: "#dc2626", success: "#16a34a", warning: "#d97706" };
  toast.style.cssText = `background:${colors[type]||"#1e293b"};color:#fff;padding:.55rem 1.2rem;border-radius:100px;font-size:.85rem;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.25);opacity:0;transform:translateY(10px);transition:all .3s;pointer-events:auto;`;
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = "1"; toast.style.transform = "translateY(0)"; });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

// ── History Table ─────────────────────────────────────────────
function addHistoryRow(entry) {
  const tbody = document.getElementById("historyBody");
  const empty = document.getElementById("historyEmpty");
  if (!tbody) return;
  if (empty) empty.classList.add("hidden");

  const isMal = entry.prediction === "Malignant";
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${entry.id}</td>
    <td>${entry.timestamp}</td>
    <td><span class="badge ${isMal ? "badge-danger" : "badge-success"}">${entry.prediction}</span></td>
    <td>${entry.confidence !== null && entry.confidence !== undefined ? entry.confidence.toFixed(1) + "%" : "N/A"}</td>
    <td>${entry.radius_mean}</td>
    <td>${entry.area_mean}</td>`;
  tbody.insertBefore(row, tbody.firstChild);

  // Update count
  const count = document.getElementById("historyCount");
  if (count) count.textContent = tbody.rows.length;
}

async function clearHistory() {
  if (!confirm("Clear all prediction history?")) return;
  await fetch("/history/clear", { method: "POST" });
  const tbody = document.getElementById("historyBody");
  if (tbody) tbody.innerHTML = "";
  const empty = document.getElementById("historyEmpty");
  if (empty) empty.classList.remove("hidden");
  const count = document.getElementById("historyCount");
  if (count) count.textContent = "0";
  showToast("History cleared.", "info");
}

// ── Radar Chart (Feature profile preview) ─────────────────────
function renderRadar(values, labels) {
  const svgEl = document.getElementById("radarSvg");
  if (!svgEl) return;

  const N = labels.length;
  const CX = 150, CY = 150, R = 110;
  const angles = labels.map((_, i) => (i / N) * 2 * Math.PI - Math.PI / 2);

  // Grid
  let grid = "";
  [0.25, 0.5, 0.75, 1.0].forEach(r => {
    const pts = angles.map(a => `${CX + r * R * Math.cos(a)},${CY + r * R * Math.sin(a)}`).join(" ");
    grid += `<polygon points="${pts}" fill="none" stroke="var(--border)" stroke-width="1"/>`;
  });

  // Axes
  let axes = "";
  angles.forEach((a, i) => {
    const lx = CX + (R + 18) * Math.cos(a);
    const ly = CY + (R + 18) * Math.sin(a);
    axes += `<line x1="${CX}" y1="${CY}" x2="${CX + R * Math.cos(a)}" y2="${CY + R * Math.sin(a)}" stroke="var(--border)" stroke-width="1"/>`;
    axes += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="var(--text-muted)" font-family="var(--font)">${labels[i]}</text>`;
  });

  // Data polygon
  const pts = values.map((v, i) => `${CX + v * R * Math.cos(angles[i])},${CY + v * R * Math.sin(angles[i])}`).join(" ");
  const poly = `<polygon points="${pts}" fill="rgba(37,99,235,.25)" stroke="var(--primary)" stroke-width="2"/>`;

  svgEl.innerHTML = grid + axes + poly;
}

// ── Live Radar Update ─────────────────────────────────────────
const RADAR_FIELDS = ["radius_mean","texture_mean","perimeter_mean","area_mean","smoothness_mean",
  "compactness_mean","concavity_mean","concave points_mean","symmetry_mean","fractal_dimension_mean"];
const RADAR_NORMS = { radius_mean:[6,30], texture_mean:[9,40], perimeter_mean:[40,200],
  area_mean:[140,2500], smoothness_mean:[0.05,0.17], compactness_mean:[0.02,0.35],
  concavity_mean:[0,0.43], "concave points_mean":[0,0.2], symmetry_mean:[0.1,0.3],
  fractal_dimension_mean:[0.05,0.1] };
const RADAR_LABELS = ["Radius","Texture","Perimeter","Area","Smooth","Compact","Concavity","ConcPts","Symmetry","FracDim"];

function updateRadar() {
  const vals = RADAR_FIELDS.map(f => {
    const input = document.querySelector(`[name="${f}"]`);
    if (!input || input.value === "") return 0.5;
    const [mn, mx] = RADAR_NORMS[f];
    return Math.min(1, Math.max(0, (parseFloat(input.value) - mn) / (mx - mn)));
  });
  renderRadar(vals, RADAR_LABELS);
}

function initRadarUpdates() {
  RADAR_FIELDS.forEach(f => {
    const input = document.querySelector(`[name="${f}"]`);
    if (input) input.addEventListener("input", updateRadar);
  });
  updateRadar();
}

// ── Scroll-to-form ────────────────────────────────────────────
function scrollToForm() {
  const el = document.getElementById("predict-section");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Theme
  const saved = localStorage.getItem(THEME_KEY) || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(saved);
  const togBtn = document.getElementById("themeToggle");
  if (togBtn) togBtn.addEventListener("click", toggleTheme);

  // Nav
  initHamburger();
  initTabs();
  initRangeSliders();
  initAccordion();
  initFormValidation();
  initRadarUpdates();

  // Form submit
  const form = document.getElementById("predictionForm");
  if (form) form.addEventListener("submit", submitPrediction);

  // Sample buttons
  document.getElementById("btnSampleBenign")?.addEventListener("click", () => fillSample("benign"));
  document.getElementById("btnSampleMalignant")?.addEventListener("click", () => fillSample("malignant"));
  document.getElementById("btnReset")?.addEventListener("click", resetForm);
  document.getElementById("btnClearHistory")?.addEventListener("click", clearHistory);

  // Hero CTA
  document.getElementById("btnHeroCta")?.addEventListener("click", scrollToForm);

  // Sticky CTA
  document.getElementById("btnStickyCta")?.addEventListener("click", scrollToForm);

  // Scroll animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("animate-in"); });
  }, { threshold: 0.1 });
  document.querySelectorAll(".card, .feature-card, .stat-card, .tip-card").forEach(el => observer.observe(el));
});
