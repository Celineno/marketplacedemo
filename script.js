let listings = [];
let searchResults = [];
let debounceTimer;
let searchController;

const grid = document.querySelector("#listing-grid");
const modal = document.querySelector("#listing-modal");
const modalContent = document.querySelector("#modal-content");
const searchInput = document.querySelector("#search-input");
const emptyState = document.querySelector("#empty-state");
const searchStatus = document.querySelector("#search-status");
const priceSort = document.querySelector("#price-sort");
const maxPrice = document.querySelector("#max-price");
const locationFilter = document.querySelector("#location-filter");
const categoryFilter = document.querySelector("#category-filter");
const activeFilters = document.querySelector("#active-filters");
const addListingForm = document.querySelector("#add-listing-form");
const newImageInput = document.querySelector("#new-image");
const imagePreview = document.querySelector("#image-preview");
const addListingStatus = document.querySelector("#add-listing-status");
const askForm = document.querySelector("#ask-form");
const askInput = document.querySelector("#ask-input");
const askAnswer = document.querySelector("#ask-answer");
const askButton = askForm.querySelector("button");
const chatPanel = document.querySelector("#chat-panel");
const openChat = document.querySelector("#open-chat");
const closeChat = document.querySelector("#close-chat");

function formatPrice(price) {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(price);
}

function filteredListings() {
  const source = searchInput.value.trim() ? searchResults : listings;
  const ceiling = Number(maxPrice.value);
  const filtered = source.filter((listing) =>
    (!maxPrice.value || listing.price <= ceiling)
    && (!locationFilter.value || listing.location === locationFilter.value)
    && (!categoryFilter.value || listing.category === categoryFilter.value)
  );
  return filtered.sort((a, b) => {
    if (priceSort.value === "low-high") return a.price - b.price;
    if (priceSort.value === "high-low") return b.price - a.price;
    return 0;
  });
}

function renderListings(items) {
  grid.innerHTML = items.map((listing) => `
    <button class="listing-card" data-id="${listing.id}" aria-label="View ${listing.title}">
      ${listing.image ? `<img class="listing-image" src="${listing.image}" alt="Photo of ${listing.title}" />` : ""}
      <div class="card-copy">
        <h2 class="listing-title">${listing.title}</h2>
        <div class="card-meta"><span class="price">${formatPrice(listing.price)}</span><span>${listing.location}</span></div>
        <p class="listing-details">${listing.category}</p>
      </div>
    </button>`).join("");
  emptyState.hidden = items.length !== 0;
}

function updateView() {
  const items = filteredListings();
  renderListings(items);
  const filters = [];
  if (maxPrice.value) filters.push(`up to ${formatPrice(Number(maxPrice.value))}`);
  if (locationFilter.value) filters.push(locationFilter.value);
  if (categoryFilter.value) filters.push(categoryFilter.value);
  if (priceSort.value !== "default") filters.push(priceSort.options[priceSort.selectedIndex].text.toLowerCase());
  activeFilters.textContent = filters.length
    ? `Showing ${items.length} listing${items.length === 1 ? "" : "s"} · ${filters.join(" · ")}`
    : `Showing all ${items.length} listings`;
}

function populateFilter(select, values, label) {
  const selected = select.value;
  select.replaceChildren(new Option(label, ""));
  values.sort().forEach((value) => select.add(new Option(value, value)));
  select.value = values.includes(selected) ? selected : "";
}

function populateCategoryFilter(categories) {
  const selected = categoryFilter.value;
  categoryFilter.replaceChildren(new Option("All categories", ""));
  categories.forEach((category) => {
    const label = category.replace(/\b\w/g, (letter) => letter.toUpperCase());
    categoryFilter.add(new Option(label, category));
  });
  categoryFilter.value = categories.includes(selected) ? selected : "";
}

async function loadListings() {
  const [listingsResponse, categoriesResponse] = await Promise.all([
    fetch("/api/listings"), fetch("/api/categories")
  ]);
  if (!listingsResponse.ok || !categoriesResponse.ok) throw new Error("Could not load listings.");
  listings = await listingsResponse.json();
  const categories = await categoriesResponse.json();
  searchResults = listings;
  populateFilter(locationFilter, [...new Set(listings.map((listing) => listing.location))], "All locations");
  populateCategoryFilter(categories);
  updateView();
}

