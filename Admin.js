// ============================================
// Admin.js - GreenSweep Complaint Management
// ============================================
// This file makes the Admin page fully interactive:
//   1. Tabs  - filter cards by status (All, Pending, In Progress, Resolved)
//   2. Dropdowns - filter by urgency, type, and date
//   3. Pagination - split cards into pages (max 2 pages, 3 cards per page)
//   4. Mark as Resolved - update card status and tab counts

// ── SETTINGS ─────────────────────────────────────────
var CARDS_PER_PAGE = 3; // how many complaint cards to show at once

// ── FILTER STATE ──────────────────────────────────────
// These variables remember what the user has currently selected.
var currentStatus  = "all";   // matches data-status on cards
var currentUrgency = "all";   // matches data-urgency on cards
var currentType    = "all";   // matches data-type on cards
var currentDays    = 9999;    // show cards where data-days <= this number

// ── CURRENT PAGE ─────────────────────────────────────
var currentPage = 1;

// ── START EVERYTHING ─────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {

    // Read which tab is visually active on page load (e.g. "Pending")
    // and use that as the starting filter instead of "all"
    var activeTabEl = document.querySelector(".tab.active");
    if (activeTabEl) {
        currentStatus = activeTabEl.getAttribute("data-status") || "all";
    }

    // Read which days option is pre-selected in the dropdown
    var selectedDaysEl = document.querySelector("[data-filter-type='days'] .dropdown-item.selected");
    if (selectedDaysEl) {
        currentDays = parseInt(selectedDaysEl.getAttribute("data-value")) || 9999;
    }

    setupTabs();
    setupDropdowns();
    setupPagination();
    setupMarkAsResolved(); // ← new: wire up the Resolve buttons
    updateTabCounts();     // ← set correct counts on first load
    applyFilters();        // show cards on first load
});


// ==================================================
// 1. TABS
// ==================================================
function setupTabs() {
    var tabs = document.querySelectorAll(".tab");

    tabs.forEach(function (tab) {
        tab.addEventListener("click", function (e) {
            e.preventDefault();

            tabs.forEach(function (t) { t.classList.remove("active"); });
            tab.classList.add("active");

            currentStatus = tab.getAttribute("data-status");
            currentPage   = 1;
            applyFilters();
        });
    });
}


// ==================================================
// 2. DROPDOWNS
// ==================================================
function setupDropdowns() {

    document.addEventListener("click", function (e) {
        if (!e.target.closest(".filter-dropdown-wrapper")) {
            closeAllDropdowns();
        }
    });

    var wrappers = document.querySelectorAll(".filter-dropdown-wrapper");

    wrappers.forEach(function (wrapper) {
        var btn  = wrapper.querySelector(".filter-btn");
        var menu = wrapper.querySelector(".dropdown-menu");

        btn.addEventListener("click", function (e) {
            e.stopPropagation();

            var isAlreadyOpen = menu.classList.contains("open");
            closeAllDropdowns();

            if (!isAlreadyOpen) {
                menu.classList.add("open");
            }
        });

        var items = menu.querySelectorAll(".dropdown-item");

        items.forEach(function (item) {
            item.addEventListener("click", function (e) {
                e.stopPropagation();

                var filterType = wrapper.getAttribute("data-filter-type");
                var value      = item.getAttribute("data-value");
                var label      = item.querySelector(".item-label")
                                    ? item.querySelector(".item-label").textContent.trim()
                                    : item.textContent.trim();

                if (filterType === "urgency") {
                    currentUrgency = value;
                }
                else if (filterType === "type") {
                    currentType = value;
                    syncTypeDropdowns(value);
                }
                else if (filterType === "days") {
                    currentDays = parseInt(value);
                }

                var labelEl = btn.querySelector(".filter-label");
                if (labelEl) { labelEl.textContent = label; }

                items.forEach(function (i) { i.classList.remove("selected"); });
                item.classList.add("selected");

                closeAllDropdowns();
                currentPage = 1;
                applyFilters();
            });
        });
    });
}

function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-menu.open").forEach(function (menu) {
        menu.classList.remove("open");
    });
}

function syncTypeDropdowns(selectedValue) {
    var typeWrappers = document.querySelectorAll("[data-filter-type='type']");

    typeWrappers.forEach(function (wrapper) {
        var items = wrapper.querySelectorAll(".dropdown-item");
        items.forEach(function (item) {
            if (item.getAttribute("data-value") === selectedValue) {
                item.classList.add("selected");
                var labelEl = wrapper.querySelector(".filter-label");
                if (labelEl) {
                    var newLabel = item.querySelector(".item-label")
                                    ? item.querySelector(".item-label").textContent.trim()
                                    : item.textContent.trim();
                    labelEl.textContent = newLabel;
                }
            } else {
                item.classList.remove("selected");
            }
        });
    });
}


