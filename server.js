import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const embeddingModel = "openai/text-embedding-3-small";

// This data stays on the server; the browser receives it only through the API.
const imageUrls = {
  1: "https://www.adairs.com.au/cdn-cgi/image/fit=scale-down,quality=85,format=auto,width=800/globalassets/13.-ecommerce/03.-product-images/2025_images/furniture/side-tables/59476_walnut_01.jpg",
  2: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-ufUHjFRQZitzcBAMLvq-m4V_zdVO333ErE7uw203Ssjk59Xpb9kBUCo&s=10",
  3: "https://ttpottery.com/cdn/shop/files/8126_1.jpg?v=1747877861&width=416",
  4: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgytuJ8B2-M6H6VRtFIWtU2i87LB5c_Wsqkfq34dRz7ED0ehRszF_4JuY&s=10",
  5: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVJHaX6_2qcUpGEiVNKXVdQjm_JAsio5u160VuetEV4yhpeobV2o8I3iPG&s=10",
  6: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYd6EQSR4TDZx2gHOCq7-D4A2gU3kXmKYPULxKkhvhBFV8gesh4hb7GEY&s=10",
  7: "https://www.ikea.com/sg/en/images/products/idasen-desk-sit-stand-brown-beige__0734936_pe739670_s5.jpg?f=s",
  8: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_VumLyUrEtMSe7a_rAa4o9X9MLxTJCRvWFxeHorO_5jwOiuVFeWnwmmMb&s=10",
  9: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScLEN5IQR8hjTdV3rDSSu9sF0sUZAwr22cYhe_fldlR7cjSD4EVS4ia6k&s=10",
  10: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIyeiHGgKrhhHIF_nNa830j9dozQNqUiJiqF42nVF6B8PHPaCbkcqfRxI&s=10",
  11: "https://images.thdstatic.com/productImages/f7a210f2-6859-4b1c-9613-e6764b519db9/svn/black-megachef-air-fryers-985122568m-a0_600.jpg",
  12: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-FzAGH4DQQD7fhfABRI9VE-Xf9J_L1Yi-f4C5d9rRgQ&s=10",
  13: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSz2sTod7ffD6MO5LAJrj_s3gkqmAqNxPZuGUyJQKgEoh-X7Vj0hY8jmo-s&s=10",
  14: "https://i.ebayimg.com/images/g/Y6cAAOSwFKRnz8UC/s-l1200.jpg",
  15: "https://cdn.shopify.com/s/files/1/0682/2372/9973/products/HAL-L6SK3.jpg?v=1723767349",
  16: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHfjf7AVpjAFN84Pun41Liv8dxBFn_qvzJHldWyYAPOw&s",
  17: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxqa4pIa_WuJgArbyuAcsgBeo8QxBaBk4qP9wmG8ADr6FFzeM4-bsgqHgL&s=10",
  18: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhQCwAsC6wHgeQQzmewwuj7o7AFMgcWEQwhWWy0_7hzoqp6qNVP0E4Y1A&s=10",
  19: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYtAfsBQih42RQAWcd-GvaSEBrqPqyAF0nd5E7sXxSrkwkXFa2itj4MmA&s=10",
  20: "https://static.wikia.nocookie.net/zelda_gamepedia_en/images/4/4c/TotK_English_Logo.png/revision/latest?cb=20220913150240",
  21: "https://filebroker-cdn.lazada.sg/kf/Sa14e54df39464143a185ff98befc52d0w.jpg",
  22: "https://strapi-ecm-assets.s3.ap-southeast-1.amazonaws.com/P120575_46_1e9da87085.jpeg",
  23: "https://m.media-amazon.com/images/I/81RxQVl0guL.jpg",
  24: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJGWQhptQQ7jP0W1SGlKvSC_W3_w8gxMIIEQrGE2uikaD_92QfcO32h1EW&s=10",
  25: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_3-VWY6sao2Q6iMMJu-CMjLt1hNsEPHoq_L2FYJXwPevC0Um8V0CAWaKv&s=10",
  26: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSbHuZDsdsic5MhIlkdn5UfqRAewYalBGk3BpDG9mCtWFpV4HidazoGYk&s=10"
};

