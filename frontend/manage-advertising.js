import { BASE_URL } from "./config.js";
import { Session } from "./session.js";
import { showLoader, hideLoader } from "./loader.js";

let selectedFiles = [];
let previewGrid;

export function loadAdvertising() {
  const content = document.querySelector(".content");

  content.innerHTML = `
<section class="page">
  <div class="welcome-card">
    <h1>Manage Advertising / Drives</h1>
    <p>Add, edit, or delete advertising campaigns or promotional drives.</p>
  </div>

  <div class="form-container">
    <h2>Add / Edit Campaign</h2>

    <form id="advertising-form">
      <input type="hidden" id="advertising-id" />

      <!-- Basic Info -->
      <h3 class="form-section-title">Basic Information</h3>
      <input type="text" id="advertising-title" placeholder="Campaign Title" required />
      <textarea id="advertising-description" placeholder="Description"></textarea>

      <!-- Type -->
      <h3 class="form-section-title">Type</h3>
      <select id="advertising-type" required>
        <option value="">Select Type</option>
        <option value="Drive">Drive</option>
      </select>

      <!-- Dates -->
      <h3 class="form-section-title">Campaign Dates</h3>
      <input type="date" id="advertising-start" placeholder="Start Date" />
      <input type="date" id="advertising-end" placeholder="End Date" />

      <!-- Media -->
      <h3 class="form-section-title">Images / Video</h3>
      <div id="advertising-media-upload" class="gallery-upload-box">
        <span>+ Add Images or Video (click or drag & drop)</span>
        <input type="file" id="advertising-media" accept="image/*,video/*" multiple hidden />
      </div>

      <div id="advertising-media-preview" class="gallery-grid"></div>

      <button type="submit" class="btn-primary">Save Campaign</button>
    </form>
  </div>

  <div id="advertising-gallery" class="gallery-grid"></div>
</section>
`;

  const form = document.getElementById("advertising-form");
  const mediaInput = document.getElementById("advertising-media");
  const uploadBox = document.getElementById("advertising-media-upload");
  previewGrid = document.getElementById("advertising-media-preview");

  form.addEventListener("submit", handleAdvertisingFormSubmit);

  uploadBox.onclick = () => mediaInput.click();
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
  mediaInput.onchange = () => handleSelectedFiles(mediaInput.files);

  function handleSelectedFiles(files) {
    [...files].forEach((file) => {
      selectedFiles.push(file);

      const item = document.createElement("div");
      item.className = "gallery-item";
      item.innerHTML = `
        ${
          file.type.startsWith("image/")
            ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}" />`
            : `<video src="${URL.createObjectURL(file)}" controls></video>`
        }
        <button class="delete-btn">✕</button>
      `;

      item.querySelector(".delete-btn").onclick = () => {
        selectedFiles = selectedFiles.filter((f) => f !== file);
        item.remove();
      };

      previewGrid.appendChild(item);
    });
  }

  fetchAdvertising();
}

// ---------- Fetch campaigns ----------
async function fetchAdvertising() {
  const gallery = document.getElementById("advertising-gallery");
  gallery.innerHTML = "";
  showLoader();

  try {
    const res = await fetch(`${BASE_URL}/advertising`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const data = await res.json();

    data.advertising.forEach((ad) => {
      const item = document.createElement("div");
      item.className = "gallery-item";

      const media = [];
      if (ad.images?.length)
        ad.images.forEach((img) =>
          media.push(`<img src="${img}" class="img-fluid mb-2"/>`)
        );
      if (ad.video)
        media.push(
          `<video src="${ad.video}" controls class="w-100 mb-2"></video>`
        );

      item.innerHTML = `
        <div class="banner-card">
          ${media.join("")}
          <div class="banner-card-content">
            <h4>${ad.title}</h4>
            <p>${ad.description}</p>
            <p>Type: ${ad.type || "N/A"}</p>
            <p>
              Start: ${
                ad.start_date
                  ? new Date(ad.start_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"
              }, 
              End: ${
                ad.end_date
                  ? new Date(ad.end_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"
              }
            </p>

            <div class="banner-card-actions">
              <button class="edit-btn" data-id="${ad.id}">Edit</button>
              <button class="delete-btn" data-id="${ad.id}">Delete</button>
            </div>
          </div>
        </div>
      `;

      item.querySelector(".edit-btn").onclick = () => editAdvertising(ad.id);
      item.querySelector(".delete-btn").onclick = () =>
        deleteAdvertising(ad.id);

      gallery.appendChild(item);
    });
  } catch (err) {
    hideLoader();
    await Swal.fire("Error", err.message, "error");
  } finally {
    hideLoader();
  }
}

// ---------- Handle form submit ----------
async function handleAdvertisingFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("advertising-id").value;
  const title = document.getElementById("advertising-title").value;
  const description = document.getElementById("advertising-description").value;
  const type = document.getElementById("advertising-type").value;
  const start = document.getElementById("advertising-start").value;
  const end = document.getElementById("advertising-end").value;

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("type", type);
  formData.append("start_date", start);
  formData.append("end_date", end);

  selectedFiles.forEach((file) => formData.append("files", file));

  showLoader();
  try {
    const url = id
      ? `${BASE_URL}/advertising/${id}`
      : `${BASE_URL}/advertising`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${Session.token()}` },
      body: formData,
    });

    const result = await res.json();
    hideLoader();

    await Swal.fire("Success", "Campaign saved!", "success");

    fetchAdvertising();
    e.target.reset();
    previewGrid.innerHTML = "";
    selectedFiles = [];
  } catch (err) {
    hideLoader();
    await Swal.fire("Error", err.message, "error");
  }
}

// ---------- Edit campaign ----------
async function editAdvertising(id) {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/advertising/${id}`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const { advertising } = await res.json();

    document.getElementById("advertising-id").value = advertising.id;
    document.getElementById("advertising-title").value = advertising.title;
    document.getElementById("advertising-description").value =
      advertising.description;
    document.getElementById("advertising-type").value = advertising.type || "";
    document.getElementById("advertising-start").value =
      advertising.start_date || "";
    document.getElementById("advertising-end").value =
      advertising.end_date || "";

    // Preview existing media
    previewGrid.innerHTML = "";
    selectedFiles = [];
    if (advertising.images?.length) {
      advertising.images.forEach((img) => {
        const div = document.createElement("div");
        div.className = "gallery-item";
        div.innerHTML = `<img src="${img}" class="img-fluid"/><button class="delete-btn">✕</button>`;
        div.querySelector(".delete-btn").onclick = () => div.remove();
        previewGrid.appendChild(div);
      });
    }
    if (advertising.video) {
      const div = document.createElement("div");
      div.className = "gallery-item";
      div.innerHTML = `<video src="${advertising.video}" controls class="w-100"/><button class="delete-btn">✕</button>`;
      div.querySelector(".delete-btn").onclick = () => div.remove();
      previewGrid.appendChild(div);
    }
  } catch (err) {
    hideLoader();
    await Swal.fire("Error", err.message, "error");
  } finally {
    hideLoader();
  }
}

// ---------- Delete campaign ----------
async function deleteAdvertising(id) {
  const confirmResult = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the campaign!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  });

  if (!confirmResult.isConfirmed) return;

  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/advertising/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const result = await res.json();
    hideLoader();
    await Swal.fire("Deleted!", "Campaign deleted!", "success");
    fetchAdvertising();
  } catch (err) {
    hideLoader();
    await Swal.fire("Error", err.message, "error");
  }
}