// ==================================================
// 3. FILTERING
// ==================================================
function applyFilters() {
    var allCards = document.querySelectorAll(".complaint-card");
    var matchedCards = [];

    allCards.forEach(function (card) {
        var cardStatus  = card.getAttribute("data-status");
        var cardUrgency = card.getAttribute("data-urgency");
        var cardType    = card.getAttribute("data-type");
        var cardDays    = parseInt(card.getAttribute("data-days"));

        var shouldShow = true;

        if (currentStatus  !== "all" && cardStatus  !== currentStatus)  shouldShow = false;
        if (currentUrgency !== "all" && cardUrgency !== currentUrgency) shouldShow = false;
        if (currentType    !== "all" && cardType    !== currentType)    shouldShow = false;
        if (cardDays > currentDays) shouldShow = false;

        card.style.display = "none";

        if (shouldShow) matchedCards.push(card);
    });

    var startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    var endIndex   = startIndex + CARDS_PER_PAGE;

    for (var i = startIndex; i < endIndex && i < matchedCards.length; i++) {
        matchedCards[i].style.display = "";
    }

    var emptyMsg = document.getElementById("empty-message");
    if (matchedCards.length === 0) {
        if (!emptyMsg) {
            emptyMsg = document.createElement("p");
            emptyMsg.id = "empty-message";
            emptyMsg.style.cssText = "grid-column:1/-1; text-align:center; color:#608a71; padding:48px 20px; font-size:14px;";
            emptyMsg.innerHTML = '<span class="material-symbols-outlined" style="display:block;font-size:40px;margin-bottom:8px;color:#dbe6df;">filter_list_off</span>No complaints match the current filters.';
            document.querySelector(".cards-grid").appendChild(emptyMsg);
        }
        emptyMsg.style.display = "";
    } else {
        if (emptyMsg) emptyMsg.style.display = "none";
    }

    updatePagination(matchedCards.length);
}


// ==================================================
// 4. PAGINATION
// ==================================================
function setupPagination() {
    var btnPrev = document.getElementById("page-btn-prev");
    var btn1    = document.getElementById("page-btn-1");
    var btn2    = document.getElementById("page-btn-2");
    var btnNext = document.getElementById("page-btn-next");

    btnPrev.addEventListener("click", function () {
        if (currentPage > 1) { currentPage--; applyFilters(); }
    });
    btn1.addEventListener("click", function () { currentPage = 1; applyFilters(); });
    btn2.addEventListener("click", function () { currentPage = 2; applyFilters(); });
    btnNext.addEventListener("click", function () {
        if (currentPage < getTotalPages()) { currentPage++; applyFilters(); }
    });
}

function getTotalPages() {
    var allCards = document.querySelectorAll(".complaint-card");
    var count = 0;

    allCards.forEach(function (card) {
        var match = true;
        if (currentStatus  !== "all" && card.getAttribute("data-status")  !== currentStatus)  match = false;
        if (currentUrgency !== "all" && card.getAttribute("data-urgency") !== currentUrgency) match = false;
        if (currentType    !== "all" && card.getAttribute("data-type")    !== currentType)    match = false;
        if (parseInt(card.getAttribute("data-days")) > currentDays) match = false;
        if (match) count++;
    });

    return Math.min(2, Math.ceil(count / CARDS_PER_PAGE));
}

function updatePagination(totalMatchedCards) {
    var totalPages = Math.min(2, Math.ceil(totalMatchedCards / CARDS_PER_PAGE));

    var btnPrev = document.getElementById("page-btn-prev");
    var btn1    = document.getElementById("page-btn-1");
    var btn2    = document.getElementById("page-btn-2");
    var btnNext = document.getElementById("page-btn-next");

    btn1.classList.toggle("active", currentPage === 1);
    btn2.classList.toggle("active", currentPage === 2);

    btn2.style.display = totalPages >= 2 ? "" : "none";

    if (currentPage <= 1) {
        btnPrev.style.opacity = "0.4";
        btnPrev.style.cursor  = "not-allowed";
        btnPrev.style.pointerEvents = "none";
    } else {
        btnPrev.style.opacity = "1";
        btnPrev.style.cursor  = "pointer";
        btnPrev.style.pointerEvents = "auto";
    }

    if (currentPage >= totalPages || totalPages <= 1) {
        btnNext.style.opacity = "0.4";
        btnNext.style.cursor  = "not-allowed";
        btnNext.style.pointerEvents = "none";
    } else {
        btnNext.style.opacity = "1";
        btnNext.style.cursor  = "pointer";
        btnNext.style.pointerEvents = "auto";
    }

    var paginationEl = document.getElementById("pagination-container");
    if (paginationEl) {
        paginationEl.style.display = totalMatchedCards === 0 ? "none" : "";
    }
}


