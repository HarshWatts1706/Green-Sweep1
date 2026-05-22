// ============================================================
//  Report.js  —  GreenSweep Report Page Logic
//  Depends on: auth.js (loaded first in Report.html)
//
//  What this does:
//   1. Blocks page if not logged in
//   2. Fills user info in the topbar / banner
//   3. GPS location (lat/lng only)
//   4. Photo upload preview
//   5. Saves report to localStorage so Admin can read it
// ============================================================

var REPORTS_KEY    = "greensweep_reports";
var currentUser    = null;
var selectedPhotos = [];


document.addEventListener("DOMContentLoaded", function () {

  currentUser = getCurrentUser();

  document.getElementById("loginWall").style.display = "none";
  document.getElementById("reportMain").classList.remove("form-hidden");

  if (currentUser) {
    renderTopbarUser(currentUser);
    renderReporterBanner(currentUser);
  } else {
    renderTopbarGuest();
    renderReporterBannerGuest();
  }

  document.getElementById("btnGps").addEventListener("click", fetchGPS);
  document.getElementById("photoInput").addEventListener("change", handlePhotoSelect);
  document.getElementById("btnSubmit").addEventListener("click", handleSubmit);
  document.getElementById("btnDraft").addEventListener("click", handleDraft);
  document.getElementById("btnCancel").addEventListener("click", function () { window.location.href = "Home.html"; });
});


function renderTopbarGuest() {
  var html = '<a href="Login.html?next=Report.html" class="btn-topbar-login">Login / Sign Up</a>';
  document.getElementById("topbarUserArea").innerHTML  = html;
  document.getElementById("sidebarUserArea").innerHTML = html;
}

function renderTopbarUser(user) {
  var html =
    '<button class="btn-topbar-user" onclick="logoutUser()">' +
    '<span class="material-symbols-outlined">account_circle</span>' +
    user.name +
    '<span class="material-symbols-outlined" title="Logout">logout</span>' +
    '</button>';
  document.getElementById("topbarUserArea").innerHTML  = html;
  document.getElementById("sidebarUserArea").innerHTML = html;
}

function renderReporterBanner(user) {
  document.getElementById("reporterName").textContent = "Reporting as: " + user.name + " (" + user.email + ")";
  document.getElementById("reporterRole").textContent = user.role === "admin" ? "Admin" : "Citizen";
}

function renderReporterBannerGuest() {
  var banner = document.getElementById("reporterBanner");
  banner.innerHTML =
    '<span class="material-symbols-outlined">info</span>' +
    '<span>You must <a href="Login.html?next=Report.html" style="color: #0df269; font-weight: 700;">login or sign up</a> before submitting a report.</span>';
}


// ══ GPS ══════════════════════════════════════════════════════

function fetchGPS() {
  var btn    = document.getElementById("btnGps");
  var status = document.getElementById("gpsStatus");

  if (!navigator.geolocation) {
    status.textContent = "GPS not supported by your browser.";
    return;
  }

  btn.disabled       = true;
  btn.textContent    = "Detecting location…";
  status.textContent = "⏳ Getting your coordinates…";

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      document.getElementById("inputLat").value = pos.coords.latitude.toFixed(6);
      document.getElementById("inputLng").value = pos.coords.longitude.toFixed(6);
      status.textContent = "✅ Coordinates saved.";
      btn.disabled  = false;
      btn.innerHTML = '<span class="material-symbols-outlined">my_location</span> Location Detected';
    },
    function (err) {
      status.textContent = "Could not get location: " + err.message;
      btn.disabled  = false;
      btn.innerHTML = '<span class="material-symbols-outlined">my_location</span> Use My Current Location';
    },
    { timeout: 10000 }
  );
}


// ══ PHOTO UPLOAD ═════════════════════════════════════════════

function handlePhotoSelect(e) {
  var files     = Array.from(e.target.files);
  var remaining = 5 - selectedPhotos.length;
  if (files.length > remaining) {
    showAlert("You can upload a maximum of 5 photos.", "error");
    files = files.slice(0, remaining);
  }
  files.forEach(function (file) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      selectedPhotos.push(ev.target.result);
      renderPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews() {
  var container = document.getElementById("photoPreview");
  container.innerHTML = "";
  selectedPhotos.forEach(function (src, index) {
    var wrap = document.createElement("div");
    wrap.className = "photo-thumb";
    var img = document.createElement("img");
    img.src = src;
    img.alt = "Photo " + (index + 1);
    var btn = document.createElement("button");
    btn.className   = "photo-thumb-remove";
    btn.textContent = "✕";
    btn.title       = "Remove";
    btn.onclick     = function () { removePhoto(index); };
    wrap.appendChild(img);
    wrap.appendChild(btn);
    container.appendChild(wrap);
  });
}

function removePhoto(index) {
  selectedPhotos.splice(index, 1);
  renderPreviews();
}


// ══ SUBMIT / DRAFT ════════════════════════════════════════════

function handleSubmit() {
  if (!currentUser) {
    showAlert("Please login or sign up to submit a report.", "error");
    setTimeout(function () { window.location.href = "Login.html?next=Report.html"; }, 1500);
    return;
  }
  var report = buildReport("submitted");
  if (!report) return;
  saveReport(report);
  showAlert("✅ Report submitted successfully! Reference: " + report.id, "success");
  setTimeout(clearForm, 2000);
}

function handleDraft() {
  var report = buildReport("draft");
  if (!report) return;
  saveReport(report);
  showAlert(currentUser ? "Draft saved. You can come back to finish it later." : "Draft saved. Login to save it permanently.", "success");
}

function buildReport(status) {
  var category = document.getElementById("wasteCategory").value;
  var urgency  = document.getElementById("urgency").value;
  var desc     = document.getElementById("description").value.trim();
  var lat      = document.getElementById("inputLat").value.trim();
  var lng      = document.getElementById("inputLng").value.trim();

  if (status === "submitted") {
    if (!category)    { showAlert("Please select a waste category.", "error"); return null; }
    if (!desc)        { showAlert("Please add a description.", "error"); return null; }
    if (!lat || !lng) { showAlert("Please provide a location using the GPS button.", "error"); return null; }
  }

  return {
    id          : "GS-" + Date.now(),
    status      : status,
    urgency     : urgency,
    category    : category,
    description : desc,
    lat         : lat,
    lng         : lng,
    photos      : selectedPhotos.slice(),
    reportedBy  : {
      id    : currentUser.id,
      name  : currentUser.name,
      email : currentUser.email,
      role  : currentUser.role
    },
    createdAt   : new Date().toISOString()
  };
}

function saveReport(report) {
  var reports = getReports();
  reports.push(report);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

function getReports() {
  try { return JSON.parse(localStorage.getItem(REPORTS_KEY)) || []; }
  catch { return []; }
}

function clearForm() {
  document.getElementById("wasteCategory").value   = "";
  document.getElementById("urgency").value         = "medium";
  document.getElementById("description").value     = "";
  document.getElementById("inputLat").value        = "";
  document.getElementById("inputLng").value        = "";
  document.getElementById("gpsStatus").textContent = "";
  document.getElementById("photoInput").value      = "";
  selectedPhotos = [];
  renderPreviews();
  hideAlert();
}


// ══ ALERT HELPERS ═════════════════════════════════════════════

function showAlert(msg, type) {
  var box = document.getElementById("alertBox");
  box.textContent = msg;
  box.className   = "alert alert--" + type;
  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideAlert() {
  var box = document.getElementById("alertBox");
  box.className   = "alert alert--hidden";
  box.textContent = "";
}
