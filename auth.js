// ============================================================
//  auth.js  —  GreenSweep Shared Authentication Helper
//
//  This file handles everything related to users:
//    - Registering (signing up)
//    - Logging in
//    - Logging out
//    - Checking who is currently logged in
//
//  HOW TO USE IN ANY PAGE:
//    1. Add this BEFORE your page's own script:
//       <script src="auth.js"></script>
//    2. Then call any function below from your page script.
//
//  localStorage is like a sticky note the browser keeps
//  for our website — it survives page refreshes!
// ============================================================


// ── Key names we use to store data in localStorage ──────────
// Using constants means we never mistype a key name later.
const USERS_KEY   = "greensweep_users";    // array of all registered users
const SESSION_KEY = "greensweep_session";  // the currently logged-in user


// ── Get the currently logged-in user ────────────────────────
// Returns a user object  { id, name, email, role }
// Returns null if nobody is logged in.
function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // If the saved data is somehow broken, treat as logged out
    return null;
  }
}


// ── Get every registered user (returns an array) ────────────
function getAllUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}


// ── Register a brand-new user ────────────────────────────────
// name     : string  e.g. "Sara Ahmed"
// email    : string  e.g. "sara@gmail.com"
// password : string  e.g. "mypassword"
// role     : string  "user" or "admin"  (default "user")
//
// Returns  { ok: true,  user: { ... } }   on success
// Returns  { ok: false, message: "..." }  on failure
function registerUser(name, email, password, role) {
  const users = getAllUsers();

  // Check if someone already registered with this email
  const emailLower = email.toLowerCase().trim();
  const alreadyExists = users.find(u => u.email === emailLower);
  if (alreadyExists) {
    return { ok: false, message: "An account with this email already exists." };
  }

  // Build the new user object
  const newUser = {
    id        : Date.now(),              // unique ID using current timestamp
    name      : name.trim(),
    email     : emailLower,
    password  : password,               // real apps would hash this — for learning it's plain text
    role      : role || "user",
    createdAt : new Date().toISOString()
  };

  // Add to the users array and save
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Log them in immediately — save a safe version (no password) to the session
  const sessionUser = {
    id    : newUser.id,
    name  : newUser.name,
    email : newUser.email,
    role  : newUser.role
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

  return { ok: true, user: sessionUser };
}


// ── Log in an existing user ──────────────────────────────────
// Returns  { ok: true,  user: { ... } }   on success
// Returns  { ok: false, message: "..." }  on failure
function loginUser(email, password) {
  const users = getAllUsers();
  const emailLower = email.toLowerCase().trim();

  const found = users.find(u => u.email === emailLower && u.password === password);

  if (!found) {
    return { ok: false, message: "Incorrect email or password. Please try again." };
  }

  // Save a safe version to the session (we never store the password in the session)
  const sessionUser = {
    id    : found.id,
    name  : found.name,
    email : found.email,
    role  : found.role
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

  return { ok: true, user: sessionUser };
}


// ── Log out the current user ─────────────────────────────────
// Clears the session and sends the user to the home page.
function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "Home.html";
}


// ── Guard: redirect to login if not logged in ────────────────
// Call this at the top of any page that requires a login.
// Example usage at top of Report.js:
//   const user = requireLogin("Report.html");
//   if (!user) return;  -- stop, redirect is already happening
function requireLogin(returnPage) {
  const user = getCurrentUser();
  if (!user) {
    // Remember where the user wanted to go so we can send them back after login
    const next = encodeURIComponent(returnPage || window.location.pathname.split("/").pop());
    window.location.href = "Login.html?next=" + next;
    return null;
  }
  return user;
}


// ── Guard: redirect to login if not an admin ─────────────────
// Use this on admin-only pages like Admin.html.
function requireAdmin(returnPage) {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    const next = encodeURIComponent(returnPage || window.location.pathname.split("/").pop());
    window.location.href = "Login.html?next=" + next;
    return null;
  }
  return user;
}


// ── Seed a default admin account ────────────────────────────
// This runs once when the page loads.
// If there is no admin yet, it creates one so you can test right away.
// Default admin login:  admin@greensweep.com  /  admin123
function seedDefaultAdmin() {
  const users = getAllUsers();
  const adminExists = users.find(u => u.role === "admin");
  if (!adminExists) {
    users.push({
      id        : 1,
      name      : "Admin",
      email     : "admin@greensweep.com",
      password  : "admin123",
      role      : "admin",
      createdAt : new Date().toISOString()
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

// Run the seed immediately when this file is loaded
seedDefaultAdmin();
