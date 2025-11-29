import { BASE_URL } from "./config.js";
import { showLoader, hideLoader } from "./loader.js";

async function fetchTraining() {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/training`);
    const data = await res.json();

    const gallery = document.getElementById("training-gallery");
    gallery.innerHTML = "";

    if (!data.training || !data.training.length) {
      gallery.innerHTML = `<p class="text-center">No training sessions available at the moment.</p>`;
      return;
    }

    data.training.forEach((item) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4 mb-3";

      // ----- Build Images -----
      const imagesHtml = item.images?.length
        ? item.images
            .map(
              (img) => `
          <div class="training-media-wrapper">
            <img src="${img}" alt="${item.title}" />
          </div>`
            )
            .join("")
        : "";

      // ----- Build Video -----
      const videoHtml = item.video
        ? `
        <div class="training-media-wrapper">
          <video src="${item.video}" controls></video>
        </div>`
        : "";

      // ----- WhatsApp Message -----
      const message = `Hello Freedom Sounds & Events Mgt, I'm interested in: ${item.title} Course`;
      const whatsappLink = `https://wa.me/256756485168?text=${encodeURIComponent(
        message
      )}`;

      // ----- Card -----
      col.innerHTML = `
        <div class="card h-100 shadow-sm p-3 training-card">
          <h5 class="fw-bold">${item.title}</h5>
          <p>${item.description}</p>

          <p class="small text-muted mb-1">
            ${item.duration} of Hands-on Coaching & Mentoring
          </p>

          <p class="price mb-2">
            Full Course @ <strong>UGX ${Number(item.price).toLocaleString(
              "en-UG"
            )}</strong>
          </p>

          ${imagesHtml}
          ${videoHtml}

          <div class="d-flex gap-2 mt-auto">
            <a href="tel:+256756485168" class="btn btn-primary flex-grow-1">Call</a>
            <a href="${whatsappLink}" class="btn btn-success flex-grow-1">WhatsApp</a>
          </div>
        </div>
      `;

      gallery.appendChild(col);
    });
  } catch (err) {
    console.error("Failed to fetch training:", err);
  } finally {
    hideLoader();
  }
}

fetchTraining();
