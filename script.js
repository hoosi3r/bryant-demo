// Rochester Boat Company site interactions

// Set to a form handler URL (e.g. Formspree) to receive quote requests by email.
const FORM_ENDPOINT = "";
// Lake Manitou, Rochester IN
const LAKE = { lat: 41.0567, lon: -86.19, tz: "America/Indiana/Indianapolis" };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fmt$ = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isDesktop = () => innerWidth > 900;

$("#yr").textContent = new Date().getFullYear();

// ---------- Nav ----------
const nav = $("#nav");
const burger = $("#burger");
const links = $("#navLinks");
const setMenu = (open) => {
  links.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
};
burger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
$$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));

// ---------- Photo slots: show a labeled panel when a photo hasn't been added yet ----------
$$(".media img").forEach((img) => {
  const miss = () => img.parentElement.classList.add("missing");
  if (img.complete && !img.naturalWidth) miss();
  img.addEventListener("error", miss);
});

// ---------- Scroll-scrubbed word fill ----------
const fill = $("#fillText");
const HIGHLIGHT = new Set(["lake", "water."]);
fill.innerHTML = fill.textContent.trim().split(/\s+/)
  .map((w) => `<span class="w${HIGHLIGHT.has(w.toLowerCase()) ? " hl" : ""}">${w}</span>`).join(" ");
const words = $$(".w", fill);

// ---------- Scroll engine ----------
const hero = $(".hero");
const heroMedia = $("#heroMedia");
const heroCopy = $("#heroCopy");
const progress = $("#progress");
const fleet = $("#fleet");
const fleetTrack = $("#fleetTrack");
const zoomImgs = $$(".media img").filter((img) => !img.closest(".story-media"));
const parallax = $$("[data-parallax]");
let lastY = scrollY;

function sizeFleet() {
  fleet.style.height = isDesktop() ? `${fleetTrack.scrollWidth - innerWidth + innerHeight}px` : "";
}

function frame() {
  const y = scrollY;
  const vh = innerHeight;
  const vw = innerWidth;

  nav.classList.toggle("solid", y > 60);
  nav.classList.toggle("hide", y > lastY && y > vh && !links.classList.contains("open"));
  lastY = y;
  progress.style.transform = `scaleX(${y / (document.documentElement.scrollHeight - vh || 1)})`;

  if (!reduceMotion) {
    // Hero: photo pushes in, copy lifts away
    const hp = clamp(y / (hero.offsetHeight - vh));
    heroMedia.style.transform = `scale(${1 + hp * 0.28})`;
    heroCopy.style.transform = `translateY(${-hp * 140}px)`;
    heroCopy.style.opacity = 1 - hp * 1.5;

    // Fleet: vertical scroll drives the horizontal track
    if (isDesktop()) {
      const r = fleet.getBoundingClientRect();
      const fp = clamp(-r.top / (r.height - vh));
      fleetTrack.style.transform = `translateX(${-fp * (fleetTrack.scrollWidth - vw)}px)`;
    }

    // Photos ease from zoomed-in to resting as they travel through the viewport
    zoomImgs.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      const inFleet = isDesktop() && img.closest(".fleet-track");
      const p = inFleet ? clamp((vw - r.left) / (vw + r.width)) : clamp((vh - r.top) / (vh + r.height));
      img.style.transform = `scale(${1.22 - p * 0.22})`;
    });

    parallax.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      el.style.transform = `translateY(${(r.top + r.height / 2 - vh / 2) * -(+el.dataset.parallax)}px)`;
    });
  }

  // Statement words light up as you read down
  const fr = fill.getBoundingClientRect();
  const lit = Math.round(clamp((vh * 0.85 - fr.top) / (fr.height + vh * 0.35)) * words.length);
  words.forEach((w, i) => w.classList.toggle("on", reduceMotion || i < lit));
}

let ticking = false;
const requestFrame = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { frame(); ticking = false; });
};
addEventListener("scroll", requestFrame, { passive: true });
addEventListener("resize", () => { sizeFleet(); requestFrame(); });
addEventListener("load", () => { sizeFleet(); requestFrame(); });
sizeFleet();
frame();

