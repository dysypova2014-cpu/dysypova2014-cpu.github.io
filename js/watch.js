// language: JavaScript, file: js/watch.js, target: browser
const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const id = params.get("id");

let ITEM = null;
let currentSeason = 0;
let currentEpisode = 0;

const player = $("#player");

function epSuffix() {
  if (ITEM && ITEM.type === "series") return `_s${currentSeason}_e${currentEpisode}`;
  return "";
}
function progressKey(suffix = "") {
  return "kw_progress_" + id + suffix;
}
function saveProgress(suffix = "") {
  if (player.duration && isFinite(player.duration)) {
    localStorage.setItem(progressKey(suffix), String(player.currentTime));
  }
}
function restoreProgress(suffix = "") {
  const v = parseFloat(localStorage.getItem(progressKey(suffix)) || "0");
  if (v > 0) player.currentTime = v;
}
player.addEventListener("timeupdate", () => saveProgress(epSuffix()));
player.addEventListener("pause", () => saveProgress(epSuffix()));

function setSource(src) {
  player.src = src;
  player.load();
  restoreProgress(epSuffix());
}

function renderSources(sources, activeIdx = 0) {
  const bar = $("#sourceBar");
  bar.textContent = "";
  if (!sources.length) {
    bar.textContent = "Источник видео не указан.";
    return;
  }
  sources.forEach((s, i) => {
    const b = document.createElement("button");
    b.textContent = s.label || ("Источник " + (i + 1));
    if (i === activeIdx) b.classList.add("active");
    b.addEventListener("click", () => {
      [...bar.children].forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      setSource(s.url);
      player.play().catch(() => {});
    });
    bar.appendChild(b);
  });
  setSource(sources[activeIdx].url);
}

function renderSeries() {
  const panel = $("#seriesPanel");
  panel.hidden = false;
  panel.textContent = "";

  const tabs = document.createElement("div");
  tabs.className = "season-tabs";
  ITEM.seasons.forEach((s, si) => {
    const b = document.createElement("button");
    b.textContent = "Сезон " + s.number;
    if (si === currentSeason) b.classList.add("active");
    b.addEventListener("click", () => {
      currentSeason = si;
      currentEpisode = 0;
      renderSeries();
      playEpisode(si, 0);
    });
    tabs.appendChild(b);
  });

  const list = document.createElement("div");
  list.className = "ep-list";
  const season = ITEM.seasons[currentSeason];
  season.episodes.forEach((ep, ei) => {
    const row = document.createElement("div");
    row.className = "ep" + (ei === currentEpisode ? " active" : "");
    row.innerHTML =
      `<span class="ep-num">${ep.number}</span>` +
      `<span class="ep-title">${escapeHtml(ep.title || "Серия " + ep.number)}</span>` +
      `<span class="ep-dur">${ep.duration ? ep.duration + " мин" : ""}</span>`;
    row.addEventListener("click", () => playEpisode(currentSeason, ei));
    list.appendChild(row);
  });

  panel.append(tabs, list);
}

function playEpisode(si, ei) {
  currentSeason = si;
  currentEpisode = ei;
  const ep = ITEM.seasons[si].episodes[ei];
  $("#subline").textContent =
    `Сезон ${ITEM.seasons[si].number} · Серия ${ep.number}` +
    (ep.duration ? ` · ${ep.duration} мин` : "");
  renderSources(ep.sources || [], 0);
  renderSeries();
  player.play().catch(() => {});
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function init() {
  const res = await fetch("data/catalog.json", { cache: "no-cache" });
  const data = await res.json();
  ITEM = (data.items || []).find((x) => x.id === id);
  if (!ITEM) {
    document.body.innerHTML =
      "<main><p>Не найдено. <a href='index.html'>В каталог</a></p></main>";
    return;
  }
  document.title = ITEM.title + " — КиноБезРекламы";
  $("#title").textContent = ITEM.title;

  if (ITEM.type === "series") {
    $("#subline").textContent = `${ITEM.year || ""} · сериал`;
    playEpisode(0, 0);
  } else {
    $("#subline").textContent =
      `${ITEM.year || ""} · ${ITEM.duration ? ITEM.duration + " мин" : ""}`;
    renderSources(ITEM.sources || [], 0);
    $("#seriesPanel").hidden = true;
  }

  const about = $("#about");
  const desc = document.createElement("p");
  desc.textContent = ITEM.description || "";
  const meta = document.createElement("p");
  meta.textContent = "Жанры: " + (ITEM.genres || []).join(", ");
  about.append(desc, meta);
}

window.addEventListener("beforeunload", () => saveProgress(epSuffix()));
init().catch((e) => console.error(e));