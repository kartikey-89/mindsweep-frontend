// ==== CONFIG ====
const API_BASE = "https://mindsweep-backend-1033236042576.asia-south1.run.app";

// Key for localStorage history
const HISTORY_KEY = "mindsweep_history_v1";

// Run when page loads
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "home") {
    initHomePage();
  } else if (page === "history") {
    loadFirestoreHistory();
  } else if (page === "about") {
    // nothing special yet
  }
});

// ---------- HOME PAGE ----------

function initHomePage() {
  const clarityBtn = document.getElementById("clarityBtn");
  const clearBtn = document.getElementById("clearBtn");
  const chips = document.querySelectorAll(".chip");

  if (clarityBtn) {
    clarityBtn.addEventListener("click", getClarity);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const textarea = document.getElementById("userInput");
      const outputSection = document.getElementById("outputSection");
      const output = document.getElementById("output");
      if (textarea) textarea.value = "";
      if (output) output.innerHTML = "";
      if (outputSection) outputSection.classList.add("hidden");
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const textarea = document.getElementById("userInput");
      if (textarea) {
        textarea.value = chip.dataset.prompt || "";
        textarea.focus();
      }
    });
  });
}

async function getClarity() {
  const textarea = document.getElementById("userInput");
  const loader = document.getElementById("loader");
  const outputSection = document.getElementById("outputSection");
  const output = document.getElementById("output");

  if (!textarea || !loader || !outputSection || !output) return;

  const message = textarea.value.trim();
  if (!message) {
    alert("Please type what you are feeling first.");
    return;
  }

  loader.classList.remove("hidden");
  outputSection.classList.add("hidden");
  output.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/mindsweep`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    if (data.clarity) {
      const formatted = formatClarityText(data.clarity);
      output.innerHTML = formatted;
      outputSection.classList.remove("hidden");

      saveToHistory({
        message,
        clarity: data.clarity,
        createdAt: new Date().toISOString(),
      });
    } else if (data.error) {
      output.innerHTML =
        `<strong>Something went wrong talking to the AI.</strong><br>` +
        `<span style="font-size:0.85rem;color:#9ca3af;">${escapeHtml(
          data.error
        )}</span>`;
      outputSection.classList.remove("hidden");
    } else {
      output.innerHTML =
        "<strong>Unexpected response from server.</strong><br><span style='font-size:0.85rem;color:#9ca3af;'>Please try again.</span>";
      outputSection.classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);
    output.innerHTML =
      "<strong>Network error.</strong><br><span style='font-size:0.85rem;color:#9ca3af;'>Please check your internet or try again after a moment.</span>";
    outputSection.classList.remove("hidden");
  } finally {
    loader.classList.add("hidden");
  }
}

// Basic formatting: bold **text**, convert line breaks
function formatClarityText(text) {
  let safe = escapeHtml(text);

  // Bold sections like **TEXT**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Convert numbered headings like "1)" to slightly spaced ones
  safe = safe.replace(/(\d\)\s)/g, "<br><br><strong>$1</strong>");

  // Convert newlines to <br>
  safe = safe.replace(/\n/g, "<br>");

  return safe;
}

// ---------- HISTORY (localStorage only) ----------

function saveToHistory(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    existing.unshift(entry); // latest first
    // keep only last 15 entries
    const trimmed = existing.slice(0, 15);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Could not save history:", e);
  }
}

function initHistoryPage() {
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const list = document.getElementById("historyList");

  if (!list) return;

  const items = loadHistory();

  if (!items.length) {
    list.innerHTML =
      "<p style='font-size:0.9rem;color:#6b7280;'>No MindSweeps yet. Go to the Home page, type what you're feeling, and generate your first clarity.</p>";
  } else {
    list.innerHTML = "";
    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "history-item";

      const date = new Date(item.createdAt);
      const dateStr = isNaN(date.getTime())
        ? ""
        : date.toLocaleString(undefined, {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });

      div.innerHTML = `
        <div class="history-item-header">
          <span>${dateStr}</span>
          <span class="history-item-tag">Saved from MindSweep</span>
        </div>
        <div class="history-item-message">
          ${escapeHtml(item.message).slice(0, 160)}${
        item.message.length > 160 ? "..." : ""
      }
        </div>
      `;
      list.appendChild(div);
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (confirm("Clear local MindSweep history on this browser?")) {
        localStorage.removeItem(HISTORY_KEY);
        list.innerHTML =
          "<p style='font-size:0.9rem;color:#6b7280;'>History cleared.</p>";
      }
    });
  }
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

// ---------- Helpers ----------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function loadFirestoreHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = `<p class="loading-text">Loading history…</p>`;

  try {
    const res = await fetch(`${API_BASE}/history`);
    const data = await res.json();

    if (!data.history || data.history.length === 0) {
      list.innerHTML = `
        <p style='font-size:0.9rem;color:#6b7280;'>
          No history found. Try generating a MindSweep first.
        </p>`;
      return;
    }

    list.innerHTML = "";

    data.history.forEach((item) => {
      const div = document.createElement("div");
      div.className = "history-item";

      const date = new Date(item.timestamp);
      const dateStr = date.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });

      div.innerHTML = `
        <div class="history-item-header">
          <span>${dateStr}</span>
          <span class="history-item-tag">${item.model_used}</span>
        </div>

        <div class="history-item-message">
          ${escapeHtml(item.message).slice(0, 200)}${
        item.message.length > 200 ? "..." : ""
      }
        </div>

        <div class="history-item-clarity">
          ${escapeHtml(item.clarity).slice(0, 250)}...
        </div>
      `;

      list.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    list.innerHTML =
      "<p style='color:red;font-size:0.9rem;'>Failed to fetch history. Try again.</p>";
  }
}


