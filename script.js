// ============================================
// CONFIG
// ============================================
const API_BASE = "YOUR_BACKEND_URL_HERE"; // <-- replace with Cloud Run URL
const HISTORY_KEY = "mindsweep_history_v1";

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "home") initHomePage();
  if (page === "history") initHistoryPage();
  initTheme();
});

// ============================================
// HOME PAGE
// ============================================
function initHomePage() {
  const clarityBtn = document.getElementById("clarityBtn");
  const clearBtn = document.getElementById("clearBtn");
  const chips = document.querySelectorAll(".chip");

  clarityBtn?.addEventListener("click", getClarity);
  clearBtn?.addEventListener("click", clearOutput);

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      document.getElementById("userInput").value = chip.dataset.prompt;
    });
  });
}

function clearOutput() {
  document.getElementById("userInput").value = "";
  document.getElementById("output").innerHTML = "";
  document.getElementById("outputSection").classList.add("hidden");
}

// ============================================
// GET CLARITY
// ============================================
async function getClarity() {
  const message = document.getElementById("userInput").value.trim();
  if (!message) return toast("Please type something.");

  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");

  const outputSection = document.getElementById("outputSection");
  const output = document.getElementById("output");
  const copyBtn = document.getElementById("copyBtn");

  outputSection.classList.add("hidden");
  output.innerHTML = "";
  copyBtn.classList.add("hidden");

  try {
    const res = await fetch(`${API_BASE}/mindsweep`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    const text = data.clarity || "No response from server.";

    const formatted = formatClarity(text);
    output.innerHTML = formatted;
    outputSection.classList.remove("hidden");
    output.classList.add("fade-in");

    copyBtn.classList.remove("hidden");
    copyBtn.onclick = () => copyToClipboard(text);

    saveToHistory({ message, clarity: text, createdAt: new Date().toISOString() });

  } catch (e) {
    toast("Network error.");
  }

  loader.classList.add("hidden");
}

// Bold + line breaks
function formatClarity(str) {
  let t = escapeHtml(str);
  t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(\d\)\s)/g, "<br><br><strong>$1</strong>");
  t = t.replace(/\n/g, "<br>");
  return t;
}

// ============================================
// COPY BUTTON
// ============================================
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast("Copied!");
  });
}

// ============================================
// HISTORY PAGE
// ============================================
function saveToHistory(entry) {
  const items = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  items.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
}

function initHistoryPage() {
  const list = document.getElementById("historyList");
  const items = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");

  if (!items.length) {
    list.innerHTML = "<p>No history yet.</p>";
    return;
  }

  list.innerHTML = "";
  items.forEach(i => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <strong>${i.message.slice(0,120)}...</strong>
      <div class="small">${new Date(i.createdAt).toLocaleString()}</div>
    `;
    list.appendChild(div);
  });
}

// ============================================
// THEME TOGGLE
// ============================================
function initTheme() {
  const toggle = document.getElementById("themeToggle");
  const saved = localStorage.getItem("theme");

  if (saved === "dark") {
    document.body.classList.add("dark");
    toggle.textContent = "☀️";
  }

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const mode = document.body.classList.contains("dark") ? "dark" : "light";
    toggle.textContent = mode === "dark" ? "☀️" : "🌙";
    localStorage.setItem("theme", mode);
  });
}

// ============================================
// TOAST
// ============================================
function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 2000);
}

// ============================================
// HELPERS
// ============================================
function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
