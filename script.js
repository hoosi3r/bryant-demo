// Bryant Lake & Lawn site interactions and transitions

// Design sample data for the rentals forecast panel. Replace with your own feed.
const SAMPLE = {
  manitou: {
    now: { score: 9, temp: "78°F", wind: "6 mph", sunset: "2h 14m", verdict: "Send it" },
    days: [
      ["Today", 9, "78°F", "6 mph", "5%"], ["Sat", 10, "82°F", "4 mph", "0%"], ["Sun", 8, "80°F", "9 mph", "10%"],
      ["Mon", 6, "74°F", "12 mph", "30%"], ["Tue", 4, "69°F", "15 mph", "60%"], ["Wed", 7, "75°F", "8 mph", "20%"],
      ["Thu", 9, "79°F", "5 mph", "5%"],
    ],
  },
  nyona: {
    now: { score: 8, temp: "77°F", wind: "8 mph", sunset: "2h 15m", verdict: "Send it" },
    days: [
      ["Today", 8, "77°F", "8 mph", "5%"], ["Sat", 10, "81°F", "5 mph", "0%"], ["Sun", 8, "79°F", "9 mph", "10%"],
      ["Mon", 5, "73°F", "13 mph", "35%"], ["Tue", 4, "68°F", "16 mph", "60%"], ["Wed", 7, "75°F", "8 mph", "15%"],
      ["Thu", 9, "78°F", "6 mph", "5%"],
    ],
  },
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const isDesktop = () => innerWidth > 900;

$("#yr").textContent = new Date().getFullYear();

// ---------- Smooth, weighted scrolling (Lenis, if it loaded) ----------
const lenis = !reduceMotion && window.Lenis ? new window.Lenis({ lerp: 0.09 }) : null;

// ---------- Nav ----------
const nav = $("#nav");
const burger = $("#burger");
const links = $("#navLinks");
const setMenu = (open) => {
  links.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
  if (lenis) open ? lenis.stop() : lenis.start();
};
burger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
$$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));

// ---------- Section wipe: yellow panel covers, page jumps, panel lifts away ----------
const wipe = $(".wipe");
function jumpTo(target) {
  // Unpin the stack for a moment (hidden under the wipe) to measure where the section really starts
  document.documentElement.classList.add("measuring");
  const top = target.id === "top" ? 0 : target.getBoundingClientRect().top + scrollY;
  document.documentElement.classList.remove("measuring");
  if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
  else scrollTo({ top, behavior: "instant" });
}
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.classList.contains("skip")) return;
  const hash = a.getAttribute("href");
  e.preventDefault();
  if (hash === "#") return; // placeholder links
  const target = $(hash);
  if (!target) return;
  if (reduceMotion) { jumpTo(target); return; }
  wipe.className = "wipe go";
  setTimeout(() => {
    jumpTo(target);
    wipe.className = "wipe out";
    setTimeout(() => { wipe.className = "wipe"; }, 700);
  }, 560);
});

// ---------- Split headings into words that rise in ----------
function splitWords(el) {
  let wi = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(" "); return; }
          const outer = document.createElement("span");
          const inner = document.createElement("span");
          outer.className = "wd";
          inner.textContent = part;
          inner.style.setProperty("--wi", wi++);
          outer.append(inner);
          frag.append(outer);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
  };
  walk(el);
  el.classList.add("split");
}
$$("main h2, .stack-copy h3, .why-list h3").forEach(splitWords);

// Footer wordmark letters
const footWord = $(".foot-word");
footWord.innerHTML = [...footWord.textContent].map((c, i) => `<span class="ch" style="--ci:${i}">${c}</span>`).join("");

// Photos wipe open
$$(".media").forEach((m) => m.classList.add("reveal"));

// Statement words light up while scrolling
const fill = $("#fillText");
const HIGHLIGHT = new Set(["lake", "life.", "yard."]);
fill.innerHTML = fill.textContent.trim().split(/\s+/)
  .map((w) => `<span class="w${HIGHLIGHT.has(w.toLowerCase()) ? " hl" : ""}">${w}</span>`).join(" ");
const words = $$(".w", fill);

