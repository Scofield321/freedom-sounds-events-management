import { BASE_URL } from "./config.js";
import { showLoader, hideLoader } from "./loader.js";

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");
const productContainer = document.getElementById("productContainer");
const relatedContainer = document.getElementById("relatedProducts");

// UPDATE THIS to your admin/seller phone number
const SHOP_PHONE = "+256756485168";

async function loadProductDetails() {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/products/${productId}`);
    const data = await res.json();

    if (!data.success) {
      productContainer.innerHTML = "<p>Product not found.</p>";
      return;
    }

    const product = data.product;
    const mainImg = product.images?.[0] || "placeholder.jpg";

    // Construct WhatsApp message including product name & image
    const waMessage = `Hi Freedom Sounds & Events Mgt, I'm interested in ${product.name}`;
    const waLink = `https://wa.me/${SHOP_PHONE.replace(
      /\+/g,
      ""
    )}?text=${encodeURIComponent(waMessage)}`;

    productContainer.innerHTML = `
      <div class="product-wrapper">

        <div class="product-gallery">
          <div class="main-image-wrapper">
            <img src="${mainImg}" id="mainImage" class="main-image" />
          </div>

          <div class="thumbnail-row">
            ${product.images
              .map(
                (img, idx) =>
                  `<img src="${img}" class="thumbnail ${
                    idx === 0 ? "active" : ""
                  }" />`
              )
              .join("")}
          </div>
        </div>

        <div class="product-info">
          <h1 class="product-title">${product.name}</h1>
          <p class="product-price">UGX ${Number(
            product.price
          ).toLocaleString()}</p>
          <p class="product-description">${product.description}</p>

          <div class="meta-box">
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Stock:</strong> ${product.stock}</p>
          </div>

          <div class="contact-buttons">
            <a href="${waLink}" class="btn-contact-seller" target="_blank">
              Whatsapp Us
            </a>

            <a href="tel:${SHOP_PHONE}" class="btn call-btn">📞 Call Us</a>
          </div>
        </div>

      </div>
    `;

    // Thumbnail switching
    const mainImage = document.getElementById("mainImage");
    const thumbs = document.querySelectorAll(".thumbnail");

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        mainImage.src = thumb.src;
        thumbs.forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
    });

    if (product.category) {
      loadRelatedProducts(product.category);
    }
  } catch (err) {
    console.error(err);
    productContainer.innerHTML = "<p>Error loading product.</p>";
  } finally {
    hideLoader();
  }
}

async function loadRelatedProducts(category) {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/products/category/${category}`);
    const data = await res.json();

    if (!data.products) return;

    relatedContainer.innerHTML = `
      <h2 class="related-title">Related Products</h2>
      <div class="related-grid">
        ${data.products
          .filter((p) => p.id !== productId)
          .map(
            (p) => `
          <a href="product.html?id=${p.id}" class="related-card">
            <img src="${p.images[0]}" />
            <p>${p.name}</p>
            <p class="product-price">UGX ${Number(p.price).toLocaleString()}</p>
          </a>
        `
          )
          .join("")}
      </div>
    `;
  } catch (e) {
    console.error("Related error:", e);
  } finally {
    hideLoader();
  }
}

loadProductDetails();
