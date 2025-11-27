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
                  `<img src="${img}" alt="${ad.title}" class="img-fluid mb-2" />`
              )
              .join("")
          : "";

        return `
        <div class="card mb-4 shadow-sm">
          <div class="card-body">
            <h4 class="card-title">${ad.title}</h4>
            <p class="card-text">${ad.description || ""}</p>
            <p class="mb-1"><strong></strong> ${
              ad.type || " Not specified "
            } Advertising</p>
            <p class="mb-1">
              <strong>Between</strong> ${
                ad.start_date
                  ? new Date(ad.start_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"
              }, 
              <strong> - </strong> ${
                ad.end_date
                  ? new Date(ad.end_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"
              }
            </p>
            <div class="mb-2">${imagesHtml}</div>
            <p class="text-muted small">Posted on: ${new Date(
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