// ---------- Reveal on scroll ----------
$$(".sec-head > p, .facts > div, .stack-copy > :not(h3), .floe-panel > :not(h2), .trailer-copy > :not(h2), .spec, .price-card, .forecast-card, .why-list li, .contact-grid > div > :not(h2), .form")
  .forEach((el, i) => { el.setAttribute("data-reveal", ""); el.style.transitionDelay = `${(i % 4) * 80}ms`; });

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    $$(".count", e.target).forEach(countUp);
    io.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
$$("[data-reveal], .split, .media.reveal, .foot-word").forEach((el) => io.observe(el));

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

// ---------- Scroll-driven motion ----------
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
let velocity = 0;

function sizeWork() {
  work.style.height = isDesktop() ? `${workTrack.scrollWidth - innerWidth + innerHeight}px` : "";
  sizeStack();
}

// ---------- Section stack ----------
const stackSecs = $$(".stack-section");
function sizeStack() {
  const vh = innerHeight;
  stackSecs.forEach((sec) => {
    const h = sec.offsetHeight;
    // Pin when the bottom of the section reaches the bottom of the screen
    sec.style.setProperty("--stick", `${Math.min(0, vh - h)}px`);
    // Shrink toward the middle of the part still on screen
    sec.style.transformOrigin = `50% ${Math.max(h - vh, 0) + Math.min(h, vh) / 2}px`;
  });
}
function updateStack(vh) {
  stackSecs.forEach((sec, i) => {
    const next = stackSecs[i + 1];
    if (!next) return;
    // 0 while the next section is below the screen, 1 once it fully covers this one
    const p = clamp(1 - next.getBoundingClientRect().top / vh);
    sec.style.transform = p > 0 ? `scale(${1 - p * 0.05})` : "";
    sec.style.setProperty("--dim", (p * 0.65).toFixed(3));
  });
}
new ResizeObserver(() => sizeStack()).observe(document.querySelector("main"));

function onScroll() {
  const y = scrollY;
  const vh = innerHeight;
  const vw = innerWidth;

  velocity = y - lastY;
  nav.classList.toggle("solid", y > 60);
  nav.classList.toggle("hide", velocity > 0 && y > vh && !links.classList.contains("open"));
  lastY = y;
  progress.style.transform = `scaleX(${y / (document.documentElement.scrollHeight - vh || 1)})`;
  dockBar.classList.toggle("show", y > vh * 0.9);

  if (!reduceMotion) {
    updateStack(vh);

    const hp = clamp(y / (hero.offsetHeight - vh));
    heroMedia.style.transform = `scale(${1 + hp * 0.3})`;
    heroCopy.style.transform = `translateY(${-hp * 140}px)`;
    heroCopy.style.opacity = 1 - hp * 1.5;

    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const p = clamp(1 - (next.getBoundingClientRect().top - card.getBoundingClientRect().top) / vh);
      card.style.transform = `scale(${1 - p * 0.06})`;
      card.style.filter = `brightness(${1 - p * 0.45})`;
    });

    if (isDesktop()) {
      const r = work.getBoundingClientRect();
      const wp = clamp(-r.top / (r.height - vh));
      workTrack.style.transform = `translateX(${-wp * (workTrack.scrollWidth - vw)}px)`;
    }

    zoomImgs.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      const horizontal = isDesktop() && img.closest(".work-track");
      const p = horizontal ? clamp((vw - r.left) / (vw + r.width)) : clamp((vh - r.top) / (vh + r.height));
      img.style.transform = `scale(${1.2 - p * 0.2})`;
    });

    const tr = ghost.parentElement.getBoundingClientRect();
    ghost.style.transform = `translateX(${(tr.top - vh / 2) * +ghost.dataset.drift}px)`;
  }

  const fr = fill.getBoundingClientRect();
  const lit = Math.round(clamp((vh * 0.85 - fr.top) / (fr.height + vh * 0.35)) * words.length);
  words.forEach((w, i) => w.classList.toggle("on", reduceMotion || i < lit));
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", () => { sizeWork(); onScroll(); });
addEventListener("load", () => { sizeWork(); onScroll(); });
sizeWork();
onScroll();

// ---------- Marquee that speeds up and flips with scroll direction ----------
const marquee = $(".marquee");
const mTrack = $(".marquee-track");
let mx = 0, mDir = -1, mBoost = 0;
if (!reduceMotion) marquee.classList.add("js");

