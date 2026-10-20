// Rochester Boat Company site interactions

// Set to a form handler URL (e.g. Formspree) to receive quote requests by email.
const FORM_ENDPOINT = "";
// Lake Manitou, Rochester IN
const LAKE = { lat: 41.0567, lon: -86.1900 };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt$ = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

$("#yr").textContent = new Date().getFullYear();

// Nav: solid on scroll, mobile menu
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const burger = $("#burger");
const links = $("#navLinks");
const setMenu = (open) => {
  links.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
};
burger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
$$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));

// Reveal on scroll + count-up stats
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    const num = $("[data-count]", e.target);
    if (num) countUp(num);
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });
$$(".reveal").forEach((el) => io.observe(el));

function countUp(el) {
  const end = +el.dataset.count;
  const start = end > 1000 ? end - 60 : 0;
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / 1400, 1);
    el.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Boat filters
$$(".chip").forEach((chip) => chip.addEventListener("click", () => {
  $$(".chip").forEach((c) => { c.classList.remove("active"); c.setAttribute("aria-selected", "false"); });
  chip.classList.add("active");
  chip.setAttribute("aria-selected", "true");
  const f = chip.dataset.filter;
  $$("#boatCards .card").forEach((card) => card.classList.toggle("hide", f !== "all" && card.dataset.brand !== f));
}));

// Boat finder quiz
const questions = [
  { key: "crew", q: "Who's usually aboard?", opts: [
    ["small", "Just a couple of us", "2–4 people"],
    ["family", "The family", "5–8 people"],
    ["crowd", "The whole crew", "9+ people"],
    ["fish", "Me and my rods", "Fishing first"],
  ] },
  { key: "vibe", q: "Your perfect day on the lake?", opts: [
    ["cruise", "Sunset cruise", "Slow and easy"],
    ["sport", "Tubing & skiing", "Bring the power"],
    ["sandbar", "Sandbar hangout", "Lounge all day"],
    ["mix", "A bit of everything", "Do it all"],
  ] },
  { key: "budget", q: "Where's your budget landing?", opts: [
    ["entry", "Smart value", "Get on the water"],
    ["mid", "Mid-range", "Comfort + features"],
    ["premium", "Premium", "Best of the best"],
    ["unsure", "Not sure yet", "Help me figure it out"],
  ] },
  { key: "storage", q: "Where will it live?", opts: [
    ["lift", "On my lift", "Lakefront property"],
    ["need", "Need a lift & dock", "Let's set it up"],
    ["trailer", "On a trailer", "Launch as I go"],
    ["store", "Store it for me", "Full-service"],
  ] },
];
const answers = {};
let qi = 0;
const quiz = $("#quiz");
const prog = $("#qProg");

function renderQ() {
  prog.style.width = `${(qi / questions.length) * 100}%`;
  if (qi >= questions.length) return renderResult();
  const { q, opts, key } = questions[qi];
  quiz.innerHTML = `
    <div class="fade-in">
      <p class="qn">Question ${qi + 1} of ${questions.length}</p>
      <h3>${q}</h3>
      <div class="opts">${opts.map(([v, t, s]) => `<button class="opt" data-v="${v}">${t}<small>${s}</small></button>`).join("")}</div>
    </div>`;
  $$(".opt", quiz).forEach((b) => b.addEventListener("click", () => { answers[key] = b.dataset.v; qi++; renderQ(); }));
}

function renderResult() {
  const { crew, vibe, budget, storage } = answers;
  let pick, why;
  if (budget === "premium" || (vibe === "sport" && crew === "crowd")) {
    pick = "Crest Caribbean or Savannah"; why = "Tri-toon stability and big horsepower for a full boat that still pulls a tuber.";
  } else if (budget === "entry" || crew === "fish") {
    pick = "Bentley Navigator or Legacy"; why = "Easy to own and easy on the wallet, with fishing layouts available.";
  } else if (vibe === "sport") {
    pick = "Crest Continental or Bentley Elite"; why = "A performance package and tri-toon option give you real ski-and-tube power.";
  } else if (crew === "crowd" || vibe === "sandbar") {
    pick = "Crest Continental"; why = "Room to spread out, lounge seating, and a ride that stays comfortable all day.";
  } else {
    pick = "Crest Classic or Bentley Elite"; why = "The sweet spot of comfort, features and value for most families on Lake Manitou.";
  }
  const motor = vibe === "sport" || budget === "premium" ? "Higher-horsepower Mercury or Suzuki outboard" : "Efficient mid-range Mercury or Suzuki four-stroke";
  const extra = {
    lift: "We'll check that your current lift fits the new boat.",
    need: "Pair it with a ShoreStation lift and dock. We'll install it in spring and pull it in fall.",
    trailer: "Ask about a matched trailer package.",
    store: "Add winterization and off-season storage, ready when the ice is off.",
  }[storage];

  quiz.innerHTML = `
    <div class="result fade-in">
      <p class="qn">Your match</p>
      <div class="big">${pick}</div>
      <ul><li>${why}</li><li>${motor}</li><li>${extra}</li></ul>
      <div class="actions">
        <a href="#quote" class="btn" id="useMatch">Talk to us about this</a>
        <button class="btn btn-ghost" id="redo" type="button">Start over</button>
      </div>
    </div>`;
  $("#redo").addEventListener("click", () => { qi = 0; renderQ(); });
  $("#useMatch").addEventListener("click", () => {
    const msg = $("#quoteForm [name=msg]");
    msg.value = `Boat finder match: ${pick}. ${motor}. ${extra}`;
  });
}
renderQ();

