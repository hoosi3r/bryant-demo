// Bryant Lake & Lawn site interactions

// Optional: a form handler URL (e.g. Formspree). Without one, the form opens an email to EMAIL.
const FORM_ENDPOINT = "";
const EMAIL = "lifttrailers@gmail.com";
// Paste profile links here; each button shows once it has a link.
const SOCIAL = { facebook: "", instagram: "", tiktok: "" };
const TZ = "America/Indiana/Indianapolis";
// Nyona Lake coordinates are approximate; weather is effectively the same across the area.
const LAKES = {
  manitou: { name: "Lake Manitou", lat: 41.0567, lon: -86.19 },
  nyona: { name: "Nyona Lake", lat: 40.975, lon: -86.12 },
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
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

// ---------- Social links ----------
let anySocial = false;
$$("[data-social]").forEach((a) => {
  const url = SOCIAL[a.dataset.social];
  if (url) { a.href = url; anySocial = true; } else a.hidden = true;
});
$("#social").hidden = !anySocial;

// ---------- Scroll-scrubbed word fill ----------
const fill = $("#fillText");
const HIGHLIGHT = new Set(["lake", "life.", "yard."]);
fill.innerHTML = fill.textContent.trim().split(/\s+/)
  .map((w) => `<span class="w${HIGHLIGHT.has(w.toLowerCase()) ? " hl" : ""}">${w}</span>`).join(" ");
const words = $$(".w", fill);

// ---------- Scroll engine ----------
const hero = $(".hero");
const heroMedia = $("#heroMedia");
const heroCopy = $("#heroCopy");
const progress = $("#progress");
const work = $("#work");
const workTrack = $("#workTrack");
const cards = $$(".stack-card");
const ghost = $(".ghost-word");
const dockBar = $(".dock-bar");
const zoomImgs = $$(".media img");
let lastY = scrollY;

function sizeWork() {
  work.style.height = isDesktop() ? `${workTrack.scrollWidth - innerWidth + innerHeight}px` : "";
}

function frame() {
  const y = scrollY;
  const vh = innerHeight;
  const vw = innerWidth;

  nav.classList.toggle("solid", y > 60);
  nav.classList.toggle("hide", y > lastY && y > vh && !links.classList.contains("open"));
  lastY = y;
  progress.style.transform = `scaleX(${y / (document.documentElement.scrollHeight - vh || 1)})`;
  dockBar.classList.toggle("show", y > vh * 0.9);

  if (!reduceMotion) {
    // Hero: photo pushes in, copy lifts away
    const hp = clamp(y / (hero.offsetHeight - vh));
    heroMedia.style.transform = `scale(${1 + hp * 0.3})`;
    heroCopy.style.transform = `translateY(${-hp * 140}px)`;
    heroCopy.style.opacity = 1 - hp * 1.5;

    // Service cards: each one sinks back as the next slides over it
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const p = clamp(1 - (next.getBoundingClientRect().top - card.getBoundingClientRect().top) / vh);
      card.style.transform = `scale(${1 - p * 0.06})`;
      card.style.filter = `brightness(${1 - p * 0.45})`;
    });

    // Gallery: vertical scroll drives the horizontal track
    if (isDesktop()) {
      const r = work.getBoundingClientRect();
      const wp = clamp(-r.top / (r.height - vh));
      workTrack.style.transform = `translateX(${-wp * (workTrack.scrollWidth - vw)}px)`;
    }

    // Photos ease from zoomed-in to resting as they travel through the viewport
    zoomImgs.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      const horizontal = isDesktop() && img.closest(".work-track");
      const p = horizontal ? clamp((vw - r.left) / (vw + r.width)) : clamp((vh - r.top) / (vh + r.height));
      img.style.transform = `scale(${1.2 - p * 0.2})`;
    });

    // "PATENTED" drifts sideways behind the lift trailer
    const tr = ghost.parentElement.getBoundingClientRect();
    ghost.style.transform = `translateX(${(tr.top - vh / 2) * +ghost.dataset.drift}px)`;
  }

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
addEventListener("resize", () => { sizeWork(); requestFrame(); });
addEventListener("load", () => { sizeWork(); requestFrame(); });
sizeWork();
frame();

// ---------- Reveal on scroll + counters ----------
$$(".sec-head, .facts > div, .stack-copy > *, .floe-panel > *, .trailer-copy > *, .spec, .price-card, .forecast-card, .why-list li, .contact-grid > *")
  .forEach((el, i) => { el.setAttribute("data-reveal", ""); el.style.transitionDelay = `${(i % 4) * 80}ms`; });

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    $$(".count", e.target).forEach(countUp);
    io.unobserve(e.target);
  });
}, { threshold: 0.12 });
$$("[data-reveal]").forEach((el) => io.observe(el));

