import Chart from "https://cdn.jsdelivr.net/npm/chart.js";

export async function loadDashboardStats() {
  const main = document.getElementById("main-content");
  const dashboardPage = document.getElementById("dashboardPage");
  if (dashboardPage) dashboardPage.style.display = "block";

  try {
    const [productsRes, bannersRes, visitsRes, searchRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/banners"),
      fetch("/api/visits"), // {month: "Nov", total: 1200}
      fetch("/api/searches"), // [{product: "Guitar", count: 50}, ...]
    ]);

    const products = await productsRes.json();
    const banners = await bannersRes.json();
    const visits = await visitsRes.json();
    const searches = await searchRes.json();

    // Fill cards
    document.getElementById("statProducts").textContent = products?.length || 0;
    document.getElementById("statBanners").textContent = banners?.length || 0;
    document.getElementById("statVisits").textContent = visits.total || 0;

    if (searches.length > 0) {
      const topProduct = searches[0];
      document.getElementById("statMostSearched").textContent =
        topProduct.product;
      document.getElementById(
        "statMostSearchedCount"
      ).textContent = `${topProduct.count} searches`;
    }

    // Bar Chart
    const ctx = document.getElementById("searchChart").getContext("2d");
    const labels = searches.map((s) => s.product);
    const data = searches.map((s) => s.count);

    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Search Count",
            data,
            backgroundColor: "#1a9fff",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  } catch (err) {
    console.error("Failed to fetch dashboard stats:", err);
  }
}