// ---------- Reveal on scroll + counters ----------
$$(".sec-head, .facts > div, .lake-now, .forecast, .lifts-panel > *, .svc-list li, .tool, .contact-grid > *, .story-copy > *")
  .forEach((el, i) => { el.setAttribute("data-reveal", ""); el.style.transitionDelay = `${(i % 4) * 80}ms`; });

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    const c = $(".count", e.target);
    if (c) countUp(c);
    io.unobserve(e.target);
  });
}, { threshold: 0.12 });
$$("[data-reveal]").forEach((el) => io.observe(el));

function countUp(el) {
  if (reduceMotion) return;
  const end = +el.dataset.to;
  const start = end > 1000 ? end - 40 : 0;
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / 1600, 1);
    el.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- Hero contour lines (shown until a hero photo is added) ----------
(() => {
  const canvas = $("#contours");
  const ctx = canvas.getContext("2d");
  let w, h, dpr, visible = true;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width = canvas.offsetWidth * dpr;
    h = canvas.height = canvas.offsetHeight * dpr;
  };
  resize();
  addEventListener("resize", resize);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const LINES = 38;
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < LINES; i++) {
      const base = h * 0.22 + (i / LINES) * h * 0.9;
      const accent = i % 9 === 4;
      ctx.beginPath();
      ctx.lineWidth = (accent ? 1.6 : 1) * dpr;
      ctx.strokeStyle = accent ? "rgba(255,210,0,.55)" : `rgba(255,255,255,${0.05 + (i / LINES) * 0.12})`;
      for (let x = 0; x <= w; x += 8 * dpr) {
        const nx = x / w;
        const y = base
          + Math.sin(nx * 5 + t * 0.00035 + i * 0.32) * 26 * dpr
          + Math.sin(nx * 11 - t * 0.0005 + i * 0.18) * 9 * dpr
          + Math.cos(nx * 2.4 + t * 0.0002 + i * 0.07) * 40 * dpr * (i / LINES);
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  }
  if (reduceMotion) { draw(0); return; }
  const loop = (t) => { if (visible) draw(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();

// ---------- Lake report (Open-Meteo, no key needed) ----------
const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const CLOCK = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: LAKE.tz });

function lakeScore({ temp, wind, rain = 0, code = 0 }) {
  let s = 10;
  if (temp < 68) s -= Math.min(6, Math.ceil((68 - temp) / 4));
  if (temp > 94) s -= 2;
  if (wind > 9) s -= Math.min(4, Math.ceil((wind - 9) / 4));
  if (rain > 25) s -= Math.min(4, Math.round((rain - 25) / 18));
  if (code >= 95) s = Math.min(s, 2);
  return clamp(s, 1, 10);
}
const verdict = (s) => (s >= 8 ? "Send it" : s >= 6 ? "Good day" : s >= 4 ? "Iffy" : "Stay docked");

(async () => {
  try {
    const url = "https://api.open-meteo.com/v1/forecast"
      + `?latitude=${LAKE.lat}&longitude=${LAKE.lon}&timezone=${encodeURIComponent(LAKE.tz)}`
      + "&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7"
      + "&current=temperature_2m,wind_speed_10m,precipitation,weather_code"
      + "&daily=temperature_2m_max,wind_speed_10m_max,precipitation_probability_max,weather_code,sunset";
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    const c = d.current;
    const offset = d.utc_offset_seconds * 1000;
    const toDate = (iso) => new Date(Date.parse(iso + "Z") - offset);

    const nowScore = lakeScore({ temp: c.temperature_2m, wind: c.wind_speed_10m, rain: c.precipitation > 0 ? 80 : 0, code: c.weather_code });
    const sunset = toDate(d.daily.sunset[0]);

    $("#tTemp").textContent = `${Math.round(c.temperature_2m)}°F`;
    $("#tWind").textContent = `${Math.round(c.wind_speed_10m)} mph`;
    $("#tSunset").textContent = CLOCK.format(sunset);
    $("#tScore").textContent = `${nowScore}/10`;

    $("#scoreNow").textContent = nowScore;
    $("#nTemp").textContent = `${Math.round(c.temperature_2m)}°F`;
    $("#nWind").textContent = `${Math.round(c.wind_speed_10m)} mph`;
    $("#nVerdict").textContent = verdict(nowScore);
    const ring = $("#ringFg");
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      ring.style.strokeDashoffset = 327 * (1 - nowScore / 10);
      obs.disconnect();
    }).observe(ring);

    const tickSunset = () => {
      const mins = Math.round((sunset - Date.now()) / 60000);
      $("#nSunset").textContent = mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "After dark";
    };
    tickSunset();
    setInterval(tickSunset, 60000);

    const days = d.daily.time.map((t, i) => ({
      label: i === 0 ? "Today" : WEEKDAY.format(new Date(t + "T12:00:00Z")),
      temp: d.daily.temperature_2m_max[i],
      wind: d.daily.wind_speed_10m_max[i],
      rain: d.daily.precipitation_probability_max[i] ?? 0,
      code: d.daily.weather_code[i],
    }));
    days.forEach((day) => { day.score = lakeScore(day); });
    const best = days.reduce((a, b) => (b.score > a.score ? b : a));
    $("#forecast").innerHTML = days.map((day) => `
      <div class="day${day === best ? " best" : ""}" style="--s:${day.score}">
        <span>${day === best ? `${day.label} · Best` : day.label}</span>
        <b>${day.score}</b>
        <small>${Math.round(day.temp)}°F high<br>${Math.round(day.wind)} mph wind<br>${day.rain}% rain</small>
      </div>`).join("");
  } catch {
    $("#heroTicker").hidden = true;
    $("#lakeNow").hidden = true;
    $("#forecast").hidden = true;
    $("#lakeErr").hidden = false;
  }
})();

