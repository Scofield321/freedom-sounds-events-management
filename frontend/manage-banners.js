// manage-banners.js
import { BASE_URL } from "./config.js";
import { Session } from "./session.js";
import { showLoader, hideLoader } from "./loader.js";

export function loadBanners() {
  const main = document.getElementById("main-content");

  main.innerHTML = `
<section class="page">
  <div class="welcome-card">
    <h1>Manage Banners</h1>
    <p>Create and update homepage banners.</p>
  </div>

  <div class="form-container">
    <h2>Add / Edit Banner</h2>

    <form id="banner-form">
      <input type="hidden" id="banner-id" />

      <h3 class="form-section-title">Banner Information</h3>
      <input type="text" id="banner-title" placeholder="Banner Title" />
      <textarea id="banner-description" placeholder="Banner Description"></textarea>
      <input type="text" id="banner-link" placeholder="Link (Optional)" />

      <h3 class="form-section-title">Status</h3>
      <select id="banner-status">
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>

      <h3 class="form-section-title">Display Order</h3>
      <input type="number" id="banner-order" placeholder="Display Order" />

      <h3 class="form-section-title">Banner Images</h3>
      <div id="banner-upload-box" class="gallery-upload-box">
        <span>+ Add Images (click or drag & drop)</span>
        <input type="file" id="banner-images" accept="image/*" multiple hidden />
      </div>

      <div id="banner-preview" class="gallery-grid"></div>

      <button type="submit" class="btn-primary">Save Banner</button>
    </form>
  </div>

  <div id="banners-gallery" class="gallery-grid"></div>
</section>
`;

  setupBannerLogic();
}

function setupBannerLogic() {
  const form = document.getElementById("banner-form");
  const uploadBox = document.getElementById("banner-upload-box");
  const input = document.getElementById("banner-images");
  const preview = document.getElementById("banner-preview");

  let selectedFiles = [];

  uploadBox.onclick = () => input.click();
  uploadBox.ondragover = (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "#1a9fff";
  };
  uploadBox.ondragleave = () => (uploadBox.style.borderColor = "#ccc");
  uploadBox.ondrop = (e) => {
    e.preventDefault();
    handleImages(e.dataTransfer.files);
    uploadBox.style.borderColor = "#ccc";
  };
  input.onchange = () => handleImages(input.files);

  function handleImages(files) {
    [...files].forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      selectedFiles.push(file);

      const item = document.createElement("div");
      item.className = "gallery-item";
      item.innerHTML = `
        <img src="${URL.createObjectURL(file)}" />
        <button class="delete-btn">✕</button>
      `;

      item.querySelector(".delete-btn").onclick = () => {
        selectedFiles = selectedFiles.filter((f) => f !== file);
        item.remove();
      };

      preview.appendChild(item);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData();
    const id = document.getElementById("banner-id").value;

    fd.append("id", id);
    fd.append("title", document.getElementById("banner-title").value);
    fd.append(
      "description",
      document.getElementById("banner-description").value
    );
    fd.append("link", document.getElementById("banner-link").value);
    fd.append("is_active", document.getElementById("banner-status").value);
    fd.append("display_order", document.getElementById("banner-order").value);

    selectedFiles.forEach((file) => fd.append("banners", file));

    const method = id ? "PUT" : "POST";
    const url = id ? `${BASE_URL}/banners/${id}` : `${BASE_URL}/banners`;

    showLoader();
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${Session.token()}` },
        body: fd,
      });
      const result = await res.json();

      hideLoader(); // hide before showing Swal
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: result.message || "Banner saved!",
      });

      loadBanners();
    } catch (err) {
      hideLoader(); // ensure loader hides on error
      await Swal.fire("Error", err.message, "error");
    }
  });

  fetchBanners();
}

async function fetchBanners() {
  const gallery = document.getElementById("banners-gallery");
  gallery.innerHTML = "";
  showLoader();

  try {
    const res = await fetch(`${BASE_URL}/banners`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const data = await res.json();

    data.banners.forEach((banner) => {
      const item = document.createElement("div");
      item.className = "gallery-item";

      const img = banner.images?.[0] || "https://placehold.co/150";

      item.innerHTML = `
      <div class="banner-card">
        <img src="${img}" />
        <div class="banner-card-content">
          <h4>${banner.title}</h4>
          <p>${banner.description}</p>

          <div class="banner-card-actions">
            <button class="edit-btn" data-id="${banner.id}">Edit</button>
            <button class="delete-btn" data-id="${banner.id}">Delete</button>
          </div>
        </div>
      </div>
    `;

      item.querySelector(".edit-btn").onclick = () => editBanner(banner.id);
      item.querySelector(".delete-btn").onclick = () => deleteBanner(banner.id);

      gallery.appendChild(item);
    });
  } catch (err) {
    hideLoader(); // hide loader if error occurs
    await Swal.fire("Error", err.message, "error");
  } finally {
    hideLoader();
  }
}

async function editBanner(id) {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/banners/${id}`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const { banner } = await res.json();

    document.getElementById("banner-id").value = banner.id;
    document.getElementById("banner-title").value = banner.title;
    document.getElementById("banner-description").value =
      banner.description || "";
    document.getElementById("banner-link").value = banner.link || "";
    document.getElementById("banner-status").value = banner.is_active;
    document.getElementById("banner-order").value = banner.display_order;
  } catch (err) {
    hideLoader();
    await Swal.fire("Error", err.message, "error");
  } finally {
    hideLoader();
  }
}

async function deleteBanner(id) {
  const confirmResult = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the banner!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  });

  if (!confirmResult.isConfirmed) return;

  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/banners/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const result = await res.json();

    hideLoader(); // hide before showing Swal
    await Swal.fire("Deleted!", result.message || "Banner deleted!", "success");
    loadBanners();
  } catch (err) {
    hideLoader(); // hide loader on error
    await Swal.fire("Error", err.message, "error");
  }
}
