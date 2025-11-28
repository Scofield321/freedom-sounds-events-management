import { BASE_URL } from "./config.js";

// Fetch and render advertising campaigns
async function loadAdvertising() {
  const container = document.querySelector(".container");

  try {
    const res = await fetch(`${BASE_URL}/advertising`);
    const data = await res.json();

    if (!data.success || !data.advertising.length) {
      container.innerHTML += `<p class="text-center mt-3">No campaigns available at the moment.</p>`;
      return;
    }

    const campaignsHtml = data.advertising
      .map((ad) => {
        const imagesHtml = ad.images?.length
          ? ad.images
              .map(
                (img) =>
                  `<img src="${img}" alt="${ad.title}" class="ad-img mb-2 rounded" />`
              )
              .join("")
          : `<div class="ad-img-placeholder mb-2">No Image</div>`;

        return `
      <div class="ad-card mb-4">
        <div class="ad-card-header">
          <h4 class="ad-title">${ad.title}</h4>
          <span class="ad-type badge">${ad.type || "General"}</span>
        </div>
        <div class="ad-card-body">
          <p class="ad-description">${ad.description || ""}</p>
          <p class="ad-dates">
            <strong>From:</strong> ${
              ad.start_date
                ? new Date(ad.start_date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"
            }
            <strong>To:</strong> ${
              ad.end_date
                ? new Date(ad.end_date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"
            }
          </p>
          <div class="ad-images">${imagesHtml}</div>
        </div>
        <div class="ad-card-footer">
          <p class="ad-posted text-muted small">Posted: ${new Date(
            ad.created_at
          ).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}</p>
        </div>
      </div>
    `;
      })
      .join("");

    container.innerHTML += `<div id="advertising-list">${campaignsHtml}</div>`;
  } catch (err) {
    console.error("Failed to fetch advertising campaigns:", err);
    container.innerHTML += `<p class="text-center text-danger mt-3">Failed to load campaigns. Please try again later.</p>`;
  }
}

// Load campaigns on page load
document.addEventListener("DOMContentLoaded", loadAdvertising);