function countUp(el) {
  if (reduceMotion) return;
  const end = +el.dataset.to;
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / 1600, 1);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- Lake forecast (Open-Meteo, no key needed) ----------
const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const CLOCK = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const cache = {};
let sunset = null;

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

async function getLake(key) {
  if (cache[key]) return cache[key];
  const { lat, lon } = LAKES[key];
  const url = "https://api.open-meteo.com/v1/forecast"
    + `?latitude=${lat}&longitude=${lon}&timezone=${encodeURIComponent(TZ)}`
    + "&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7"
    + "&current=temperature_2m,wind_speed_10m,precipitation,weather_code"
    + "&daily=temperature_2m_max,wind_speed_10m_max,precipitation_probability_max,weather_code,sunset";
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.status);
  return (cache[key] = await res.json());
}

function tickSunset() {
  if (!sunset) return;
  const mins = Math.round((sunset - Date.now()) / 60000);
  $("#nSunset").textContent = mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "After dark";
}
setInterval(tickSunset, 60000);

async function showLake(key) {
  try {
    const d = await getLake(key);
    const c = d.current;
    const offset = d.utc_offset_seconds * 1000;
    const nowScore = lakeScore({ temp: c.temperature_2m, wind: c.wind_speed_10m, rain: c.precipitation > 0 ? 80 : 0, code: c.weather_code });
    sunset = new Date(Date.parse(d.daily.sunset[0] + "Z") - offset);

    if (key === "manitou") {
      $("#tTemp").textContent = `${Math.round(c.temperature_2m)}°F`;
      $("#tWind").textContent = `${Math.round(c.wind_speed_10m)} mph`;
      $("#tSunset").textContent = CLOCK.format(sunset);
      $("#tScore").textContent = `${nowScore}/10`;
    }
    $("#scoreNow").textContent = nowScore;
    $("#nTemp").textContent = `${Math.round(c.temperature_2m)}°F`;
    $("#nWind").textContent = `${Math.round(c.wind_speed_10m)} mph`;
    $("#nVerdict").textContent = verdict(nowScore);
    $("#ringFg").dataset.score = nowScore;
    if ($("#ringFg").dataset.seen) $("#ringFg").style.strokeDashoffset = 327 * (1 - nowScore / 10);
    tickSunset();

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
        <span>${day === best ? "Best" : day.label}</span>
        <b>${day.score}</b>
        <small>${day === best ? day.label + "<br>" : ""}${Math.round(day.temp)}°F<br>${Math.round(day.wind)} mph<br>${day.rain}% rain</small>
      </div>`).join("");
  } catch {
    $("#heroTicker").hidden = true;
    $("#lakeNow").hidden = true;
    $("#forecast").hidden = true;
    $(".fc-title").hidden = true;
    $("#lakeErr").hidden = false;
  }
}

$$(".lake-tabs button").forEach((tab) => tab.addEventListener("click", () => {
  $$(".lake-tabs button").forEach((b) => b.setAttribute("aria-selected", String(b === tab)));
  showLake(tab.dataset.lake);
}));
new IntersectionObserver(([e], obs) => {
  if (!e.isIntersecting) return;
  const ring = $("#ringFg");
  ring.dataset.seen = "1";
  if (ring.dataset.score) ring.style.strokeDashoffset = 327 * (1 - ring.dataset.score / 10);
  obs.disconnect();
}).observe($("#ringFg"));
showLake("manitou");

// ---------- Quote form ----------
const form = $("#quoteForm");
const formMsg = $("#formMsg");
$$("[data-service]").forEach((btn) => btn.addEventListener("click", () => {
  $("#serviceSelect").value = btn.dataset.service;
}));
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let ok = true;
  $$("[required]", form).forEach((el) => {
    const bad = !el.value.trim();
    el.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  if (!ok) { formMsg.textContent = "Add your name and a phone or email so we can reach you."; return; }
  const data = Object.fromEntries(new FormData(form));

  if (!FORM_ENDPOINT) {
    const body = [
      `Name: ${data.name}`, `Phone/email: ${data.contact}`, `Address: ${data.address}`,
      `Lake/service area: ${data.lake}`, `Service: ${data.service}`, "", data.msg,
    ].join("\n");
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Quote request: ${data.service || "General"}`)}&body=${encodeURIComponent(body)}`;
    formMsg.innerHTML = `Your email app should open with the request filled in. Faster? <a href="sms:+15747211811">Text Brady</a>.`;
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
    formMsg.innerHTML = `Something went wrong. Call or text Brady at <a href="tel:+15747211811">574-721-1811</a>.`;
  }
});
