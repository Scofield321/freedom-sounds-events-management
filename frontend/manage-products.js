import { BASE_URL } from "./config.js";
import { Session } from "./session.js";
import { showLoader, hideLoader } from "./loader.js";

export function loadProducts() {
  const content = document.querySelector(".content");

  content.innerHTML = `
<section class="page">
  <div class="welcome-card">
    <h1>Manage Products</h1>
    <p>Add, edit, or delete musical instruments and related equipment.</p>
  </div>

  <div class="form-container">
    <h2>Add / Edit Product</h2>

    <form id="product-form">
      <input type="hidden" id="product-id" />

      <!-- Basic Info -->
      <h3 class="form-section-title">Basic Information</h3>
      <input type="text" id="product-name" placeholder="Product Name" required />
      <textarea id="product-description" placeholder="Product Description"></textarea>

      <!-- Categories -->
      <h3 class="form-section-title">Category</h3>
      <select id="product-category" required>
        <option value="">Select Category</option>
        <option value="guitars">Guitars & Basses</option>
        <option value="keyboards">Keyboards & Pianos</option>
        <option value="drums">Drums & Percussion</option>
        <option value="wind">Wind Instruments</option>
        <option value="string">Orchestral String Instruments</option>
        <option value="studio">Studio & Recording Equipment</option>
        <option value="dj">DJ Equipment</option>
        <option value="amplifiers">Amps & Speakers</option>
        <option value="accessories">Accessories</option>
      </select>

      <input type="text" id="product-subcategory" placeholder="Subcategory (Optional)" />

      <!-- Pricing -->
      <h3 class="form-section-title">Pricing</h3>
      <input type="number" id="product-price" placeholder="Price" required />
      <input type="number" id="product-discount-price" placeholder="Discounted Price (Optional)" />

      <!-- Inventory -->
      <h3 class="form-section-title">Inventory</h3>
      <input type="number" id="product-stock" placeholder="Stock Quantity" required />
      <input type="text" id="product-brand" placeholder="Brand (Optional)" />

      <!-- Status -->
      <h3 class="form-section-title">Status</h3>
      <select id="product-status">
        <option value="active">Active</option>
        <option value="hidden">Hidden</option>
      </select>

      <!-- Images -->
      <h3 class="form-section-title">Product Images</h3>
      <div id="product-image-upload" class="gallery-upload-box">
        <span>+ Add Images (click or drag & drop)</span>
        <input type="file" id="product-images" accept="image/*" multiple hidden />
      </div>

      <div id="product-images-preview" class="gallery-grid"></div>

      <button type="submit" class="btn-primary">Save Product</button>
    </form>
  </div>

  <div id="products-gallery" class="gallery-grid"></div>
</section>
`;

  const form = document.getElementById("product-form");
  const imageInput = document.getElementById("product-images");
  const uploadBox = document.getElementById("product-image-upload");
  const previewGrid = document.getElementById("product-images-preview");

  let selectedFiles = [];

  form.addEventListener("submit", handleProductFormSubmit);

  uploadBox.onclick = () => imageInput.click();
  uploadBox.ondragover = (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "#1a9fff";
  };
  uploadBox.ondragleave = () => (uploadBox.style.borderColor = "#ccc");
  uploadBox.ondrop = (e) => {
    e.preventDefault();
    handleSelectedFiles(e.dataTransfer.files);
    uploadBox.style.borderColor = "#ccc";
  };
  imageInput.onchange = () => handleSelectedFiles(imageInput.files);

  function handleSelectedFiles(files) {
    [...files].forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      selectedFiles.push(file);

      const item = document.createElement("div");
      item.className = "gallery-item";
      item.innerHTML = `
        <img src="${URL.createObjectURL(file)}" alt="${file.name}" />
        <button class="delete-btn">✕</button>
      `;

      item.querySelector(".delete-btn").onclick = () => {
        selectedFiles = selectedFiles.filter((f) => f !== file);
        item.remove();
      };

      previewGrid.appendChild(item);
    });
  }

  fetchProducts();
}

