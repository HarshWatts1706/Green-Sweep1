// ============================================================
//  Login.js  —  GreenSweep Login / Sign Up page logic
//
//  Depends on:  auth.js  (must be loaded first in the HTML)
//
//  What this file does:
//    1. If user is already logged in → redirect them away
//    2. Switches between the Login and Sign Up tabs
//    3. Handles the Login form submit
//    4. Handles the Sign Up form submit
//    5. Toggles password visibility
// ============================================================


// ── Run as soon as the page finishes loading ─────────────────
document.addEventListener("DOMContentLoaded", function () {

  // 1. If the user is already logged in, skip this page entirely
  const alreadyLoggedIn = getCurrentUser(); // from auth.js
  if (alreadyLoggedIn) {
    redirectAfterAuth();
    return; // stop here — no need to set up the forms
  }

  // 2. Check if the URL has ?tab=signup — link from another page can open sign-up directly
  //    e.g.  Login.html?tab=signup
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("tab") === "signup") {
    showTab("signup");
  }

  // 3. Wire up the Login form submit
  document.getElementById("loginForm").addEventListener("submit", handleLogin);

  // 4. Wire up the Sign Up form submit
  document.getElementById("signupForm").addEventListener("submit", handleSignup);

  // 5. Wire up the password toggle buttons
  document.getElementById("toggleLoginPw").addEventListener("click", function () {
    togglePassword("loginPassword", this);
  });

  document.getElementById("toggleSignupPw").addEventListener("click", function () {
    togglePassword("signupPassword", this);
  });

});


// ── Switch between the Login and Sign Up tabs ────────────────
// tabName: "login" or "signup"
function showTab(tabName) {
  // Grab both forms
  var loginForm  = document.getElementById("loginForm");
  var signupForm = document.getElementById("signupForm");

  // Grab both tab buttons
  var btnLogin  = document.getElementById("btnLogin");
  var btnSignup = document.getElementById("btnSignup");

  if (tabName === "login") {
    // Show login form, hide signup form
    loginForm.classList.remove("auth-form--hidden");
    signupForm.classList.add("auth-form--hidden");

    // Highlight the login tab button
    btnLogin.classList.add("active");
    btnSignup.classList.remove("active");
  } else {
    // Show signup form, hide login form
    signupForm.classList.remove("auth-form--hidden");
    loginForm.classList.add("auth-form--hidden");

    // Highlight the signup tab button
    btnSignup.classList.add("active");
    btnLogin.classList.remove("active");
  }

  // Clear any previous error/success message when switching tabs
  hideAlert();
}


// ── Handle the Login form submission ─────────────────────────
function handleLogin(event) {
  // Prevent the browser from reloading the page (default form behaviour)
  event.preventDefault();

  var email    = document.getElementById("loginEmail").value.trim();
  var password = document.getElementById("loginPassword").value;

  // Basic check — just in case browser validation was bypassed
  if (!email || !password) {
    showAlert("Please fill in both fields.", "error");
    return;
  }

  // Try to log in using auth.js
  var result = loginUser(email, password);

  if (!result.ok) {
    showAlert(result.message, "error");
    return;
  }

  // Success!
  showAlert("Welcome back, " + result.user.name + "! Redirecting...", "success");

  // Wait a short moment so they can read the message, then redirect
  setTimeout(redirectAfterAuth, 900);
}


// ── Handle the Sign Up form submission ───────────────────────
function handleSignup(event) {
  event.preventDefault();

  var name     = document.getElementById("signupName").value.trim();
  var email    = document.getElementById("signupEmail").value.trim();
  var password = document.getElementById("signupPassword").value;

  // Extra validation on top of HTML minlength
  if (password.length < 6) {
    showAlert("Password must be at least 6 characters.", "error");
    return;
  }

  // Try to register using auth.js
  var result = registerUser(name, email, password, "user");

  if (!result.ok) {
    showAlert(result.message, "error");
    return;
  }

  showAlert("Account created! Welcome, " + result.user.name + "! Redirecting...", "success");
  setTimeout(redirectAfterAuth, 900);
}


// ── Toggle a password input between hidden and visible ───────
// inputId : the id of the <input type="password">
// btn     : the button element that was clicked (so we can swap its icon)
function togglePassword(inputId, btn) {
  var input = document.getElementById(inputId);
  var icon  = btn.querySelector(".material-symbols-outlined");

  if (input.type === "password") {
    input.type        = "text";
    icon.textContent  = "visibility_off"; // change icon to "hide"
  } else {
    input.type        = "password";
    icon.textContent  = "visibility";     // change icon back to "show"
  }
}


// ── Show an alert message ─────────────────────────────────────
// msg  : the text to show
// type : "error" (red) or "success" (green)
function showAlert(msg, type) {
  var box = document.getElementById("alertBox");

  box.textContent = msg;

  // Remove all state classes first, then apply the right one
  box.classList.remove("alert--hidden", "alert--error", "alert--success");

  if (type === "success") {
    box.classList.add("alert--success");
  } else {
    box.classList.add("alert--error");
  }
}


// ── Hide the alert box ────────────────────────────────────────
function hideAlert() {
  var box = document.getElementById("alertBox");
  box.classList.add("alert--hidden");
  box.classList.remove("alert--error", "alert--success");
  box.textContent = "";
}


// ── Redirect after successful login or signup ─────────────────
// If the URL had a ?next=... param, go there. Otherwise go Home.
function redirectAfterAuth() {
  var params  = new URLSearchParams(window.location.search);
  var nextUrl = params.get("next");

  if (nextUrl) {
    window.location.href = decodeURIComponent(nextUrl);
  } else {
    window.location.href = "Home.html";
  }
}