// ==================================================
// 5. MARK AS RESOLVED
// ==================================================
// Uses event delegation: we listen on the whole cards grid.
// When any "Mark as Resolved" button is clicked, we find
// its parent card and change its status to "resolved".

function setupMarkAsResolved() {

    var grid = document.querySelector(".cards-grid");
    if (!grid) return;

    // Listen for clicks anywhere inside the cards grid
    grid.addEventListener("click", function (e) {

        // Check if the click landed on a "Mark as Resolved" button
        // .btn-primary.full is the class used only on that button in Admin.html
        var resolveBtn = e.target.closest(".btn-primary.full");
        if (!resolveBtn) return; // click was somewhere else — ignore

        // Find the complaint card that contains this button
        var card = resolveBtn.closest(".complaint-card");
        if (!card) return;

        // If already resolved, do nothing (button should be disabled anyway)
        if (card.getAttribute("data-status") === "resolved") return;

        // ── Change the card's status ──
        card.setAttribute("data-status", "resolved");

        // ── Update the button: disable it and change text ──
        resolveBtn.textContent = "✓ Resolved";
        resolveBtn.disabled    = true;
        resolveBtn.style.opacity  = "0.55";
        resolveBtn.style.cursor   = "default";
        resolveBtn.style.boxShadow = "none";

        // ── Change the tag badge on the card image if present ──
        var tag = card.querySelector(".card-tag");
        if (tag) {
            tag.textContent = "Resolved";
            tag.className   = "card-tag plain"; // switch from urgent red to plain style
        }

        // ── Update the tab count numbers (e.g. "Pending (3)" → "Pending (2)") ──
        updateTabCounts();

        // ── Re-draw visible cards (respects current tab/filter) ──
        currentPage = 1;
        applyFilters();

        // ── Show a small toast message at the bottom of the screen ──
        showResolvedToast();
    });
}


// Count how many cards have each status and update the tab labels.
// e.g.  All Reports (5) | Pending (2) | In Progress (2) | Resolved (1)
function updateTabCounts() {

    var allCards = document.querySelectorAll(".complaint-card");

    // Tally up statuses
    var counts = { all: 0, pending: 0, "in-progress": 0, resolved: 0 };

    allCards.forEach(function (card) {
        var status = card.getAttribute("data-status");
        counts.all++;
        if (counts[status] !== undefined) {
            counts[status]++;
        }
    });

    // Map status values to human-readable labels for each tab
    var tabLabels = {
        "all"         : "All Reports",
        "pending"     : "Pending",
        "in-progress" : "In Progress",
        "resolved"    : "Resolved"
    };

    // Update each tab button's text
    var tabs = document.querySelectorAll(".tab");
    tabs.forEach(function (tab) {
        var status = tab.getAttribute("data-status");
        var label  = tabLabels[status] || status;
        var count  = counts[status] !== undefined ? counts[status] : 0;
        tab.textContent = label + " (" + count + ")";
    });
}


// Small toast notification at the bottom of the screen
function showResolvedToast() {

    // Remove any existing toast first
    var old = document.getElementById("adminResolveToast");
    if (old) old.remove();

    var toast = document.createElement("div");
    toast.id = "adminResolveToast";
    toast.textContent = "✓ Complaint marked as resolved!";
    toast.style.cssText =
        "position:fixed; bottom:28px; left:50%; transform:translateX(-50%);" +
        "background:#111814; color:#0df269; padding:12px 28px;" +
        "border-radius:10px; font-size:14px; font-weight:600;" +
        "z-index:9999; box-shadow:0 4px 16px rgba(0,0,0,0.22);" +
        "white-space:nowrap;";

    document.body.appendChild(toast);

    // Remove after 2.5 seconds
    setTimeout(function () {
        if (toast.parentNode) toast.remove();
    }, 2500);
}
