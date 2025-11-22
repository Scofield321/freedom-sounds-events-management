import { BASE_URL } from "./config.js";

const productsContainer = document.getElementById("productsContainer");
const searchInput = document.getElementById("searchInput");
const loader = document.getElementById("loader");

let allProducts = []; // Stores all products

// -----------------------------
// HELPER: truncate description
// -----------------------------
function truncateText(text, wordLimit = 20) {
  if (!text) return "";
  const words = text.split(" ");
  return words.length > wordLimit
    ? words.slice(0, wordLimit).join(" ") + "..."
    : text;
}

// -----------------------------
// SHOW / HIDE LOADER
// -----------------------------
function showLoader() {
  loader.style.display = "block";
}

function hideLoader() {
  loader.style.display = "none";
}

// -----------------------------
// RENDER PRODUCTS
// -----------------------------
function renderProducts(list) {
  if (!list.length) {
    productsContainer.innerHTML = "<p>No matching products found.</p>";
    return;
  }

  productsContainer.innerHTML = "";

  list.forEach((product) => {
    const productItem = document.createElement("div");
    productItem.classList.add("product-card");

    productItem.innerHTML = `
        <a href="product.html?id=${product.id}" class="product-link">
          <div class="product-img-wrapper">
            <img src="${product.images[0]}" alt="${product.name}" />
          </div>

          <div class="product-info">
            <h4>${product.name}</h4>
            <p class="price">UGX ${Number(product.price).toLocaleString()}</p>
            <p class="description">${truncateText(product.description, 20)}</p>
          </div>
        </a>
      `;

    productsContainer.appendChild(productItem);
  });
}

// -----------------------------
// LOAD PRODUCTS
// -----------------------------
async function loadProducts() {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/products`);
    const data = await res.json();

    if (data.success && data.products.length) {
      allProducts = data.products;
      renderProducts(allProducts);
    } else {
      productsContainer.innerHTML = "<p>No products available.</p>";
    }
  } catch (err) {
    console.error("Error loading products:", err);
    productsContainer.innerHTML = "<p>Failed to load products.</p>";
  } finally {
    hideLoader();
  }
}

// -----------------------------
// SEARCH PRODUCTS
// -----------------------------
async function handleSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    renderProducts(allProducts);
    return;
  }

  showLoader();
  try {
    const res = await fetch(
      `${BASE_URL}/products/search?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    if (data.success && data.products.length) {
      renderProducts(data.products);
    } else {
      productsContainer.innerHTML = "<p>No matching products found.</p>";
    }
  } catch (err) {
    console.error("Error searching products:", err);
    productsContainer.innerHTML = "<p>Search failed.</p>";
  } finally {
    hideLoader();
  }
}

// -----------------------------
// LOG REAL SEARCHES (only on Enter)
// -----------------------------
async function logSearch(query) {
  if (!query || query.length < 3) return; // Avoid junk logs

  try {
    await fetch(`${BASE_URL}/search-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
  } catch (err) {
    console.error("Failed to log search:", err);
  }
}

// User typing filters products (real-time search)
searchInput.addEventListener("input", handleSearch);

// User presses Enter → log the search term
searchInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    await logSearch(searchInput.value.trim());
  }
});

// -----------------------------
// LOAD BANNERS
// -----------------------------
async function loadBanners() {
  const container = document.getElementById("carouselContainer");
  container.innerHTML = "";
  showLoader();

  try {
    const res = await fetch(`${BASE_URL}/banners`);
    const data = await res.json();

    if (data.banners && data.banners.length) {
      data.banners.forEach((b, index) => {
        container.innerHTML += `
          <div class="carousel-item ${index === 0 ? "active" : ""}">
            <img src="${b.images[0]}" class="d-block w-100" />
          </div>
        `;
      });
    }
  } catch (err) {
    console.error("Error loading banners:", err);
  } finally {
    hideLoader();
  }
}

// -----------------------------
// INIT
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadBanners();
});