const listings = [
  { id: 1, title: "Walnut side table", price: 45, location: "Queenstown", category: "furniture", icon: "🪑", color: "#e8d5b7", description: "Solid wood side table with a warm walnut finish. A few small signs of use, but sturdy and ready for a new home." },
  { id: 2, title: "Film camera", price: 80, location: "Tiong Bahru", category: "electronics", icon: "📷", color: "#d6d9ca", description: "35mm point-and-shoot camera. Includes wrist strap and an almost-finished roll of film." },
  { id: 3, title: "Ceramic planter set", price: 18, location: "Bishan", category: "home", icon: "🪴", color: "#cfe2d1", description: "Set of three glazed ceramic planters in different sizes. Drainage trays included." },
  { id: 4, title: "Vintage denim jacket", price: 35, location: "Bugis", category: "clothing", icon: "🧥", color: "#c9d9e9", description: "Classic blue denim jacket, size M. Soft, broken-in feel with no stains or tears." },
  { id: 5, title: "Desk lamp", price: 20, location: "Clementi", category: "home", icon: "💡", color: "#f0dfa4", description: "Adjustable metal desk lamp with a warm LED bulb. Works perfectly." },
  { id: 6, title: "Record collection", price: 60, location: "Punggol", category: "music", icon: "💿", color: "#dfcadc", description: "Bundle of 12 well-loved records: indie, jazz, and classic rock. Selling as a set." },
  { id: 7, title: "IKEA standing desk", price: 48, location: "Ang Mo Kio", category: "furniture", icon: "🖥️", color: "#d9d2c3", description: "Manual height-adjustable desk in white, 120 cm wide. Clean condition with light marks on the top." },
  { id: 8, title: "Bluetooth bookshelf speakers", price: 75, location: "Kallang", category: "electronics", icon: "🔊", color: "#cad8e5", description: "Compact powered speakers with Bluetooth and AUX input. Great for a desktop or small living room." },
  { id: 9, title: "Uniqlo linen shirt", price: 15, location: "Toa Payoh", category: "clothing", icon: "👕", color: "#e5dccb", description: "Breathable beige linen-blend shirt, size L. Worn twice and freshly washed." },
  { id: 10, title: "The Lord of the Rings book set", price: 25, location: "Serangoon", category: "books", icon: "📚", color: "#d6cfb5", description: "Paperback trilogy plus The Hobbit. Pages are clean; slipcase has a little shelf wear." },
  { id: 11, title: "Air fryer", price: 40, location: "Tampines", category: "kitchen", icon: "🍟", color: "#d7d7d2", description: "4-litre digital air fryer, fully working. Includes basket and quick-start guide." },
  { id: 12, title: "Road bike helmet", price: 30, location: "East Coast", category: "fitness", icon: "🚴", color: "#d7e3d3", description: "Lightweight cycling helmet, size M. No crashes; adjustable fit dial works smoothly." },
  { id: 13, title: "Rattan lounge chair", price: 95, location: "Holland Village", category: "furniture", icon: "🪑", color: "#e2c99a", description: "Handwoven rattan lounge chair with a removable cream cushion. A lovely statement piece." },
  { id: 14, title: "Nintendo Switch games bundle", price: 70, location: "Sengkang", category: "gaming", icon: "🎮", color: "#ddd0e8", description: "Three cartridge games: Mario Kart 8, Animal Crossing, and Overcooked 2. Cases included." },
  { id: 15, title: "Cast iron skillet", price: 22, location: "Bukit Merah", category: "kitchen", icon: "🍳", color: "#c8d0cb", description: "Seasoned 10-inch cast iron skillet. Heats evenly and has plenty of life left." },
  { id: 16, title: "Canvas tote bag", price: 10, location: "Orchard", category: "clothing", icon: "👜", color: "#eadcc8", description: "Sturdy natural canvas tote with inner pocket and zip closure. Barely used." },
  { id: 17, title: "PlayStation 4 Slim", price: 180, location: "Jurong East", category: "gaming", icon: "🎮", color: "#cbd4e3", description: "500GB PS4 Slim in working condition with power cable and one controller. Factory reset and ready to set up." },
  { id: 18, title: "Xbox wireless controller", price: 45, location: "Woodlands", category: "gaming", icon: "🕹️", color: "#c8dfcf", description: "Black Xbox Series wireless controller with USB-C cable. Buttons, sticks, and Bluetooth connection work well." },
  { id: 19, title: "Catan board game", price: 32, location: "Novena", category: "gaming", icon: "🎲", color: "#ebd6a8", description: "Complete base-game set for 3 to 4 players. All resource cards and wooden pieces counted and included." },
  { id: 20, title: "The Legend of Zelda: Tears of the Kingdom", price: 48, location: "Bedok", category: "gaming", icon: "🗡️", color: "#d4e2c0", description: "Nintendo Switch game cartridge with original case. Played once and kept in excellent condition." },
  { id: 21, title: "Mechanical gaming keyboard", price: 55, location: "Hougang", category: "gaming", icon: "⌨️", color: "#d9cde8", description: "Compact 65% mechanical keyboard with tactile switches and RGB backlighting. Includes detachable USB-C cable." },
  { id: 22, title: "KitchenAid hand mixer", price: 38, location: "Marine Parade", category: "kitchen", icon: "🥣", color: "#f0d6d3", description: "Five-speed hand mixer with two beaters. Used occasionally for baking and works perfectly." },
  { id: 23, title: "Bamboo chopping board set", price: 14, location: "Pasir Ris", category: "kitchen", icon: "🔪", color: "#e8d2a4", description: "Set of three bamboo chopping boards in small, medium, and large sizes. Clean and lightly used." },
  { id: 24, title: "Nespresso coffee machine", price: 65, location: "Yishun", category: "kitchen", icon: "☕", color: "#ced5dc", description: "Compact capsule coffee machine with water tank and drip tray. Descaled recently and in good working order." },
  { id: 25, title: "Glass meal-prep containers", price: 20, location: "Chinatown", category: "kitchen", icon: "🥡", color: "#d8e4df", description: "Set of eight leak-resistant glass containers with snap lids. Microwave and dishwasher safe." },
  { id: 26, title: "Stainless steel wok", price: 28, location: "Bukit Panjang", category: "kitchen", icon: "🍲", color: "#d9dce0", description: "32 cm stainless steel wok with a flat base, suitable for induction and gas stoves. Includes a matching lid." }
].map((listing) => ({ ...listing, image: imageUrls[listing.id] || "" }));