function openListing(id) {
  const listing = listings.find((item) => item.id === Number(id));
  if (!listing) return;
  modalContent.innerHTML = `
    ${listing.image ? `<img class="listing-image modal-image" src="${listing.image}" alt="Photo of ${listing.title}" />` : ""}
    <div class="modal-copy">
      <h2 id="modal-title">${listing.title}</h2>
      <p class="modal-details"><span class="modal-price">${formatPrice(listing.price)}</span><span>${listing.location}</span></p>
      <p class="description">${listing.description}</p>
    </div>`;
  modal.showModal();
}

async function search(query) {
  searchController?.abort();
  if (!query.trim()) {
    searchResults = listings;
    searchStatus.textContent = "";
    updateView();
    return;
  }
  const controller = new AbortController();
  searchController = controller;
  searchStatus.textContent = "Finding the best matches…";
  try {
    const response = await fetch("/api/search", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }), signal: controller.signal
    });
    const results = await response.json();
    if (searchController !== controller) return;
    if (!response.ok) throw new Error(results.error || "Search failed.");
    searchResults = results;
    updateView();
    searchStatus.textContent = `${results.length} relevant match${results.length === 1 ? "" : "es"}.`;
  } catch (error) {
    if (error.name === "AbortError" || searchController !== controller) return;
    searchResults = [];
    updateView();
    searchStatus.textContent = error.message;
  } finally {
    if (searchController === controller) searchController = undefined;
  }
}

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".listing-card");
  if (card) openListing(card.dataset.id);
});
searchInput.addEventListener("input", (event) => {
  clearTimeout(debounceTimer);
  const query = event.target.value;
  if (!query.trim()) {
    search(query);
    return;
  }
  debounceTimer = setTimeout(() => search(query), 220);
});
newImageInput.addEventListener("input", () => {
  const imageUrl = newImageInput.value.trim();
  imagePreview.hidden = !imageUrl;
  if (imageUrl) imagePreview.src = imageUrl;
  else imagePreview.removeAttribute("src");
});
imagePreview.addEventListener("error", () => { imagePreview.hidden = true; });
addListingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(addListingForm);
  const payload = Object.fromEntries(formData.entries());
  const submitButton = addListingForm.querySelector("button[type=submit]");
  submitButton.disabled = true;
  addListingStatus.textContent = "Publishing listing…";
  try {
    const response = await fetch("/api/listings", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const listing = await response.json();
    if (!response.ok) throw new Error(listing.error || "Could not publish the listing.");
    addListingForm.reset();
    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");
    searchInput.value = "";
    await loadListings();
    addListingStatus.textContent = `Published “${listing.title}”.`;
  } catch (error) {
    addListingStatus.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});
askForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = askInput.value.trim();
  if (!question) return;
  askButton.disabled = true;
  askAnswer.textContent = "Checking the catalogue…";
  try {
    const response = await fetch("/api/ask", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not answer that question.");
    askAnswer.textContent = result.answer;
  } catch (error) {
    askAnswer.textContent = error.message;
  } finally {
    askButton.disabled = false;
  }
});
function setChatOpen(isOpen) {
  chatPanel.hidden = !isOpen;
  openChat.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) askInput.focus();
}

openChat.addEventListener("click", () => setChatOpen(chatPanel.hidden));
closeChat.addEventListener("click", () => setChatOpen(false));
[priceSort, maxPrice, locationFilter, categoryFilter].forEach((control) => control.addEventListener("input", updateView));
document.querySelector("#clear-filters").addEventListener("click", () => {
  priceSort.value = "default"; maxPrice.value = ""; locationFilter.value = ""; categoryFilter.value = ""; updateView();
});
document.querySelector("#close-modal").addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });

loadListings()
  .catch(() => { searchStatus.textContent = "Could not load listings. Start the Node.js server and refresh."; });