// Payment calculator
const calcIds = ["price", "down", "term", "rate"];
function calc() {
  const [price, down, term, rate] = calcIds.map((id) => +$("#" + id).value);
  const principal = price * (1 - down / 100);
  const r = rate / 100 / 12;
  const pmt = r ? (principal * r) / (1 - Math.pow(1 + r, -term)) : principal / term;
  $("#oPrice").textContent = fmt$(price);
  $("#oDown").textContent = `${down}% (${fmt$(price * down / 100)})`;
  $("#oTerm").textContent = `${term} mo`;
  $("#oRate").textContent = `${rate.toFixed(2)}%`;
  $("#monthly").textContent = fmt$(pmt);
}
calcIds.forEach((id) => $("#" + id).addEventListener("input", calc));
calc();

// Lift demo
const liftViz = $(".lift-viz");
const liftBtn = $("#liftBtn");
liftBtn.addEventListener("click", () => {
  const down = liftViz.classList.toggle("down");
  liftBtn.textContent = down ? "Raise boat" : "Lower boat";
  liftBtn.setAttribute("aria-pressed", String(!down));
});

// Service card glow follows cursor
$$(".svc").forEach((card) => card.addEventListener("pointermove", (e) => {
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${e.clientX - r.left}px`);
  card.style.setProperty("--my", `${e.clientY - r.top}px`);
}));

// Season timeline: highlight current month
const month = new Date().getMonth() + 1;
const nowTl = $$(".tl").find((tl) => tl.dataset.m.split(",").map(Number).includes(month));
if (nowTl) {
  nowTl.classList.add("now");
  const tips = {
    "Spring prep": "Right now: book spring service and get on the install list before it fills up.",
    "Install": "Right now: install season. Call to lock in your dock and lift date.",
    "Lake season": "Right now: peak season. Need service? We prioritize getting you back on the water.",
    "Pull-out": "Right now: pull-out season. Schedule dock and lift removal plus winterization.",
    "Storage & shop": "Right now: storage season, and the best time to shop for next year's boat.",
  };
  $("#nowNote").textContent = tips[$("h4", nowTl).textContent.replace("&amp;", "&")] || "";
}

// Live lake conditions (Open-Meteo, no key needed)
(async () => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAKE.lat}&longitude=${LAKE.lon}&current=temperature_2m,wind_speed_10m,precipitation,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const { current: c } = await res.json();
    const t = Math.round(c.temperature_2m);
    const w = Math.round(c.wind_speed_10m);
    let score = 10;
    if (t < 60) score -= Math.min(5, Math.ceil((60 - t) / 5));
    if (t > 92) score -= 2;
    if (w > 10) score -= Math.min(4, Math.ceil((w - 10) / 4));
    if (c.precipitation > 0) score -= 3;
    if (c.weather_code >= 95) score = 1;
    score = Math.max(1, score);
    $("#cTemp").textContent = `${t}°F`;
    $("#cWind").textContent = `${w} mph`;
    $("#cScore").textContent = `${score}/10`;
  } catch {
    $("#conditions").hidden = true;
  }
})();

// Quote form
const form = $("#quoteForm");
const formMsg = $("#formMsg");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let ok = true;
  $$("[required]", form).forEach((el) => {
    const bad = !el.value.trim();
    el.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  formMsg.classList.remove("err");
  if (!ok) {
    formMsg.classList.add("err");
    formMsg.textContent = "Please add your name and phone so we can reach you.";
    return;
  }
  const data = Object.fromEntries(new FormData(form));
  if (!FORM_ENDPOINT) {
    formMsg.classList.add("err");
    formMsg.innerHTML = `Online requests aren't connected yet. Please call <a href="tel:+15742232675">(574) 223-2675</a>.`;
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
    formMsg.textContent = `Thanks, ${data.name.split(" ")[0]}! We'll be in touch soon.`;
  } catch {
    formMsg.classList.add("err");
    formMsg.innerHTML = `Something went wrong. Please call <a href="tel:+15742232675">(574) 223-2675</a>.`;
  }
});
