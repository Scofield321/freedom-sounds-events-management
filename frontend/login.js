import { BASE_URL } from "./config.js";
import { Session } from "./session.js";
import { showLoader, hideLoader } from "./loader.js";

const form = document.getElementById("login-form");
const togglePassword = document.getElementById("toggle-password");
const passwordInput = document.getElementById("password");

// Toggle show/hide password
togglePassword.addEventListener("click", () => {
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

// Handle login submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    await Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please enter both email and password.",
    });
    return;
  }

  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Unauthorized");

    // Save token and user
    Session.set({
      token: data.token,
      user: data.user || null,
    });

    // Redirect to dashboard
    window.location.href = "admin-dashboard.html";
  } catch (err) {
    hideLoader(); // hide loader before showing Swal
    await Swal.fire({
      icon: "error",
      title: "Login Failed",
      text: err.message || "Invalid email or password",
    });
  } finally {
    hideLoader();
  }
});