// ---------- Season tracker ----------
(() => {
  // Four equal segments on the bar; months map onto them.
  const SEASONS = [
    { name: "Spring install", months: [4, 5], tip: "Install season. Call now to lock in your dock and lift date." },
    { name: "Lake season", months: [6, 7, 8], tip: "Peak season. Need service? We work to get you back on the water fast." },
    { name: "Fall pull-out", months: [9, 10], tip: "Pull-out season. Schedule dock and lift removal plus winterization." },
    { name: "Storage", months: [11, 12, 1, 2, 3], tip: "Storage season, and the best time to shop for next year's boat. Get on the spring install list early." },
  ];
  const now = new Date();
  const m = now.getMonth() + 1;
  const idx = SEASONS.findIndex((s) => s.months.includes(m));
  const s = SEASONS[idx];
  const within = (s.months.indexOf(m) + now.getDate() / 31) / s.months.length;
  const pct = (idx + within) * 25;
  $("#seasonName").textContent = s.name;
  $("#seasonTip").textContent = s.tip;
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    $("#seasonFill").style.width = `${pct}%`;
    $("#seasonPin").style.left = `${pct}%`;
    obs.disconnect();
  }).observe($("#season"));
})();

// ---------- Boat finder ----------
const QUESTIONS = [
  { key: "crew", q: "Who's usually aboard?", opts: [
    ["small", "Just a couple of us", "2–4 people"],
    ["family", "The family", "5–8 people"],
    ["crowd", "The whole crew", "9+ people"],
    ["fish", "Me and my rods", "Fishing first"],
  ] },
  { key: "vibe", q: "Your perfect lake day?", opts: [
    ["cruise", "Sunset cruise", "Slow and easy"],
    ["sport", "Tubing & skiing", "Bring the power"],
    ["sandbar", "Sandbar hangout", "Lounge all day"],
    ["mix", "A bit of everything", "Do it all"],
  ] },
  { key: "budget", q: "Where's the budget landing?", opts: [
    ["entry", "Smart value", "Get on the water"],
    ["mid", "Mid-range", "Comfort + features"],
    ["premium", "Premium", "Best of the best"],
    ["unsure", "Not sure yet", "Help me decide"],
  ] },
  { key: "storage", q: "Where will it live?", opts: [
    ["lift", "On my lift", "Lakefront property"],
    ["need", "Need a lift & dock", "Set me up"],
    ["trailer", "On a trailer", "Launch as I go"],
    ["store", "Store it for me", "Full-service"],
  ] },
];
const answers = {};
let qi = 0;
const quiz = $("#quiz");

function renderQ() {
  if (qi >= QUESTIONS.length) return renderResult();
  const { q, opts, key } = QUESTIONS[qi];
  quiz.innerHTML = `
    <div class="step-in">
      <p class="q-step">Question ${qi + 1} / ${QUESTIONS.length}</p>
      <div class="q-bar"><span style="width:${(qi / QUESTIONS.length) * 100}%"></span></div>
      <p class="q-title">${q}</p>
      <div class="opts">${opts.map(([v, t, s]) => `<button class="opt" type="button" data-v="${v}">${t}<small>${s}</small></button>`).join("")}</div>
    </div>`;
  $$(".opt", quiz).forEach((b) => b.addEventListener("click", () => { answers[key] = b.dataset.v; qi++; renderQ(); }));
}

