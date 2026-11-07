// language: JavaScript, file: js/app.js, target: browser
let ITEMS = [];
let activeGenre = "";
let activeType = "";
let query = "";

const $ = (s) => document.querySelector(s);

async function loadCatalog() {
  const res = await fetch("data/catalog.json", { cache: "no-cache" });
  const data = await res.json();
  ITEMS = data.items || [];
  buildGenres();
  render();
  $("#status").hidden = true;
}

function buildGenres() {
  const set = new Set();
  ITEMS.forEach((it) => (it.genres || []).forEach((g) => set.add(g)));
  const sel = $("#genreFilter");
  [...set].sort().forEach((g) => {
    const o = document.createElement("option");
    o.value = g;
    o.textContent = g;
    sel.appendChild(o);
  });
}

function matches(it) {
  if (activeType && it.type !== activeType) return false;
  if (activeGenre && !(it.genres || []).includes(activeGenre)) return false;
  if (query) {
    const hay = (it.title + " " + (it.genres || []).join(" ")).toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function render() {
  const grid = $("#grid");
  grid.textContent = "";
  const list = ITEMS.filter(matches);
  if (!list.length) {
    $("#status").hidden = false;
    $("#status").textContent = "Ничего не найдено.";
    return;
  }
  $("#status").hidden = true;
  for (const it of list) grid.appendChild(card(it));
}

function card(it) {
  const a = document.createElement("a");
  a.className = "card";
  a.href = `watch.html?id=${encodeURIComponent(it.id)}`;

  const img = document.createElement("img");
  img.className = "poster";
  img.loading = "lazy";
  img.alt = it.title;
  img.src = it.poster || "img/placeholder.svg";
  img.onerror = () => { img.src = "img/placeholder.svg"; };

  const meta = document.createElement("div");
  meta.className = "meta";

  const h = document.createElement("h3");
  h.textContent = it.title;

  const sub = document.createElement("div");
  sub.className = "sub";
  const left = document.createElement("span");
  left.innerHTML =
    `<span class="badge ${it.type}">${it.type === "movie" ? "фильм" : "сериал"}</span>` +
    `${it.year || ""}`;
  const right = document.createElement("span");
  right.textContent = it.rating ? "★ " + it.rating : "";
  sub.append(left, right);

  meta.append(h, sub);
  a.append(img, meta);
  return a;
}

$("#search").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  render();
});
$("#typeFilter").addEventListener("change", (e) => {
  activeType = e.target.value;
  render();
});
$("#genreFilter").addEventListener("change", (e) => {
  activeGenre = e.target.value;
  render();
});

loadCatalog().catch((err) => {
  $("#status").textContent = "Ошибка загрузки каталога: " + err.message;
});