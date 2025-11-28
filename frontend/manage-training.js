import { BASE_URL } from "./config.js";
import { Session } from "./session.js";
import { showLoader, hideLoader } from "./loader.js";

let selectedFiles = [];

export function loadTraining() {
  const content = document.querySelector(".content");
  if (!content) return console.error("No .content element found");

  content.innerHTML = `
<section class="page">
  <div class="welcome-card">
    <h1>Manage Training Programs</h1>
    <p>Add, edit, or delete training sessions and courses.</p>
  </div>

  <div class="form-container">
    <h2>Add / Edit Training</h2>
    <form id="training-form">
      <input type="hidden" id="training-id" />

      <h3 class="form-section-title">Basic Info</h3>
      <input type="text" id="training-title" placeholder="Training Title" required />
      <textarea id="training-description" placeholder="Training Description" required></textarea>

      <h3 class="form-section-title">Pricing & Details</h3>
      <input type="number" id="training-price" placeholder="Price (UGX)" />
      <input type="text" id="training-duration" placeholder="Duration" />
      <input type="text" id="training-level" placeholder="Level" />

      <h3 class="form-section-title">Media</h3>
      <div id="training-image-upload" class="gallery-upload-box">
        <span>+ Add Images (click or drag & drop)</span>
        <input type="file" id="training-images" accept="image/*" multiple hidden />
      </div>
      <div id="training-images-preview" class="gallery-grid"></div>

      <label>Video (Optional)</label>
      <input type="file" id="training-video" accept="video/*" />

      <button type="submit" class="btn-primary">Save Training</button>
    </form>
  </div>

  <h3>Training Gallery</h3>
  <div id="training-gallery" class="gallery-grid"></div>
</section>
`;

  const form = document.getElementById("training-form");
  const imageInput = document.getElementById("training-images");
  const uploadBox = document.getElementById("training-image-upload");
  const previewGrid = document.getElementById("training-images-preview");

  form.addEventListener("submit", handleTrainingFormSubmit);

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

  fetchTraining();
}

// ---------------- Fetch Training ----------------
async function fetchTraining() {
  const gallery = document.getElementById("training-gallery");
  if (!gallery) return console.error("No #training-gallery found");

  gallery.innerHTML = "";

  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/training`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const data = await res.json();

    (data.training || []).forEach((item) => {
      const card = document.createElement("div");
      card.className = "gallery-item";

      const imgSrc = item.images?.[0] || "https://placehold.co/150";
      card.innerHTML = `
        <div class="banner-card">
          <img src="${imgSrc}" alt="${item.title}" />
          <div class="banner-card-content">
            <h4>${item.title}</h4>
            <p>${item.description}</p>
            <p>
              UGX ${
                item.price
                  ? Number(parseFloat(item.price)).toLocaleString("en-UG")
                  : "-"
              }
            </p>

            ${
              item.video
                ? `<video src="${item.video}" controls style="max-width:100%;margin-top:5px;"></video>`
                : ""
            }
            <div class="banner-card-actions">
              <button class="edit-btn" data-id="${item.id}">Edit</button>
              <button class="delete-btn" data-id="${item.id}">Delete</button>
            </div>
          </div>
        </div>
      `;

      card.querySelector(".edit-btn").onclick = () => editTraining(item.id);
      card.querySelector(".delete-btn").onclick = () => deleteTraining(item.id);

      gallery.appendChild(card);
    });
  } catch (err) {
    hideLoader(); // ensure loader hides BEFORE Swal
    await Swal.fire("Error", err.message, "error");
    return;
  }

  hideLoader();
}

// ---------------- Handle Form Submit ----------------
async function handleTrainingFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("training-id").value;
  const title = document.getElementById("training-title").value;
  const description = document.getElementById("training-description").value;

  // PRICE FIX — no decimals
  const rawPrice = document.getElementById("training-price").value;
  const price = parseInt(rawPrice) || 0;

  const duration = document.getElementById("training-duration").value;
  const level = document.getElementById("training-level").value;
  const videoFile = document.getElementById("training-video").files[0];

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("price", price); // fixed
  formData.append("duration", duration || "");
  formData.append("level", level || "");

  selectedFiles.forEach((file) => formData.append("images", file));
  if (videoFile) formData.append("video", videoFile);

  showLoader();
  try {
    const url = id ? `${BASE_URL}/training/${id}` : `${BASE_URL}/training`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${Session.token()}` },
      body: formData,
    });

    const result = await res.json();

    hideLoader(); // FIX: hide loader BEFORE Swal
    await Swal.fire("Success", result.message || "Training saved!", "success");

    fetchTraining();
    e.target.reset();
    document.getElementById("training-images-preview").innerHTML = "";
    selectedFiles = [];
  } catch (err) {
    hideLoader(); // FIX: ensure loader removed
    await Swal.fire("Error", err.message, "error");
  }
}

// ---------------- Edit Training ----------------
async function editTraining(id) {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/training/${id}`, {
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const { training } = await res.json();

    document.getElementById("training-id").value = training.id;
    document.getElementById("training-title").value = training.title;
    document.getElementById("training-description").value =
      training.description;

    // PRICE FIX
    document.getElementById("training-price").value = parseInt(
      training.price || 0
    );

    document.getElementById("training-duration").value =
      training.duration || "";
    document.getElementById("training-level").value = training.level || "";
  } catch (err) {
    hideLoader();
    await Swal.fire("Error", err.message, "error");
    return;
  }

  hideLoader();
}

// ---------------- Delete Training ----------------
async function deleteTraining(id) {
  const confirmResult = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the training!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  });

  if (!confirmResult.isConfirmed) return;

  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/training/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${Session.token()}` },
    });
    const result = await res.json();

    hideLoader(); // FIX before swal
    await Swal.fire("Deleted!", result.msg || "Training deleted!", "success");

    fetchTraining();
  } catch (err) {
    hideLoader(); // FIX
    await Swal.fire("Error", err.message, "error");
  }
}
