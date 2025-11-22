// logout.js
import { Session } from "./session.js";

function setupLogout() {
  // Select all logout links (sidebar + bottom nav)
  const logoutLinks = document.querySelectorAll(".logout");

  logoutLinks.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();

      const result = await Swal.fire({
        title: "Logout",
        text: "Are you sure you want to logout?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, logout",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        // Clear session
        Session.clear();

        // Optional: show success message
        await Swal.fire({
          icon: "success",
          title: "Logged out",
          text: "You have been logged out successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        // Redirect to login page
        window.location.href = "admin-login.html";
      }
    });
  });
}

// Initialize logout
setupLogout();
