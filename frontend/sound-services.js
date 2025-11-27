import { BASE_URL } from "./config.js";

async function fetchServices() {
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
      col.className = "col-md-6 col-lg-4";

      const images = service.images?.length
        ? service.images
            .map((img) => `<img src="${img}" class="img-fluid mb-2"/>`)
            .join("")
        : "";
      const video = service.video
        ? `<video src="${service.video}" controls class="w-100 mb-2"></video>`
        : "";

      col.innerHTML = `
          <div class="card h-100 shadow-sm p-3">
            <h5>${service.title}</h5>
            <p>${service.description}</p>
            ${images}
            ${video}
            <div class="d-flex gap-2 mt-2">
              <a href="tel:+256756485168" class="btn btn-primary flex-grow-1">Call</a>
              <a href="https://wa.me/256756485168" class="btn btn-success flex-grow-1">WhatsApp</a>
            </div>
          </div>
        `;
      gallery.appendChild(col);
    });
  } catch (err) {
    console.error("Failed to fetch services:", err);
  }
}

fetchServices();
