// =============================================
// CONFIG
// =============================================
const API_BASE = "https://mindsweep-backend-1033236042576.asia-south1.run.app";

// =============================================
// PAGE ROUTING
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "home") initHomePage();
  if (page === "history") loadFirestoreHistory();
});

// =============================================
// HOME PAGE LOGIC
// =============================================
function initHomePage() {
  const clarityBtn = document.getElementById("clarityBtn");
  const clearBtn = document.getElementById("clearBtn");
  const chips = document.querySelectorAll(".chip");

  clarityBtn?.addEventListener("click", getClarity);
  clearBtn?.addEventListener("click", clearOutput);

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      const textarea = document.getElementById("userInput");
      if (textarea) {
        textarea.value = chip.dataset.prompt || "";
        textarea.focus();
      }
    })
  );
}

function clearOutput() {
  const textarea = document.getElementById("userInput");
  const output = document.getElementById("output");
  const outputSection = document.getElementById("outputSection");

  if (textarea) textarea.value = "";
  if (output) output.innerHTML = "";
  if (outputSection) outputSection.classList.add("hidden");
}

// =============================================
// FETCH CLARITY FROM BACKEND
// =============================================
async function getClarity() {
  const textarea = document.getElementById("userInput");
  const loader = document.getElementById("loader");
  const outputSection = document.getElementById("outputSection");
  const output = document.getElementById("output");

  if (!textarea || !loader || !outputSection || !output) return;

  const message = textarea.value.trim();
  if (!message) return alert("Please type what you're feeling first.");

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
      output.innerHTML = formatClarityText(data.clarity);
      outputSection.classList.remove("hidden");
    } else {
      output.innerHTML =
        `<strong>Something went wrong.</strong><br><span style="color:#aaa;">${escapeHtml(
          data.error || "Unknown Error"
        )}</span>`;
      outputSection.classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);
    output.innerHTML =
      "<strong>Network Error.</strong><br><span style='color:#aaa;'>Please try again later.</span>";
    outputSection.classList.remove("hidden");
  } finally {
    loader.classList.add("hidden");
  }
}

// =============================================
// FORMATTING OUTPUT TEXT
// =============================================
function formatClarityText(text) {
  let safe = escapeHtml(text);

  // **bold**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 1) → bold heading
  safe = safe.replace(/(\d\)\s)/g, "<br><br><strong>$1</strong>");

  // \n → <br>
  safe = safe.replace(/\n/g, "<br>");

  return safe;
}

// =============================================
// FIRESTORE HISTORY FETCH
// =============================================
async function loadFirestoreHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = `<p class="loading-text">Loading history…</p>`;

  try {
    const res = await fetch(`${API_BASE}/history`);
    const data = await res.json();

    if (!data.history || data.history.length === 0) {
      list.innerHTML =
        "<p style='color:#6b7280;font-size:0.9rem;'>No history found.</p>";
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
        minute: "2-digit",
      });

      div.innerHTML = `
        <div class="history-item-header">
          <span>${dateStr}</span>
          <span class="history-item-tag">MindSweep</span>
        </div>

        <div class="history-item-message">
          ${escapeHtml(item.message).slice(0, 160)}${
        item.message.length > 160 ? "..." : ""
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
      "<p style='color:red;font-size:0.9rem;'>Failed to load history.</p>";
  }
}

// =============================================
// HELPERS
// =============================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
// ===============================
// TOAST NOTIFICATION SYSTEM
// ===============================
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