const DEFAULT_IMAGE = "";

const client = process.env.CLASSGW_KEY
  ? new OpenAI({ apiKey: process.env.CLASSGW_KEY, baseURL: "https://174.138.16.223/openrouter/v1" })
  : null;
const chatClient = process.env.CLASSGW_KEY
  ? new OpenAI({ apiKey: process.env.CLASSGW_KEY, baseURL: "https://174.138.16.223/v1" })
  : null;
let listingEmbeddings;

app.use(express.json());
app.use(express.static(__dirname));
app.get("/notes", (_request, response) => response.sendFile(path.join(__dirname, "notes.html")));
app.get("/api/listings", (_request, response) => response.json(listings));
app.get("/api/categories", (_request, response) => {
  response.json([...new Set(listings.map((listing) => listing.category))].sort());
});

app.post("/api/listings", (request, response) => {
  const { title, price, location, category, description, image } = request.body || {};
  const numericPrice = Number(price);
  if (![title, location, category, description].every((value) => typeof value === "string" && value.trim())
    || !Number.isFinite(numericPrice) || numericPrice < 0) {
    return response.status(400).json({ error: "Title, a valid price, location, category, and description are required." });
  }

  const newListing = {
    id: Math.max(0, ...listings.map((listing) => listing.id)) + 1,
    title: title.trim(),
    price: numericPrice,
    location: location.trim(),
    category: category.trim().toLowerCase(),
    description: description.trim(),
    image: typeof image === "string" && image.trim() ? image.trim() : DEFAULT_IMAGE,
    color: "#d8e5de"
  };
  listings.push(newListing);
  listingEmbeddings = undefined;
  response.status(201).json(newListing);
});