// ---------- Fetch products ----------
async function fetchProducts() {
  const gallery = document.getElementById("products-gallery");
  gallery.innerHTML = "";
  showLoader();

  try {
    const res = await fetch(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const data = await res.json();

    data.products.forEach((product) => {
      const item = document.createElement("div");
      item.className = "gallery-item";

      const imgSrc = product.images?.[0] || "https://placehold.co/150";
      item.innerHTML = `
        <div class="banner-card">
          <img src="${imgSrc}" alt="${product.name}" />
          <div class="banner-card-content">
            <h4>${product.name}</h4>
            <p>UGX ${Number(product.price).toLocaleString()}</p>
            <p>${product.description}</p>
            <div class="banner-card-actions">
              <button class="edit-btn" data-id="${product.id}">Edit</button>
              <button class="delete-btn" data-id="${product.id}">Delete</button>
            </div>
          </div>
        </div>
      `;

      item.querySelector(".edit-btn").onclick = () => editProduct(product.id);
      item.querySelector(".delete-btn").onclick = () =>
        deleteProduct(product.id);

      gallery.appendChild(item);
    });
  } catch (err) {
    hideLoader(); // hide spinner before showing Swal
    await Swal.fire("Error", err.message, "error");
  } finally {
    hideLoader();
  }
}

// ---------- Handle form submit ----------
async function handleProductFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("product-id").value;

  // Collect ALL fields
  const name = document.getElementById("product-name").value;
  const description = document.getElementById("product-description").value;
  const price = document.getElementById("product-price").value;
  const discountPrice = document.getElementById("product-discount-price").value;
  const category = document.getElementById("product-category").value;
  const subcategory = document.getElementById("product-subcategory").value;
  const stock = document.getElementById("product-stock").value;
  const brand = document.getElementById("product-brand").value;
  const status = document.getElementById("product-status").value;

  const imageInput = document.getElementById("product-images");

  const formData = new FormData();

  // Append all fields to FormData
  formData.append("name", name);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("discountPrice", discountPrice);
  formData.append("category", category);
  formData.append("subcategory", subcategory);
  formData.append("stock", stock); // ✅ FIXED — now sent to backend
  formData.append("brand", brand);
  formData.append("status", status);

  // Images (support multiple)
  if (imageInput.files.length > 0) {
    [...imageInput.files].forEach((file) => {
      formData.append("images", file);
    });
  }

  showLoader();

  try {
    const url = id ? `${BASE_URL}/products/${id}` : `${BASE_URL}/products`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${Session.token()}` },
      body: formData,
    });

    const result = await res.json();

    hideLoader();

    await Swal.fire({
      icon: "success",
      title: "Success",
      text: result.message || "Product saved!",
    });

    fetchProducts();
    e.target.reset();
    document.getElementById("product-images-preview").innerHTML = "";
  } catch (err) {
    hideLoader();
    await Swal.fire("Error", err.message, "error");
  }
}

// ---------- Edit product ----------
async function editProduct(id) {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const { product } = await res.json();

    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-description").value = product.description;
    document.getElementById("product-category").value = product.category || "";
    document.getElementById("product-subcategory").value =
      product.subcategory || "";

    // 🔹 Format as whole UGX amount (no .00)
    document.getElementById("product-price").value =
      product.price != null ? Number(product.price).toFixed(0) : "";

    document.getElementById("product-discount-price").value =
      product.discountPrice != null
        ? Number(product.discountPrice).toFixed(0)
        : "";

    document.getElementById("product-stock").value = product.stock;
    document.getElementById("product-brand").value = product.brand || "";
    document.getElementById("product-status").value =
      product.status || "active";
  } catch (err) {
    hideLoader();
    await Swal.fire("Error", err.message, "error");
  } finally {
    hideLoader();
  }
}

// ---------- Delete product ----------
async function deleteProduct(id) {
  const confirmResult = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the product!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  });

  if (!confirmResult.isConfirmed) return;

  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const result = await res.json();

    hideLoader(); // hide spinner before Swal
    await Swal.fire(
      "Deleted!",
      result.message || "Product deleted!",
      "success"
    );

    fetchProducts();
  } catch (err) {
    hideLoader();
    await Swal.fire("Error", err.message, "error");
  }
}
