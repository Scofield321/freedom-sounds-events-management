import { BASE_URL } from "./config.js";
import { showLoader, hideLoader } from "./loader.js";

async function fetchServices() {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/services`);
    const data = await res.json();

    const gallery = document.getElementById("services-gallery");
    gallery.innerHTML = "";

    if (!data.services || !data.services.length) {
      gallery.innerHTML = `<p class="text-center">No services available at the moment.</p>`;
      return;
    }

    data.services.forEach((service) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4 mb-3";

      // ----- IMAGES -----
      const imagesHtml = service.images?.length
        ? service.images
            .map(
              (img) => `
          <div class="service-media-wrapper">
            <img src="${img}" alt="${service.title}" />
          </div>
        `
            )
            .join("")
        : "";

      // ----- VIDEO -----
      const videoHtml = service.video
        ? `
        <div class="service-media-wrapper">
          <video src="${service.video}" controls></video>
        </div>
      `
        : "";

      // ----- WhatsApp Message -----
      const message = `Hello Freedom Sounds & Events Mgt, I'm interested in your service: ${service.title}`;
      const whatsappLink = `https://wa.me/256756485168?text=${encodeURIComponent(
        message
      )}`;

      // ----- CARD -----
      col.innerHTML = `
        <div class="card h-100 shadow-sm p-3">
          <h5 class="fw-bold">${service.title}</h5>
          <p>${service.description}</p>

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
    console.error("Failed to fetch services:", err);
  } finally {
    hideLoader();
  }
}

fetchServices();
