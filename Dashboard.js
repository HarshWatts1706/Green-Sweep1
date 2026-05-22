// ============================================================
// Dashboard.js - GreenSweep Admin Dashboard
// Depends on: auth.js (loaded first in Dashboard.html)
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    // ── Show logged-in user's name in the topbar ──────────────
    // Gets the current user from auth.js and fills in their name/role
    renderDashboardUser();

    // ── Search Functionality ──────────────────────────────────
    var searchInput = document.getElementById("dashboardSearch");
    var tableBody   = document.getElementById("reportsTableBody");

    if (searchInput && tableBody) {
        searchInput.addEventListener("input", function () {
            var searchText = searchInput.value.toLowerCase().trim();
            var rows = tableBody.querySelectorAll("tr");

            rows.forEach(function (row) {
                var rowText = row.textContent.toLowerCase();
                // Show row if it matches search, hide if not
                if (rowText.includes(searchText)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    }

    // ── Notification Bell ─────────────────────────────────────
    var notifBtn = document.getElementById("notifBtn");
    if (notifBtn) {
        notifBtn.addEventListener("click", function () {
            alert("You have 3 new notifications:\n\n• New report #CC-8430 submitted\n• Report #CC-8425 was resolved\n• High priority alert in Zone 4");
        });
    }

});


// ── Fill the topbar with the logged-in user's info ───────────
// If nobody is logged in, shows a generic "Admin" label.
function renderDashboardUser() {

    var user = getCurrentUser(); // from auth.js

    var nameEl   = document.getElementById("dashUserName");
    var roleEl   = document.getElementById("dashUserRole");

    if (user) {
        // Show their actual name and role
        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = user.role === "admin" ? "Admin" : "Citizen";
    } else {
        // No one logged in — show a default and offer a sign-in link
        if (nameEl) nameEl.textContent = "Not Signed In";
        if (roleEl) {
            roleEl.innerHTML = '<a href="Login.html" style="color:#0df269;font-weight:700;">Sign In</a>';
        }
    }
}