// ---------- Custom cursor + magnetic buttons ----------
const cursor = $(".cursor");
const dot = $(".cursor-dot");
let px = innerWidth / 2, py = innerHeight / 2, cx = px, cy = py;
if (finePointer && !reduceMotion) {
  document.documentElement.classList.add("has-cursor");
  addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; });
  document.addEventListener("pointerover", (e) => {
    const t = e.target;
    cursor.classList.toggle("view", !!t.closest(".shot .media, .stack-card .media, .trailer-media, .floe-media"));
    cursor.classList.toggle("link", !cursor.classList.contains("view") && !!t.closest("a, button, input, select, textarea, label"));
  });
  document.addEventListener("pointerleave", () => { cursor.style.opacity = 0; dot.style.opacity = 0; });
  document.addEventListener("pointerenter", () => { cursor.style.opacity = 1; dot.style.opacity = 1; });

  $$(".btn, .act, .nav-cta, .social-row a, .lake-tabs button").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    el.style.transition = (getComputedStyle(el).transition || "") + ", transform .45s cubic-bezier(.16,1,.3,1)";
  });

  // 3D tilt
  $$(".price-card, .spec, .trailer-media").forEach((el) => {
    el.classList.add("tilt");
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(0)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

// ---------- One animation loop ----------
function loop(t) {
  if (lenis) lenis.raf(t);
  if (!reduceMotion) {
    // marquee
    if (Math.abs(velocity) > 0.5) mDir = velocity > 0 ? -1 : 1;
    mBoost = lerp(mBoost, Math.min(Math.abs(velocity) * 0.6, 18), 0.1);
    velocity *= 0.9;
    const half = mTrack.scrollWidth / 2;
    mx += (0.8 + mBoost) * mDir;
    if (mx <= -half) mx += half;
    if (mx > 0) mx -= half;
    mTrack.style.transform = `translateX(${mx}px) skewX(${-mBoost * 0.6 * -mDir}deg)`;
    // cursor
    cx = lerp(cx, px, 0.16);
    cy = lerp(cy, py, 0.16);
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    dot.style.transform = `translate(${px}px, ${py}px)`;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- Rentals forecast panel (sample data) ----------
const ring = $("#ringFg");
function renderLake(key) {
  const { now, days } = SAMPLE[key];
  $("#scoreNow").textContent = now.score;
  $("#nTemp").textContent = now.temp;
  $("#nWind").textContent = now.wind;
  $("#nSunset").textContent = now.sunset;
  $("#nVerdict").textContent = now.verdict;
  ring.dataset.score = now.score;
  if (ring.dataset.seen) ring.style.strokeDashoffset = 327 * (1 - now.score / 10);
  const best = Math.max(...days.map((d) => d[1]));
  let marked = false;
  $("#forecast").innerHTML = days.map(([label, score, temp, wind, rain], i) => {
    const isBest = !marked && score === best && (marked = true);
    return `<div class="day${isBest ? " best" : ""}" style="--s:${score};--di:${i}">
      <span>${isBest ? "Best" : label}</span><b>${score}</b>
      <small>${isBest ? label + "<br>" : ""}${temp}<br>${wind}<br>${rain} rain</small></div>`;
  }).join("");
}
$$(".lake-tabs button").forEach((tab) => tab.addEventListener("click", () => {
  $$(".lake-tabs button").forEach((b) => b.setAttribute("aria-selected", String(b === tab)));
  renderLake(tab.dataset.lake);
}));
new IntersectionObserver(([e], obs) => {
  if (!e.isIntersecting) return;
  ring.dataset.seen = "1";
  ring.style.strokeDashoffset = 327 * (1 - ring.dataset.score / 10);
  obs.disconnect();
}).observe(ring);
renderLake("manitou");

// ---------- Quote form (design only: shows the sent state) ----------
const form = $("#quoteForm");
const formMsg = $("#formMsg");
$$("[data-service]").forEach((btn) => btn.addEventListener("click", () => {
  $("#serviceSelect").value = btn.dataset.service;
}));
form.addEventListener("submit", (e) => {
  e.preventDefault();
  let ok = true;
  $$("[required]", form).forEach((el) => {
    const bad = !el.value.trim();
    el.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  if (!ok) { formMsg.textContent = "Add your name and a phone or email so we can reach you."; return; }
  formMsg.textContent = "";
  // Hook your own submission here, then show the confirmation:
  form.classList.add("sent");
});
