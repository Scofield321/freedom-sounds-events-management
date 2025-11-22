import { loadProducts } from "./manage-products.js";
import { loadBanners } from "./manage-banners.js";
import { BASE_URL } from "./config.js";
import { Session } from "./session.js";

export function initAdminRouter() {
  const routes = {
    "#dashboard": loadDashboard,
    "#products": loadProducts,
    "#banners": loadBanners,
    "#logout": handleLogout,
  };

  function router() {
    const hash = window.location.hash || "#dashboard";
    const pageHandler = routes[hash];

    highlightActiveNav(hash);

    if (pageHandler) pageHandler();
    else {
      window.location.hash = "#dashboard";
      loadDashboard();
    }
  }

  function highlightActiveNav(hash) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === hash);
    });
  }

  // ---------------- Dashboard Page ----------------
  function loadDashboard() {
    const main = document.getElementById("main-content");
    main.innerHTML = `
      <section class="page" id="dashboardPage">
        <div class="welcome-card">
          <h1>Welcome, Admin</h1>
          <p>Use the menu to manage content and track performance.</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Products</h3>
            <p id="statProducts">0</p>
          </div>
          <div class="stat-card">
            <h3>Total Banners</h3>
            <p id="statBanners">0</p>
          </div>
          <div class="stat-card">
            <h3>Total Visits (This Month)</h3>
            <p id="statVisits">0</p>
          </div>
          <div class="stat-card">
            <h3>Most Searched Product</h3>
            <p id="statMostSearched">-</p>
            <small id="statMostSearchedCount"></small>
          </div>
        </div>

        <div class="chart-card">
          <h3>Product Searches (Last 6 Months)</h3>
          <canvas id="searchChart" width="400" height="200"></canvas>
        </div>
      </section>
    `;

    fetchDashboardStats();
  }

  // ---------------- Fetch Dashboard Stats ----------------
  async function fetchDashboardStats() {
    try {
      const [productsRes, bannersRes, analyticsRes] = await Promise.all([
        fetch(`${BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${Session.token()}` },
        }),
        fetch(`${BASE_URL}/banners`, {
          headers: { Authorization: `Bearer ${Session.token()}` },
        }),
        fetch(`${BASE_URL}/products/analytics`, {
          headers: { Authorization: `Bearer ${Session.token()}` },
        }),
      ]);

      const productsData = await productsRes.json();
      const bannersData = await bannersRes.json();
      const analyticsData = await analyticsRes.json();

      // Update stats
      document.getElementById("statProducts").textContent =
        productsData?.products?.length || 0;
      document.getElementById("statBanners").textContent =
        bannersData?.banners?.length || 0;

      document.getElementById("statVisits").textContent =
        analyticsData?.totalVisitors || 0;

      const mostSearched = analyticsData?.topSearched?.[0];
      document.getElementById("statMostSearched").textContent =
        mostSearched?.name || "-";
      document.getElementById("statMostSearchedCount").textContent = `(${
        mostSearched?.searches || 0
      } searches)`;

      // Render chart
      renderSearchChart(analyticsData?.topSearched || []);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  }

  // ---------------- Render Product Searches Chart ----------------
  function renderSearchChart(searchData) {
    if (!searchData || !searchData.length) return;

    searchData.forEach((item) => (item.searches = Number(item.searches)));
    const topItems = searchData.slice(0, 6);

    const labels = topItems.map((i) => i.name); // ✅ use 'name'
    const data = topItems.map((i) => i.searches);

    const canvas =
      document.getElementById("searchChart") ||
      (() => {
        const c = document.createElement("canvas");
        c.id = "searchChart";
        c.height = window.innerWidth <= 600 ? 300 : 200;
        document.getElementById("searchChartContainer").appendChild(c);
        return c;
      })();

    const ctx = canvas.getContext("2d");

    if (window.searchChartInstance) {
      window.searchChartInstance.data.labels = labels;
      window.searchChartInstance.data.datasets[0].data = data;
      window.searchChartInstance.update();
    } else {
      window.searchChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Searches",
              data,
              backgroundColor: [
                "#1a9fff",
                "#ff7f50",
                "#32cd32",
                "#ffa500",
                "#ff69b4",
                "#6a4c93",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: "Most Searched Products" },
          },
          scales: {
            x: { ticks: { autoSkip: false } },
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      });
    }
  }

  // ---------------- Logout ----------------
  function handleLogout() {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin-login.html";
  }

  // ---------------- Initial Load & Hash Change ----------------
  router();
  window.addEventListener("hashchange", router);
}
