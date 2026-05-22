// ============================================================
//  GreenSweep — home.js
//  Depends on: auth.js (loaded first in Home.html)
// ============================================================


// This runs everything once the page is fully loaded
window.onload = function () {
  renderAuthUI();    // show correct Sign In or Sign Out button
  setupSearch();
  setupSubscribe();
};


// ============================================================
//  AUTH — Sign In / Sign Out (uses auth.js)
// ============================================================

// Looks at who is logged in and fills the topbar + sidebar
// with either a "Sign In" link or a "Name + Sign Out" button.
function renderAuthUI() {

  var user = getCurrentUser(); // from auth.js — returns user object or null

  // These two divs in Home.html get filled by this function
  var topbarEl  = document.getElementById("topbarUserArea");
  var sidebarEl = document.getElementById("sidebarUserArea");

  if (user) {

    // ── LOGGED IN: show username and a Sign Out button ──
    var topbarHtml =
      '<button class="btn-user" onclick="logoutUser()">' +
        '<span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;">account_circle</span>' +
        ' ' + user.name +
        ' <span class="material-symbols-outlined" style="font-size:15px;vertical-align:middle;" title="Sign Out">logout</span>' +
      '</button>';

    var sidebarHtml =
      '<div style="font-size:13px;font-weight:600;margin-bottom:10px;color:#111814;">' +
        '<span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">account_circle</span> ' +
        user.name +
      '</div>' +
      '<button class="btn-primary sidebar-signin" onclick="logoutUser()">Sign Out</button>';

    if (topbarEl)  topbarEl.innerHTML  = topbarHtml;
    if (sidebarEl) sidebarEl.innerHTML = sidebarHtml;

  } else {

    // ── NOT LOGGED IN: show Sign In link ──
    var guestTopbar   = '<a href="Login.html" class="btn-primary">Sign In</a>';
    var guestSidebar  =
      '<a href="Login.html" class="btn-primary sidebar-signin" ' +
        'style="display:flex;justify-content:center;text-decoration:none;">Sign In</a>';

    if (topbarEl)  topbarEl.innerHTML  = guestTopbar;
    if (sidebarEl) sidebarEl.innerHTML = guestSidebar;
  }
}


// ============================================================
//  SEARCH — show a clear (x) button when user types
// ============================================================

function setupSearch() {

  var searchInputs = document.querySelectorAll(".search-box input");

  searchInputs.forEach(function (input) {

    input.addEventListener("input", function () {

      // Find or create the clear button inside the search box
      var clearBtn = input.parentElement.querySelector(".clear-btn");

      if (input.value.length > 0) {

        // Show the clear button if not already there
        if (!clearBtn) {
          clearBtn = document.createElement("button");
          clearBtn.className = "clear-btn";
          clearBtn.textContent = "×";
          clearBtn.style.cssText =
            "position:absolute; right:10px; top:50%; transform:translateY(-50%);" +
            "background:none; border:none; cursor:pointer; font-size:15px; color:#608a71;";

          clearBtn.onclick = function () {
            input.value = "";
            clearBtn.remove();
          };

          input.parentElement.appendChild(clearBtn);
        }

      } else {
        // Remove the clear button when input is empty
        if (clearBtn) clearBtn.remove();
      }
    });
  });
}


// ============================================================
//  SUBSCRIBE — validate email and show success message
// ============================================================

function setupSubscribe() {

  var subscribeRow = document.querySelector(".subscribe-row");
  if (!subscribeRow) return;

  var emailInput = subscribeRow.querySelector("input");
  var submitBtn  = subscribeRow.querySelector(".btn-primary");
  if (!emailInput || !submitBtn) return;

  submitBtn.onclick = function () {
    doSubscribe(emailInput);
  };

  emailInput.onkeydown = function (e) {
    if (e.key === "Enter") doSubscribe(emailInput);
  };
}

function doSubscribe(emailInput) {

  var email = emailInput.value.trim();

  if (email === "" || !email.includes("@")) {
    showToast("Please enter a valid email!", "red");
    return;
  }

  emailInput.value = "";
  showToast("Subscribed! Thank you for joining GreenSweep.");
}


// ============================================================
//  TOAST — small message that pops up at the bottom
// ============================================================

function showToast(message, color) {

  // Remove old toast if any
  var old = document.getElementById("toast");
  if (old) old.remove();

  var bg = color === "red" ? "#dc2626" : "#111814";

  var toast = document.createElement("div");
  toast.id = "toast";
  toast.textContent = message;
  toast.style.cssText =
    "position:fixed; bottom:24px; left:50%; transform:translateX(-50%);" +
    "background:" + bg + "; color:#fff; padding:12px 24px; border-radius:10px;" +
    "font-size:14px; z-index:9999; box-shadow:0 4px 16px rgba(0,0,0,0.2);";

  document.body.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(function () {
    toast.remove();
  }, 3000);
}


// ============================================================
//  FOOTER LINKS — Privacy, Terms, Cookies
// ============================================================

function showPrivacy() {
  showInfoBox(
    "Privacy Policy",
    "GreenSweep only collects information needed to improve city services. " +
    "We do NOT sell your data to anyone. " +
    "All reports you submit are kept secure and used only for environmental purposes."
  );
}

function showTerms() {
  showInfoBox(
    "Terms of Service",
    "By using GreenSweep, you agree to report only real environmental issues. " +
    "False or spam reports may get your account suspended. " +
    "Please be respectful to other users and municipal workers."
  );
}

function showCookies() {
  showInfoBox(
    "Cookie Policy",
    "GreenSweep uses cookies only to keep you logged in and save your preferences. " +
    "We do NOT use any advertising or tracking cookies. " +
    "You can clear cookies anytime from your browser settings."
  );
}

// Helper — shows a popup box with a title and message
function showInfoBox(title, message) {

  var old = document.getElementById("infoBox");
  if (old) old.remove();

  var overlay = document.createElement("div");
  overlay.id = "infoBox";
  overlay.style.cssText =
    "position:fixed; top:0; left:0; width:100%; height:100%;" +
    "background:rgba(0,0,0,0.5); z-index:9999;" +
    "display:flex; justify-content:center; align-items:center;";

  var box = document.createElement("div");
  box.style.cssText =
    "background:#fff; border-radius:16px; padding:32px; width:90%; max-width:440px;" +
    "font-family:Arial,sans-serif; box-shadow:0 20px 60px rgba(0,0,0,0.2);";

  var h2 = document.createElement("h2");
  h2.textContent = title;
  h2.style.cssText = "margin:0 0 16px; font-size:20px; font-weight:900; color:#111814;";

  var p = document.createElement("p");
  p.textContent = message;
  p.style.cssText = "margin:0 0 24px; color:#608a71; font-size:14px; line-height:1.7;";

  var btn = document.createElement("button");
  btn.textContent = "Got It";
  btn.style.cssText =
    "background:#0df269; border:none; border-radius:8px;" +
    "padding:10px 28px; font-size:14px; font-weight:700; cursor:pointer; color:#111814;";

  btn.onclick = function () { overlay.remove(); };
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  box.appendChild(h2);
  box.appendChild(p);
  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}
