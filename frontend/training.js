import { BASE_URL } from "./config.js";

async function fetchTraining() {
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
      col.className = "col-md-6 col-lg-4";

      const images = item.images?.length
        ? item.images
            .map((img) => `<img src="${img}" class="img-fluid mb-2"/>`)
            .join("")
        : "";

      const video = item.video
        ? `<video src="${item.video}" controls class="w-100 mb-2"></video>`
        : "";

      const message = `Hello Freedom Sounds & Events Mgt, I'm interested in: ${item.title} Course`;
      const whatsappLink = `https://wa.me/256756485168?text=${encodeURIComponent(
        message
      )}`;

      col.innerHTML = `
        <div class="card h-100 shadow-sm p-3">
          <h5>${item.title}</h5>
          <p>${item.description}</p>
          <p>${item.duration} of Hands on Coaching and Mentoring</p>
          <p class="price"> Full Course @ UGX ${Number(
            item.price
          ).toLocaleString("en-UG")}</p>
          ${images}
          ${video}
          <div class="d-flex gap-2 mt-2">
            <a href="tel:+256756485168" class="btn btn-primary flex-grow-1">Call </a>
            <a href="${whatsappLink}" class="btn btn-success flex-grow-1">WhatsApp </a>
          </div>
        </div>
      `;

      gallery.appendChild(col);
    });
  } catch (err) {
    console.error("Failed to fetch training:", err);
  }
}

fetchTraining();
