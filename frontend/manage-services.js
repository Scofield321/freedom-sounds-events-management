import { BASE_URL } from "./config.js";
import { Session } from "./session.js";
import { showLoader, hideLoader } from "./loader.js";

let selectedImages = [];

export function loadServices() {
  const content = document.querySelector(".content");

  content.innerHTML = `
<section class="page">
  <div class="welcome-card">
    <h1>Manage Sound Engineering Services</h1>
    <p>Add images or videos showcasing past events, concerts, campaigns, etc.</p>
  </div>

  <div class="form-container">
    <h2>Add / Edit Event</h2>

    <form id="service-form">
      <input type="hidden" id="service-id" />

      <!-- Basic Info -->
      <h3 class="form-section-title">Event Details</h3>
      <input type="text" id="service-title" placeholder="Event Title" required />
      <textarea id="service-description" placeholder="Event Description"></textarea>

      <!-- Upload Section -->
      <h3 class="form-section-title">Media Upload</h3>

      <div id="service-image-upload" class="gallery-upload-box">
        <span>+ Add Images (click or drag & drop)</span>
        <input type="file" id="service-images" accept="image/*" multiple hidden />
      </div>

      <div id="service-images-preview" class="gallery-grid"></div>

      <h4>Optional Video Upload</h4>
      <input type="file" id="service-video" accept="video/*" />

      <button type="submit" class="btn-primary">Save Event</button>
    </form>
  </div>

  <h2>Uploaded Events</h2>
  <div id="services-gallery" class="gallery-grid"></div>
</section>
`;

  const form = document.getElementById("service-form");
  const imageInput = document.getElementById("service-images");
  const uploadBox = document.getElementById("service-image-upload");
  const previewGrid = document.getElementById("service-images-preview");

  form.addEventListener("submit", handleServiceSubmit);

  // --- Upload UI Events ---
  uploadBox.onclick = () => imageInput.click();
  uploadBox.ondragover = (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "#1a9fff";
  };
  uploadBox.ondragleave = () => (uploadBox.style.borderColor = "#ccc");
  uploadBox.ondrop = (e) => {
    e.preventDefault();
    handleSelectedImages(e.dataTransfer.files);
    uploadBox.style.borderColor = "#ccc";
  };

  imageInput.onchange = () => handleSelectedImages(imageInput.files);

  function handleSelectedImages(files) {
    [...files].forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      selectedImages.push(file);

      const item = document.createElement("div");
      item.className = "gallery-item";
      item.innerHTML = `
        <img src="${URL.createObjectURL(file)}" alt="${file.name}" />
        <button class="delete-btn">✕</button>
      `;

      item.querySelector(".delete-btn").onclick = () => {
        selectedImages = selectedImages.filter((f) => f !== file);
        item.remove();
      };

      previewGrid.appendChild(item);
    });
  }

  fetchServices();
}

// -------- Save / Edit Service ----------
async function handleServiceSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("service-id").value;
  const title = document.getElementById("service-title").value;
  const description = document.getElementById("service-description").value;
  const video = document.getElementById("service-video").files[0];

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  selectedImages.forEach((file) => formData.append("images", file));
  if (video) formData.append("video", video);

  showLoader();

  try {
    const url = id ? `${BASE_URL}/services/${id}` : `${BASE_URL}/services`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${Session.token()}` },
      body: formData,
    });

    const result = await res.json();

    hideLoader(); // hide loader before showing Swal
    await Swal.fire("Success", result.message || "Event saved!", "success");

    // reset form
    selectedImages = [];
    document.getElementById("service-images-preview").innerHTML = "";
    e.target.reset();

    fetchServices(); // will show its own loader
  } catch (err) {
    hideLoader(); // hide loader first
    Swal.fire("Error", err.message, "error");
  }
}

// -------- Edit Service ----------
async function editService(id) {
  showLoader();

  try {
    const res = await fetch(`${BASE_URL}/services/${id}`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });

    const { service } = await res.json();

    document.getElementById("service-id").value = service.id;
    document.getElementById("service-title").value = service.title;
    document.getElementById("service-description").value = service.description;

    hideLoader(); // hide loader before showing Swal
    await Swal.fire(
      "Loaded!",
      "You can now modify the event and save.",
      "info"
    );
  } catch (err) {
    hideLoader();
    Swal.fire("Error", err.message, "error");
  }
}

// -------- Delete Service ----------
async function deleteService(id) {
  const confirmResult = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the event!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
  });

  if (!confirmResult.isConfirmed) return;

  showLoader();

  try {
    const res = await fetch(`${BASE_URL}/services/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${Session.token()}` },
    });

    const data = await res.json();

    hideLoader(); // hide loader first
    await Swal.fire("Deleted!", data.message, "success");

    fetchServices(); // will show its own loader
  } catch (err) {
    hideLoader();
    Swal.fire("Error", err.message, "error");
  }
}

// -------- Fetch Services ----------
async function fetchServices() {
  const gallery = document.getElementById("services-gallery");
  gallery.innerHTML = "";
  showLoader();

  try {
    const res = await fetch(`${BASE_URL}/services`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });

    const data = await res.json();

    data.services.forEach((svc) => {
      const item = document.createElement("div");
      item.className = "gallery-item";

      const imgSrc =
        svc.images?.[0] || "https://placehold.co/300?text=No+Image";

      item.innerHTML = `
        <div class="banner-card">
          <img src="${imgSrc}" alt="${svc.title}" />
          <div class="banner-card-content">
            <h4>${svc.title}</h4>
            <p>${svc.description}</p>

            ${
              svc.video
                ? `<video src="${svc.video}" controls style="width:100%;margin-top:10px;border-radius:10px;"></video>`
                : ""
            }

            <div class="banner-card-actions">
              <button class="edit-btn" data-id="${svc.id}">Edit</button>
              <button class="delete-btn" data-id="${svc.id}">Delete</button>
            </div>
          </div>
        </div>
      `;

      item.querySelector(".edit-btn").onclick = () => editService(svc.id);
      item.querySelector(".delete-btn").onclick = () => deleteService(svc.id);

      gallery.appendChild(item);
    });
  } catch (err) {
    hideLoader();
    Swal.fire("Error", err.message, "error");
  } finally {
    hideLoader();
  }
}