function listingText(listing) {
  return `${listing.title}. ${listing.description} Location: ${listing.location}. Price: SGD ${listing.price}.`;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]; magnitudeA += a[i] ** 2; magnitudeB += b[i] ** 2;
  }
  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

async function getListingEmbeddings() {
  if (!listingEmbeddings) {
    listingEmbeddings = client.embeddings.create({ model: embeddingModel, input: listings.map(listingText) })
      .then((result) => result.data.map((item) => item.embedding));
  }
  return listingEmbeddings;
}

function maximumPrice(query) {
  const match = query.match(/(?:under|below|less than|up to|max(?:imum)?\s*(?:of)?)[^\d$]*(?:\$|sgd\s*)?(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function wordStem(word) {
  return word.replace(/(ing|ies|es|s)$/i, "");
}

function matchingCategories(query) {
  const normalizedQuery = query.toLowerCase();
  const words = normalizedQuery.match(/[a-z]+/g) || [];
  const categories = [...new Set(listings.map((listing) => listing.category))];
  return new Set(categories.filter((category) => words.some((word) => {
    const stemmedWord = wordStem(word);
    const stemmedCategory = wordStem(category);
    return word.includes(category) || category.includes(word)
      || (stemmedWord.length >= 3 && stemmedCategory.length >= 3
        && (stemmedWord.startsWith(stemmedCategory) || stemmedCategory.startsWith(stemmedWord)));
  })));
}

async function retrieveListings(query, limit = 10) {
  const [storedEmbeddings, queryResult] = await Promise.all([
    getListingEmbeddings(), client.embeddings.create({ model: embeddingModel, input: query })
  ]);
  const ceiling = maximumPrice(query);
  const categoryMatches = matchingCategories(query);
  return listings.map((listing, index) => {
    const score = cosineSimilarity(queryResult.data[0].embedding, storedEmbeddings[index]);
    return { ...listing, score: score + (categoryMatches.has(listing.category) ? 2 : 0) };
  })
    .filter((listing) => ceiling === null || listing.price <= ceiling)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

app.post("/api/search", async (request, response) => {
  const query = String(request.body?.query || "").trim();
  if (!query) return response.status(400).json({ error: "A search query is required." });
  if (!client) return response.status(500).json({ error: "The server is missing CLASSGW_KEY." });
  try {
    const ranked = await retrieveListings(query);
    const results = ranked
      .map(({ score, ...listing }) => listing);
    response.json(results);
  } catch (error) {
    console.error("Embedding search failed:", error.message);
    listingEmbeddings = undefined;
    response.status(502).json({ error: "Search is temporarily unavailable. Please try again." });
  }
});

app.post("/api/ask", async (request, response) => {
  const question = String(request.body?.question || "").trim();
  if (!question) return response.status(400).json({ error: "A question is required." });
  if (!client || !chatClient) return response.status(500).json({ error: "The server is missing CLASSGW_KEY." });

  try {
    const relevantListings = (await retrieveListings(question, listings.length))
      .map(({ score, ...listing }) => listing);
    const completion = await chatClient.chat.completions.create({
      model: "gpt-5.6-terra",
      messages: [
        {
          role: "system",
          content: "Answer catalogue questions using only the provided listings. Keep the answer concise. If the requested item, fact, or comparison is not supported by the provided listings, clearly say it is not available in the catalogue. Do not guess or invent details."
        },
        {
          role: "user",
          content: `Question: ${question}\n\nRelevant catalogue listings:\n${JSON.stringify(relevantListings)}`
        }
      ]
    });
    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) throw new Error("The catalogue assistant returned no answer.");
    response.json({ answer });
  } catch (error) {
    console.error("Catalogue Q&A failed:", error.message);
    response.status(502).json({ error: "The catalogue assistant is temporarily unavailable. Please try again." });
  }
});

app.listen(port, () => console.log(`Marketplace running at http://localhost:${port}`));