function renderResult() {
  const { crew, vibe, budget, storage } = answers;
  let pick, why;
  if (budget === "premium" || (vibe === "sport" && crew === "crowd")) {
    pick = "Crest Caribbean or Savannah"; why = "Tritoon stability and big horsepower for a full boat that still pulls a tuber.";
  } else if (budget === "entry" || crew === "fish") {
    pick = "Bentley Navigator or Legacy"; why = "Easy to own and easy on the wallet, with fishing layouts available.";
  } else if (vibe === "sport") {
    pick = "Crest Continental or Bentley Elite"; why = "A performance package and tritoon option give you real ski-and-tube power.";
  } else if (crew === "crowd" || vibe === "sandbar") {
    pick = "Crest Continental"; why = "Room to spread out, lounge seating, and a ride that stays comfortable all day.";
  } else {
    pick = "Crest Classic or Bentley Elite"; why = "The sweet spot of comfort, features and value for most families on the lake.";
  }
  const motor = vibe === "sport" || budget === "premium" ? "Higher-horsepower Mercury or Suzuki outboard" : "Efficient mid-range Mercury or Suzuki four-stroke";
  const extra = {
    lift: "We'll confirm your current lift fits the new boat.",
    need: "Pair it with a ShoreStation lift and dock, installed in spring and pulled in fall.",
    trailer: "Ask about a matched trailer package.",
    store: "Add winterization and storage, ready when the ice is off.",
  }[storage];

  quiz.innerHTML = `
    <div class="result step-in">
      <p class="q-step">Your match</p>
      <div class="q-bar"><span style="width:100%"></span></div>
      <p class="result-name">${pick}</p>
      <ul><li>${why}</li><li>${motor}</li><li>${extra}</li></ul>
      <div class="acts">
        <a href="#contact" class="btn btn-y" id="useMatch">Talk to us about it</a>
        <button class="btn btn-line" id="redo" type="button">Start over</button>
      </div>
    </div>`;
  $("#redo").addEventListener("click", () => { qi = 0; renderQ(); });
  $("#useMatch").addEventListener("click", () => {
    $("#quoteForm [name=msg]").value = `Boat finder match: ${pick}. ${motor}. ${extra}`;
    $('#quoteForm [value="Boat sales"]').checked = true;
  });
}
renderQ();

// ---------- Payment estimator ----------
const CALC = ["price", "down", "term", "rate"];
function calc() {
  const [price, down, term, rate] = CALC.map((id) => +$("#" + id).value);
  const principal = price * (1 - down / 100);
  const r = rate / 100 / 12;
  const pmt = r ? (principal * r) / (1 - Math.pow(1 + r, -term)) : principal / term;
  $("#oPrice").textContent = fmt$(price);
  $("#oDown").textContent = `${down}% · ${fmt$(price * down / 100)}`;
  $("#oTerm").textContent = `${term} months`;
  $("#oRate").textContent = `${rate.toFixed(2)}%`;
  $("#monthly").textContent = fmt$(pmt);
}
CALC.forEach((id) => $("#" + id).addEventListener("input", calc));
calc();

// ---------- Quote form ----------
const form = $("#quoteForm");
const formMsg = $("#formMsg");
$$("[data-type]").forEach((btn) => btn.addEventListener("click", () => {
  const radio = $(`#quoteForm [value="${btn.dataset.type}"]`);
  if (radio) radio.checked = true;
}));
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let ok = true;
  $$("[required]", form).forEach((el) => {
    const bad = !el.value.trim();
    el.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  if (!ok) { formMsg.textContent = "Add your name and phone so we can reach you."; return; }
  const data = Object.fromEntries(new FormData(form));
  if (!FORM_ENDPOINT) {
    formMsg.innerHTML = `Online requests aren't connected yet. Call <a href="tel:+15742232675">(574) 223-2675</a>.`;
    return;
  }
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    formMsg.textContent = `Thanks, ${data.name.split(" ")[0]}. We'll be in touch soon.`;
  } catch {
    formMsg.innerHTML = `Something went wrong. Call <a href="tel:+15742232675">(574) 223-2675</a>.`;
  }
});
