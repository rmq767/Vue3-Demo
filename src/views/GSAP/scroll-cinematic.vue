<template>
  <div ref="pageRef" class="helios">
    <canvas ref="starCanvas" class="starfield" aria-hidden="true"></canvas>
    <div ref="cursorGlow" class="cursor-glow" aria-hidden="true"></div>
    <div class="grain" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>

    <header class="hud">
      <button class="hud__brand" type="button" aria-label="回到页面顶部" @click="scrollToTop">
        <svg class="brand-mark" viewBox="0 0 28 28" aria-hidden="true">
          <circle cx="14" cy="14" r="4.5" />
          <ellipse cx="14" cy="14" rx="12" ry="5.2" transform="rotate(-24 14 14)" />
          <circle cx="25.3" cy="8.7" r="1.2" class="brand-mark__sat" />
        </svg>
        <span class="brand-name">HELIOS</span>
        <span class="brand-divider" aria-hidden="true"></span>
        <span class="brand-sub">A SCROLL STUDY</span>
      </button>

      <div class="hud__meta">
        <span>N 36°12′ / E 118°08′</span>
        <span>SOL / 001</span>
        <span class="hud__live"><i aria-hidden="true"></i>LIVE</span>
      </div>
    </header>

    <div class="progress-track" aria-hidden="true">
      <span ref="progressFill" class="progress-fill"></span>
    </div>

    <nav class="chapter-nav" aria-label="章节导航">
      <button
        v-for="chapter in chapters"
        :key="chapter.id"
        type="button"
        class="chapter-nav__item"
        :class="{ 'is-active': activeChapter === chapter.id }"
        :aria-label="`${chapter.index} ${chapter.cn} ${chapter.label}`"
        :aria-current="activeChapter === chapter.id ? 'true' : undefined"
        @click="goToChapter(chapter.id)"
      >
        <span class="chapter-nav__index">{{ chapter.index }}</span>
        <span class="chapter-nav__dot" aria-hidden="true"></span>
        <span class="chapter-nav__label">
          {{ chapter.cn }} <i>{{ chapter.label }}</i>
        </span>
      </button>
    </nav>

    <aside class="chrome-readout" aria-hidden="true">
      <span>SCROLL</span>
      <span ref="progressPercent" class="chrome-readout__num">000</span>
      <span class="chrome-readout__line"></span>
      <span>100</span>
    </aside>
    <aside class="chrome-note" aria-hidden="true">LIGHT SPEED / 299 792 458 M·S⁻¹</aside>

    <main>
      <section
        id="chapter-origin"
        ref="originSection"
        class="chapter chapter--origin"
        aria-labelledby="origin-title"
      >
        <div class="origin__grid" aria-hidden="true"></div>

        <div class="origin__sun-wrap" aria-hidden="true">
          <div class="origin__sun">
            <div class="origin__sun-body"></div>
            <span class="origin__sun-orbit origin__sun-orbit--a"></span>
            <span class="origin__sun-orbit origin__sun-orbit--b"></span>
          </div>
        </div>

        <div class="origin__inner">
          <p class="eyebrow origin__eyebrow">
            <span class="eyebrow__dot" aria-hidden="true"></span>
            GSAP × SCROLLTRIGGER
            <span>/</span>
            001
          </p>

          <div class="origin__headline">
            <h1 id="origin-title" class="hero-title" aria-label="HELIOS">
              <span
                v-for="(letter, index) in titleLetters"
                :key="letter + index"
                class="hero-title__mask"
                :class="{ 'hero-title__mask--accent': index === 3 }"
                aria-hidden="true"
              >
                <span class="hero-title__letter">
                  <span class="hero-title__char">{{ letter }}</span>
                </span>
              </span>
            </h1>
            <span class="hero-title__caption" aria-hidden="true">LIGHT / GRAVITY / SILENCE</span>
          </div>

          <div class="origin__subline">
            <div class="origin__tagline">
              <div class="origin__tagline-inner">
                <p class="tagline-cn">向着最后一束光</p>
                <p class="tagline-en">TOWARD THE LAST LIGHT</p>
              </div>
            </div>

            <div class="origin__meta">
              <div class="meta__item">
                <span>JOURNEY</span>
                <strong>HELIOS / 001</strong>
              </div>
              <div class="meta__item">
                <span>DISTANCE</span>
                <strong>149.6M KM</strong>
              </div>
              <div class="meta__item">
                <span>STATUS</span>
                <strong>SCROLL TO IGNITE <i aria-hidden="true">↓</i></strong>
              </div>
            </div>
          </div>
        </div>

        <div class="origin__shade" aria-hidden="true"></div>
        <div class="origin__scroll-cue" aria-hidden="true"><span></span>SCROLL</div>
      </section>

      <section
        id="manifesto"
        ref="manifestoSection"
        class="manifesto"
        aria-labelledby="manifesto-title"
      >
        <div class="marquee" aria-hidden="true">
          <div class="marquee__row">
            <div class="marquee__track marquee__track--solid">
              <template v-for="copy in 2" :key="`solid-${copy}`">
                <span>LIGHT IS A DISTANCE</span>
                <i class="marquee__sep">✦</i>
                <span class="marquee__cn">光是一种距离</span>
                <i class="marquee__sep">✦</i>
                <span>299 792 458 M/S</span>
                <i class="marquee__sep">✦</i>
              </template>
            </div>
          </div>
          <div class="marquee__row marquee__row--outline">
            <div class="marquee__track marquee__track--outline">
              <template v-for="copy in 2" :key="`outline-${copy}`">
                <span>TOWARD THE LAST LIGHT</span>
                <i class="marquee__sep">✦</i>
                <span class="marquee__cn">向着最后一束光</span>
                <i class="marquee__sep">✦</i>
              </template>
            </div>
          </div>
        </div>

        <div class="manifesto__body">
          <aside class="manifesto__aside">
            <span class="section-tag">PROLOGUE / 00</span>
            <p class="manifesto__note">一段由滚动<br />驱动的光的叙事。</p>
            <div class="manifesto__scale" aria-hidden="true">
              <span>0 M</span>
              <i></i>
              <span>∞</span>
            </div>
          </aside>

          <div class="manifesto__content">
            <h2 id="manifesto-title" class="manifesto__statement">
              <span class="manifesto__line"><span>我们由星尘构成，</span></span>
              <span class="manifesto__line"><span>也终将回到<em class="accent">光</em>里。</span></span>
              <span class="manifesto__line"><span>此刻的每一次滚动，</span></span>
              <span class="manifesto__line"><span>都是一次微小的迁徙。</span></span>
            </h2>

            <div class="manifesto__meta-row">
              <p>
                一场从地表出发，穿过引力与寂静，最终抵达黎明的滚动实验。光行进了 8 分
                20 秒，你只需要向下。
              </p>
              <div class="manifesto__facts">
                <div><span>SCROLL TIME</span><strong>03:24</strong></div>
                <div><span>FRAMES</span><strong>∞</strong></div>
                <div><span>ENGINE</span><strong>GSAP</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="chapter-gravity"
        ref="gravitySection"
        class="chapter chapter--gravity"
        aria-labelledby="gravity-title"
      >
        <div ref="gravityStage" class="gravity__stage">
          <div class="gravity__ghost" aria-hidden="true">GRAVITY</div>

          <div class="gravity__copy">
            <span class="section-tag">ACT 01 / GRAVITY</span>
            <h2 id="gravity-title" class="gravity__title">
              <span class="gravity__line"><span>不可逃离的</span></span>
              <span class="gravity__line gravity__line--accent">
                <span>引 力</span>
                <em>GRAVITY WELL</em>
              </span>
            </h2>
            <p class="gravity__desc">
              越靠近太阳，轨道就越像一道无法回头的决定。时间在这里被拉长，而远方的家乡，开始变成一束微弱的回波。
            </p>

            <div class="gravity__stats">
              <div>
                <span>VELOCITY</span>
                <strong>617.7<em>KM/S</em></strong>
              </div>
              <div>
                <span>DISTANCE LEFT</span>
                <strong><span ref="distanceValue">24.6</span><em>M KM</em></strong>
              </div>
              <div>
                <span>TIME DILATION</span>
                <strong>+0.007<em>%</em></strong>
              </div>
            </div>

            <div class="gravity__rule" aria-hidden="true"></div>
            <span class="gravity__hint">KEEP SCROLLING / 持续滚动</span>
          </div>

          <div class="gravity__system" aria-hidden="true">
            <span class="system__halo"></span>
            <span class="system__axis system__axis--x"></span>
            <span class="system__axis system__axis--y"></span>

            <div class="system__orbit system__orbit--a">
              <div class="system__spin system__spin--a">
                <span class="system__sat"></span>
              </div>
            </div>
            <div class="system__orbit system__orbit--b">
              <div class="system__spin system__spin--b">
                <span class="system__sat system__sat--alt"></span>
              </div>
            </div>

            <div class="system__dial">
              <span class="system__dial-ring"></span>
            </div>

            <div class="system__core">
              <span class="system__core-light"></span>
              <span class="system__core-label">SOL</span>
            </div>

            <span class="system__label system__label--a">PERIHELION / 近日点</span>
            <span class="system__label system__label--b">Δv / 24.6</span>
            <span class="system__index">01</span>
          </div>

          <div class="gravity__foot" aria-hidden="true">
            <span>FIG. 01 — GRAVITATIONAL CAPTURE</span>
            <span>N 36°12′ / E 118°08′</span>
          </div>
        </div>
      </section>

      <section
        id="chapter-transit"
        ref="transitSection"
        class="chapter chapter--transit"
        aria-labelledby="transit-title"
      >
        <div ref="transitStage" class="transit__stage">
          <header class="transit__header">
            <span class="section-tag">ACT 02 / TRANSIT</span>
            <div class="transit__header-mid">
              <span>横向章节</span>
              <strong>穿过寂静，触碰日冕</strong>
            </div>
            <span class="transit__count">03 SCENES / HORIZONTAL</span>
          </header>

          <div class="transit__viewport">
            <div ref="transitTrack" class="transit__track">
              <div class="transit__lead">
                <span class="transit__lead-index" aria-hidden="true">02</span>
                <h2 id="transit-title">横 向<br /><span>穿 越</span></h2>
                <p>继续滚动。接下来的风景，不在下方，而在右侧。</p>
                <span class="transit__lead-hint">SCROLL → SIDEWAYS</span>
              </div>

              <article
                v-for="card in transitCards"
                :key="card.index"
                class="transit__card"
                :class="`transit__card--${card.variant}`"
              >
                <div class="card__visual" aria-hidden="true">
                  <span class="card__ghost">{{ card.en }}</span>
                  <span class="card__halo"></span>
                  <span class="card__ring card__ring--a"></span>
                  <span class="card__ring card__ring--b"></span>
                  <span class="card__ring card__ring--c"></span>
                  <span class="card__bead"></span>
                  <span class="card__scan"></span>
                </div>

                <div class="card__top">
                  <span class="card__index">{{ card.index }}</span>
                  <span class="card__tag">{{ card.tag }}</span>
                </div>

                <div class="card__copy">
                  <span class="card__en">{{ card.en }}</span>
                  <h3>{{ card.cn }}</h3>
                  <p>{{ card.desc }}</p>
                  <span class="card__meta">{{ card.meta }}</span>
                </div>
              </article>
            </div>
          </div>

          <footer class="transit__footer">
            <div class="transit__progress" aria-hidden="true">
              <span ref="transitProgress" class="transit__progress-fill"></span>
            </div>
            <span>SCROLL TO EXPLORE</span>
            <span>CONTINUE ↓</span>
          </footer>
        </div>
      </section>

      <section
        id="chapter-dawn"
        ref="dawnSection"
        class="chapter chapter--dawn"
        aria-labelledby="dawn-title"
      >
        <div ref="dawnStage" class="dawn__stage">
          <div class="dawn__copy">
            <span class="section-tag">ACT 03 / ARRIVAL</span>
            <h2 id="dawn-title" class="dawn__title">
              <span>抵达</span>
              <span class="dawn__title-accent">黎明</span>
            </h2>
            <p>
              当你抵达光的边缘，旅程并没有结束。<br />
              它只是从「距离」，变成了「温度」。
            </p>
            <span class="dawn__hint"><i aria-hidden="true"></i>继续滚动，让光穿过</span>
          </div>

          <div class="dawn__sun" aria-hidden="true"><span></span></div>

          <div ref="dawnReveal" class="dawn__reveal">
            <div class="dawn__reveal-inner" :inert="finaleReady ? undefined : true">
              <span class="dawn__reveal-tag">JOURNEY COMPLETE / 03</span>
              <p class="dawn__final">
                光没有终点，<br />
                它只是换了一种方式，<br />
                <em>继续旅行。</em>
              </p>
              <div class="dawn__actions">
                <button class="dawn__cta" type="button" @click="restartExperience">
                  <span>再穿越一次</span>
                  <span aria-hidden="true">↺</span>
                </button>
                <router-link class="dawn__cta dawn__cta--ghost" to="/home">返回目录</router-link>
              </div>
              <div class="dawn__reveal-footer">
                <span>HELIOS / A GSAP SCROLL STUDY</span>
                <span>BUILT WITH SCROLLTRIGGER</span>
                <span>2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    <div ref="curtainRef" class="curtain" aria-hidden="true"></div>
  </div>
</template>

<script lang="ts">
export default { name: "ScrollCinematic" };
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  { id: "origin", index: "00", label: "PROLOGUE", cn: "序曲" },
  { id: "gravity", index: "01", label: "GRAVITY", cn: "引力" },
  { id: "transit", index: "02", label: "TRANSIT", cn: "穿越" },
  { id: "dawn", index: "03", label: "DAWN", cn: "黎明" },
] as const;

type ChapterId = (typeof chapters)[number]["id"];

const transitCards = [
  {
    index: "02.1",
    en: "SILENCE",
    cn: "穿过寂静",
    tag: "NO SIGNAL",
    desc: "无线电只剩宇宙底噪。没有风，没有回声，只有光在身后安静地退场。",
    meta: "DISTANCE / 18.2M KM",
    variant: "silence",
  },
  {
    index: "02.2",
    en: "DRIFT",
    cn: "失去重量",
    tag: "ZERO G",
    desc: "身体先于意识失重。地平线折成一条细线，时间悬停在两次呼吸之间。",
    meta: "GRAVITY / 0.03 G",
    variant: "drift",
  },
  {
    index: "02.3",
    en: "CORONA",
    cn: "触碰日冕",
    tag: "1,200,000 °C",
    desc: "温度先抵达，光后抵达。你终于看见恒星最外层那圈缓慢燃烧的金色边缘。",
    meta: "SURFACE / 5,800 K",
    variant: "corona",
  },
];

const titleLetters = "HELIOS".split("");
const activeChapter = ref<ChapterId>("origin");
const finaleReady = ref(false);

const pageRef = ref<HTMLDivElement | null>(null);
const starCanvas = ref<HTMLCanvasElement | null>(null);
const cursorGlow = ref<HTMLDivElement | null>(null);
const curtainRef = ref<HTMLDivElement | null>(null);
const progressFill = ref<HTMLSpanElement | null>(null);
const progressPercent = ref<HTMLSpanElement | null>(null);
const originSection = ref<HTMLElement | null>(null);
const manifestoSection = ref<HTMLElement | null>(null);
const gravitySection = ref<HTMLElement | null>(null);
const gravityStage = ref<HTMLDivElement | null>(null);
const transitSection = ref<HTMLElement | null>(null);
const transitStage = ref<HTMLDivElement | null>(null);
const transitTrack = ref<HTMLDivElement | null>(null);
const transitProgress = ref<HTMLSpanElement | null>(null);
const dawnSection = ref<HTMLElement | null>(null);
const dawnStage = ref<HTMLDivElement | null>(null);
const dawnReveal = ref<HTMLDivElement | null>(null);
const distanceValue = ref<HTMLSpanElement | null>(null);

const chapterStarts = new Map<ChapterId, number>();
const cleanupTasks: Array<() => void> = [];
let starRaf = 0;
let chromeContext: gsap.Context | null = null;
let motion: ReturnType<typeof gsap.matchMedia> | null = null;
let restarting = false;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const q = (selector: string) => pageRef.value!.querySelector<HTMLElement>(selector)!;
const qa = (selector: string) =>
  gsap.utils.toArray<HTMLElement>(selector, pageRef.value!);

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
};

const goToChapter = (id: ChapterId) => {
  const fallback = document.getElementById(`chapter-${id}`)?.offsetTop ?? 0;
  window.scrollTo({
    top: chapterStarts.get(id) ?? fallback,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
};

const restartExperience = () => {
  const curtain = curtainRef.value;
  if (restarting) return;

  if (!curtain || prefersReducedMotion()) {
    window.scrollTo({ top: 0, behavior: "auto" });
    ScrollTrigger.refresh();
    return;
  }

  restarting = true;
  gsap
    .timeline({
      onComplete: () => {
        restarting = false;
      },
    })
    .set(curtain, { visibility: "visible" })
    .fromTo(curtain, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.inOut" })
    .add(() => {
      window.scrollTo(0, 0);
      ScrollTrigger.update();
    })
    .to(curtain, { opacity: 0, duration: 0.7, ease: "power2.out" }, "+=0.18")
    .set(curtain, { visibility: "hidden" });
};

const initStarfield = () => {
  const canvas = starCanvas.value;
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let scrollY = window.scrollY;
  let stars: Array<{
    x: number;
    y: number;
    depth: number;
    radius: number;
    phase: number;
    speed: number;
    alpha: number;
    warm: boolean;
  }> = [];

  const build = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(210, Math.max(80, Math.round((width * height) / 13000)));
    stars = Array.from({ length: count }, () => {
      const depth = 0.25 + Math.random() * 0.75;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        depth,
        radius: (0.35 + Math.random() * 1.1) * (0.75 + depth * 0.5),
        phase: Math.random() * Math.PI * 2,
        speed: 0.12 + Math.random() * 0.4,
        alpha: 0.22 + Math.random() * 0.68,
        warm: Math.random() > 0.88,
      };
    });
  };

  const handlePointer = (event: PointerEvent) => {
    targetX = event.clientX / window.innerWidth - 0.5;
    targetY = event.clientY / window.innerHeight - 0.5;
  };
  const handleScroll = () => {
    scrollY = window.scrollY;
  };

  const render = (now: number) => {
    const reduce = reduceQuery.matches;
    const time = now * 0.001;
    context.clearRect(0, 0, width, height);
    pointerX += (targetX - pointerX) * 0.045;
    pointerY += (targetY - pointerY) * 0.045;

    for (const star of stars) {
      const drift = reduce ? 0 : Math.sin(time * star.speed + star.phase) * 2.4;
      const x = ((star.x + drift + pointerX * star.depth * 20) % width + width) % width;
      const y =
        ((star.y - scrollY * 0.035 * star.depth + pointerY * star.depth * 16) % height + height) %
        height;
      const twinkle = reduce ? 1 : 0.62 + 0.38 * Math.sin(time * (0.55 + star.speed) + star.phase);
      context.globalAlpha = Math.max(0.08, star.alpha * twinkle);
      context.fillStyle = star.warm ? "rgba(255, 143, 61, 1)" : "rgba(244, 237, 222, 1)";
      context.beginPath();
      context.arc(x, y, star.radius, 0, Math.PI * 2);
      context.fill();

      if (star.radius > 1.35 && !reduce) {
        context.globalAlpha *= 0.45;
        context.fillRect(x - star.radius * 3.4, y - 0.35, star.radius * 6.8, 0.7);
      }
    }

    context.globalAlpha = 1;
    starRaf = requestAnimationFrame(render);
  };

  build();
  window.addEventListener("resize", build);
  window.addEventListener("pointermove", handlePointer, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  starRaf = requestAnimationFrame(render);

  cleanupTasks.push(() => {
    cancelAnimationFrame(starRaf);
    window.removeEventListener("resize", build);
    window.removeEventListener("pointermove", handlePointer);
    window.removeEventListener("scroll", handleScroll);
  });
};

const initPointerGlow = () => {
  const glow = cursorGlow.value;
  if (!glow || prefersReducedMotion() || window.matchMedia("(hover: none)").matches) return;

  gsap.set(glow, {
    xPercent: -50,
    yPercent: -50,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const moveX = gsap.quickTo(glow, "x", { duration: 0.65, ease: "power3" });
  const moveY = gsap.quickTo(glow, "y", { duration: 0.65, ease: "power3" });
  const handleMove = (event: PointerEvent) => {
    moveX(event.clientX);
    moveY(event.clientY);
  };

  window.addEventListener("pointermove", handleMove, { passive: true });
  cleanupTasks.push(() => {
    window.removeEventListener("pointermove", handleMove);
    gsap.killTweensOf(glow);
  });
};

const buildChrome = () => {
  const fill = progressFill.value;
  const percent = progressPercent.value;

  const syncActive = (scrollTop: number) => {
    let current: ChapterId = chapters[0].id;

    chapters.forEach((chapter) => {
      const start = chapterStarts.get(chapter.id);
      if (start !== undefined && scrollTop >= start - 2) current = chapter.id;
    });

    if (activeChapter.value !== current) activeChapter.value = current;
  };

  const paint = (progress: number, scrollTop: number) => {
    if (fill) fill.style.transform = `scaleX(${progress})`;
    if (percent) percent.textContent = String(Math.round(progress * 100)).padStart(3, "0");
    syncActive(scrollTop);
  };

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => paint(self.progress, self.scroll()),
    onRefresh: (self) => paint(self.progress, self.scroll()),
  });

  const measureChapterStarts = () => {
    const anchors = [
      originSection.value,
      gravityStage.value,
      transitStage.value,
      dawnStage.value,
    ];

    chapters.forEach((chapter, index) => {
      const anchor = anchors[index];
      if (!anchor) return;
      const holder = anchor.closest<HTMLElement>(".pin-spacer") ?? anchor;
      const top = holder.getBoundingClientRect().top + window.scrollY;
      chapterStarts.set(chapter.id, Math.max(0, top));
    });

    chapterStarts.set("origin", 0);
    syncActive(window.scrollY);
  };

  const handleRefresh = () => {
    requestAnimationFrame(measureChapterStarts);
  };

  ScrollTrigger.addEventListener("refresh", handleRefresh);
  cleanupTasks.push(() => ScrollTrigger.removeEventListener("refresh", handleRefresh));
};

const introMotion = () => {
  const intro = gsap.timeline({
    delay: 0.12,
    defaults: { ease: "power3.out" },
  });

  intro
    .from(q(".hud__brand"), { y: -16, opacity: 0, duration: 0.8 }, 0)
    .from(qa(".hud__meta > span"), { y: -10, opacity: 0, duration: 0.55, stagger: 0.08 }, 0.1)
    .from(q(".origin__eyebrow"), { y: 18, opacity: 0, duration: 0.8 }, 0.22)
    .from(
      qa(".hero-title__char"),
      { yPercent: 118, duration: 1.2, stagger: 0.07, ease: "power4.out" },
      0.28
    )
    .from(q(".origin__sun-body"), { scale: 0.72, opacity: 0, duration: 1.8 }, 0.1)
    .from(q(".hero-title__caption"), { opacity: 0, duration: 0.8 }, 0.95)
    .from(q(".origin__tagline-inner"), { y: 24, opacity: 0, duration: 0.85 }, 0.88)
    .from(
      qa(".origin__meta .meta__item"),
      { y: 16, opacity: 0, duration: 0.65, stagger: 0.08 },
      0.98
    )
    .from(q(".origin__scroll-cue"), { opacity: 0, duration: 0.8 }, 1.12)
    .from(qa(".chrome-readout, .chrome-note"), { opacity: 0, duration: 0.8 }, 1.1);
};

const heroMotion = () => {
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: originSection.value,
      start: "top top",
      end: "+=115%",
      scrub: 1,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
    },
  });

  timeline
    .to(
      qa(".hero-title__letter"),
      { yPercent: -108, stagger: { each: 0.028 }, duration: 1, ease: "none" },
      0
    )
    .to(q(".origin__eyebrow"), { opacity: 0, y: -12, duration: 0.4 }, 0)
    .to(q(".origin__tagline-inner"), { opacity: 0, y: -24, duration: 0.5 }, 0)
    .to(q(".origin__meta"), { opacity: 0, y: -16, duration: 0.5 }, 0.12)
    .to(q(".hero-title__caption"), { opacity: 0, y: -12, duration: 0.4 }, 0)
    .to(q(".origin__sun"), { scale: 1.55, yPercent: -7, duration: 1.45, ease: "none" }, 0)
    .to(q(".origin__sun-body"), { opacity: 0.92, duration: 1.2 }, 0.1)
    .to(q(".origin__grid"), { yPercent: -10, opacity: 0.16, duration: 1.2 }, 0)
    .to(q(".origin__shade"), { opacity: 1, duration: 0.9 }, 0.2)
    .to(q(".origin__scroll-cue"), { opacity: 0, duration: 0.3 }, 0);
};

const manifestoMotion = () => {
  gsap.fromTo(
    q(".marquee__track--solid"),
    { xPercent: 0 },
    {
      xPercent: -18,
      ease: "none",
      scrollTrigger: {
        trigger: manifestoSection.value,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    }
  );

  gsap.fromTo(
    q(".marquee__track--outline"),
    { xPercent: -16 },
    {
      xPercent: 0,
      ease: "none",
      scrollTrigger: {
        trigger: manifestoSection.value,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    }
  );

  gsap.from(qa(".manifesto__line > span"), {
    yPercent: 112,
    duration: 1.05,
    stagger: 0.12,
    ease: "power4.out",
    scrollTrigger: {
      trigger: q(".manifesto__statement"),
      start: "top 74%",
      once: true,
    },
  });

  gsap.from(q(".manifesto__meta-row"), {
    y: 36,
    opacity: 0,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: {
      trigger: q(".manifesto__meta-row"),
      start: "top 88%",
      once: true,
    },
  });

  gsap.to(q(".manifesto__aside"), {
    yPercent: -14,
    ease: "none",
    scrollTrigger: {
      trigger: manifestoSection.value,
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
    },
  });
};

const gravityMotion = () => {
  gsap
    .timeline({
      scrollTrigger: {
        trigger: gravitySection.value,
        start: "top 66%",
        once: true,
      },
    })
    .from(q(".gravity__copy .section-tag"), { y: 24, opacity: 0, duration: 0.7 }, 0)
    .from(qa(".gravity__line > span"), {
      yPercent: 115,
      duration: 1,
      stagger: 0.12,
      ease: "power4.out",
    }, 0.08)
    .from(q(".gravity__desc"), { y: 24, opacity: 0, duration: 0.75 }, 0.3)
    .from(
      qa(".gravity__stats > div"),
      { y: 24, opacity: 0, duration: 0.65, stagger: 0.08 },
      0.42
    )
    .from(q(".gravity__system"), { opacity: 0, duration: 1.15 }, 0.22)
    .from(qa(".gravity__system .system__sat"), { scale: 0, duration: 0.5, stagger: 0.1 }, 0.7);

  const distance = { value: 24.6 };

  const pin = gsap.timeline({
    scrollTrigger: {
      trigger: gravitySection.value,
      start: "top top",
      end: "+=200%",
      scrub: 1,
      pin: gravityStage.value,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  pin
    .to(q(".gravity__ghost"), { xPercent: -12, duration: 2, ease: "none" }, 0)
    .to(q(".system__spin--a"), { rotation: 185, duration: 2, ease: "none" }, 0)
    .to(q(".system__spin--b"), { rotation: -155, duration: 2, ease: "none" }, 0)
    .to(q(".system__dial"), { rotation: 110, duration: 2, ease: "none" }, 0)
    .to(q(".gravity__system"), { scale: 1.08, duration: 2, ease: "none" }, 0)
    .to(q(".gravity__copy"), { y: -28, duration: 2, ease: "none" }, 0)
    .to(
      distance,
      {
        value: 3.2,
        duration: 2,
        ease: "none",
        onUpdate: () => {
          if (distanceValue.value) distanceValue.value.textContent = distance.value.toFixed(1);
        },
      },
      0
    );
};

const transitMotion = () => {
  const track = transitTrack.value;
  if (!track) return;

  const measureDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);
  const progress = transitProgress.value;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: transitSection.value,
      start: "top top",
      end: () => `+=${Math.max(measureDistance() + window.innerHeight, window.innerHeight * 2)}`,
      scrub: 1,
      pin: transitStage.value,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (progress) progress.style.transform = `scaleX(${self.progress})`;
      },
      onRefresh: (self) => {
        if (progress) progress.style.transform = `scaleX(${self.progress})`;
      },
    },
  });

  timeline.to(track, {
    x: () => -measureDistance(),
    ease: "none",
    duration: 1,
  });
};

const dawnMotion = () => {
  if (!dawnReveal.value) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: dawnSection.value,
      start: "top top",
      end: "+=190%",
      scrub: 1,
      pin: dawnStage.value,
      anticipatePin: 1,
      onUpdate: (self) => {
        const ready = self.progress > 0.84;
        if (finaleReady.value !== ready) finaleReady.value = ready;
      },
    },
  });

  timeline
    .to(q(".dawn__sun"), { scale: 1.55, duration: 1.1, ease: "none" }, 0)
    .to(
      dawnReveal.value,
      { clipPath: "circle(145% at 50% 54%)", duration: 1.45, ease: "power2.inOut" },
      0.18
    )
    .to(q(".dawn__copy"), { opacity: 0, y: -60, duration: 0.7, ease: "none" }, 0.48)
    .from(
      qa(".dawn__reveal-inner > *"),
      { y: 44, opacity: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" },
      0.94
    );
};

const buildMotion = () => {
  finaleReady.value = false;
  introMotion();
  heroMotion();
  manifestoMotion();
  gravityMotion();
  transitMotion();
  dawnMotion();
};

const buildReduced = () => {
  finaleReady.value = true;
  gsap.set(dawnReveal.value, { clipPath: "none" });
};

onMounted(async () => {
  initStarfield();
  initPointerGlow();

  chromeContext = gsap.context(() => {
    buildChrome();
  }, pageRef.value!);

  motion = gsap.matchMedia();
  motion.add("(prefers-reduced-motion: no-preference)", () => {
    buildMotion();
  });
  motion.add("(prefers-reduced-motion: reduce)", () => {
    buildReduced();
  });

  await nextTick();
  requestAnimationFrame(() => ScrollTrigger.refresh());
});

onBeforeUnmount(() => {
  motion?.revert();
  chromeContext?.revert();
  cleanupTasks.forEach((task) => task());
  cleanupTasks.length = 0;
  cancelAnimationFrame(starRaf);
  requestAnimationFrame(() => ScrollTrigger.refresh());
});
</script>

<style lang="scss" scoped>
:global(html:has(.helios)) {
  scrollbar-color: rgba(243, 235, 220, 0.22) #080705;
  scrollbar-width: thin;
  background: #080705;
}

:global(html:has(.helios)::-webkit-scrollbar) {
  width: 10px;
}

:global(html:has(.helios)::-webkit-scrollbar-track) {
  background: #080705;
}

:global(html:has(.helios)::-webkit-scrollbar-thumb) {
  border: 3px solid #080705;
  border-radius: 8px;
  background: rgba(243, 235, 220, 0.24);
}

.helios {
  --void: #080705;
  --carbon: #0d0b08;
  --ink: #f3ebdc;
  --muted: #9d907e;
  --line: rgba(243, 235, 220, 0.16);
  --line-soft: rgba(243, 235, 220, 0.085);
  --solar: #ff6a1a;
  --solar-soft: #ffb168;
  --ember: #a83b0c;
  --cream: #f1e7d3;
  --charcoal: #0a0806;
  --display: "Bahnschrift", "DIN Alternate", "Arial Narrow", "Microsoft YaHei", sans-serif;
  --mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  --serif: Georgia, "Times New Roman", "Songti SC", serif;
  --gutter: clamp(20px, 4.2vw, 76px);

  position: relative;
  min-height: 100%;
  overflow-x: clip;
  background: var(--void);
  color: var(--ink);
  font-family: var(--display);
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--solar);
    outline-offset: 5px;
  }

  ::selection {
    color: var(--charcoal);
    background: var(--solar-soft);
  }
}

.starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.cursor-glow {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
  width: min(38vw, 520px);
  aspect-ratio: 1;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgba(255, 106, 26, 0.12) 0%,
    rgba(255, 106, 26, 0.04) 34%,
    rgba(255, 106, 26, 0) 70%
  );
  mix-blend-mode: screen;
}

.grain {
  position: fixed;
  inset: -30%;
  z-index: 120;
  pointer-events: none;
  opacity: 0.055;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 220px 220px;
  mix-blend-mode: soft-light;
}

.vignette {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    rgba(8, 7, 5, 0) 38%,
    rgba(8, 7, 5, 0.28) 74%,
    rgba(8, 7, 5, 0.66) 100%
  );
}

.curtain {
  position: fixed;
  inset: 0;
  z-index: 140;
  visibility: hidden;
  background: var(--void);
  opacity: 0;
  pointer-events: none;
}

.hud {
  position: fixed;
  top: 25px;
  right: var(--gutter);
  left: var(--gutter);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--ink);
  pointer-events: none;
  mix-blend-mode: difference;

  button {
    pointer-events: auto;
  }
}

.hud__brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0;
  background: none;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.brand-mark {
  width: 28px;
  height: 28px;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-width: 0.9;
}

.brand-mark__sat {
  fill: currentColor;
  stroke: none;
}

.brand-name {
  font-family: var(--display);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.18em;
  line-height: 1;
}

.brand-divider {
  width: 28px;
  height: 1px;
  margin: 0 2px;
  background: currentColor;
  opacity: 0.4;
}

.brand-sub {
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.18em;
  opacity: 0.68;
}

.hud__meta {
  display: flex;
  align-items: center;
  gap: clamp(18px, 2.6vw, 38px);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.15em;
  opacity: 0.72;
}

.hud__live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.hud__live i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.progress-track {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 110;
  height: 1px;
  overflow: hidden;
  background: rgba(243, 235, 220, 0.17);
  mix-blend-mode: difference;
}

.progress-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--ink);
  transform: scaleX(0);
  transform-origin: 0 50%;
}

.chapter-nav {
  position: fixed;
  top: 50%;
  right: clamp(12px, 2.2vw, 36px);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 17px;
  color: var(--ink);
  transform: translateY(-50%);
  mix-blend-mode: difference;
}

.chapter-nav__item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
  min-height: 32px;
  padding: 3px 0;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
  opacity: 0.38;
  transition:
    opacity 260ms ease,
    color 260ms ease;
}

.chapter-nav__index {
  width: 17px;
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.08em;
  text-align: right;
}

.chapter-nav__dot {
  width: 5px;
  height: 5px;
  border: 1px solid currentColor;
  border-radius: 50%;
  transition:
    background-color 260ms ease,
    transform 260ms ease;
}

.chapter-nav__label {
  position: absolute;
  right: calc(100% + 13px);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.12em;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(7px);
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.chapter-nav__label i {
  margin-left: 5px;
  font-style: normal;
  opacity: 0.48;
}

.chapter-nav__item:hover,
.chapter-nav__item.is-active {
  opacity: 1;
}

.chapter-nav__item:hover .chapter-nav__label,
.chapter-nav__item:focus-visible .chapter-nav__label {
  opacity: 1;
  transform: translateX(0);
}

.chapter-nav__item.is-active .chapter-nav__dot {
  background: currentColor;
  transform: scale(1.2);
}

.chrome-readout {
  position: fixed;
  bottom: 24px;
  left: var(--gutter);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.14em;
  pointer-events: none;
  mix-blend-mode: difference;
}

.chrome-readout__num {
  min-width: 24px;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.chrome-readout__line {
  width: 38px;
  height: 1px;
  background: currentColor;
  opacity: 0.35;
}

.chrome-note {
  position: fixed;
  right: var(--gutter);
  bottom: 24px;
  z-index: 100;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.14em;
  opacity: 0.48;
  pointer-events: none;
  mix-blend-mode: difference;
}

main {
  position: relative;
  z-index: 2;
}

.chapter {
  position: relative;
}

.section-tag {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--solar-soft);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.17em;
  line-height: 1.4;
}

.section-tag::before {
  width: 24px;
  height: 1px;
  content: "";
  background: currentColor;
  opacity: 0.72;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.18em;
  line-height: 1.4;
}

.eyebrow__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--solar);
  box-shadow: 0 0 14px rgba(255, 106, 26, 0.8);
}

.accent {
  color: var(--solar-soft);
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  letter-spacing: 0;
}

/* ---------------- Hero ---------------- */

.chapter--origin {
  min-height: 100svh;
  overflow: hidden;
}

.chapter--origin::before {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 84%, rgba(255, 106, 26, 0.09), transparent 48%),
    linear-gradient(180deg, rgba(8, 7, 5, 0.64), transparent 28%);
}

.origin__inner {
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100svh;
  padding: clamp(104px, 14vh, 154px) var(--gutter) clamp(30px, 5vh, 56px);
}

.origin__eyebrow {
  justify-self: start;
}

.origin__headline {
  position: relative;
  align-self: center;
  width: 100%;
  padding: clamp(26px, 5vh, 70px) 0 clamp(34px, 7vh, 90px);
}

.hero-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  color: var(--ink);
  font-family: var(--display);
  font-size: clamp(92px, 17.2vw, 326px);
  font-stretch: condensed;
  font-weight: 500;
  letter-spacing: -0.055em;
  line-height: 0.72;
  text-transform: uppercase;
}

.hero-title__mask {
  display: block;
  overflow: hidden;
  padding-right: 0.015em;
}

.hero-title__letter,
.hero-title__char {
  display: block;
}

.hero-title__mask--accent .hero-title__char {
  color: var(--solar);
}

.hero-title__caption {
  position: absolute;
  right: 1px;
  bottom: clamp(9px, 1.8vh, 22px);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.2em;
}

.origin__subline {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 34px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.tagline-cn {
  color: var(--ink);
  font-size: clamp(18px, 1.7vw, 29px);
  font-weight: 400;
  letter-spacing: 0.24em;
  line-height: 1.25;
}

.tagline-en {
  margin-top: 8px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.18em;
}

.origin__meta {
  display: flex;
  flex-shrink: 0;
  gap: clamp(22px, 3.8vw, 66px);
}

.meta__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 92px;
}

.meta__item span {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.15em;
}

.meta__item strong {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  line-height: 1.3;
  white-space: nowrap;
}

.meta__item strong i {
  margin-left: 4px;
  color: var(--solar-soft);
  font-style: normal;
}

.origin__grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image:
    linear-gradient(90deg, var(--line-soft) 1px, transparent 1px),
    linear-gradient(var(--line-soft) 1px, transparent 1px);
  background-size: calc(100% / 6) 25vh;
  mask-image: linear-gradient(to bottom, transparent 4%, black 20%, black 74%, transparent 98%);
  opacity: 0.44;
}

.origin__sun-wrap {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
}

.origin__sun {
  position: relative;
  flex: none;
  width: min(79vw, 1190px);
  aspect-ratio: 1;
  margin-bottom: -61vh;
  will-change: transform;
}

.origin__sun-body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 37%,
    #fff4da 0%,
    #ffd18f 12%,
    #ff9b4c 26%,
    #ff6a1a 39%,
    #c53d0b 52%,
    rgba(104, 31, 7, 0.55) 61%,
    rgba(8, 7, 5, 0) 70%
  );
  box-shadow: 0 0 180px 34px rgba(255, 106, 26, 0.16);
  will-change: transform, opacity;
}

.origin__sun-body::after {
  position: absolute;
  inset: 0;
  content: "";
  border-radius: inherit;
  background:
    repeating-radial-gradient(
      circle at 50% 50%,
      transparent 0 4.5%,
      rgba(255, 225, 173, 0.05) 4.6% 4.7%,
      transparent 4.8% 7.2%
    ),
    radial-gradient(circle at 43% 32%, rgba(255, 255, 255, 0.2), transparent 24%);
  mix-blend-mode: overlay;
}

.origin__sun-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid rgba(255, 188, 117, 0.2);
  border-radius: 50%;
  pointer-events: none;
}

.origin__sun-orbit--a {
  width: 112%;
  height: 31%;
  transform: translate(-50%, -50%) rotate(-17deg);
}

.origin__sun-orbit--b {
  width: 126%;
  height: 41%;
  border-color: rgba(255, 188, 117, 0.1);
  border-style: dashed;
  transform: translate(-50%, -50%) rotate(23deg);
}

.origin__shade {
  position: absolute;
  inset: auto 0 0;
  z-index: 3;
  height: 48%;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(8, 7, 5, 0) 0%,
    rgba(8, 7, 5, 0.35) 44%,
    rgba(8, 7, 5, 0.87) 82%,
    var(--void) 100%
  );
}

.origin__scroll-cue {
  position: absolute;
  bottom: 20px;
  left: 50%;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.18em;
  transform: translateX(-50%);
}

.origin__scroll-cue span {
  position: relative;
  display: block;
  width: 1px;
  height: 24px;
  overflow: hidden;
  background: var(--line);
}

.origin__scroll-cue span::after {
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 100%;
  content: "";
  background: var(--ink);
}

/* ---------------- Manifesto ---------------- */

.manifesto {
  position: relative;
  z-index: 2;
  padding-top: clamp(90px, 15vh, 180px);
  border-top: 1px solid var(--line-soft);
}

.marquee {
  overflow: hidden;
  padding: clamp(26px, 4vh, 46px) 0 clamp(30px, 5vh, 56px);
  border-bottom: 1px solid var(--line-soft);
  mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent);
}

.marquee__row {
  overflow: hidden;
}

.marquee__row--outline {
  margin-top: clamp(2px, 0.5vh, 8px);
}

.marquee__track {
  display: flex;
  align-items: center;
  width: max-content;
  gap: clamp(24px, 3.2vw, 58px);
  color: var(--ink);
  font-family: var(--display);
  font-size: clamp(64px, 9.8vw, 186px);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 0.92;
  white-space: nowrap;
  will-change: transform;
}

.marquee__sep {
  color: var(--solar);
  font-size: 0.17em;
  font-style: normal;
  letter-spacing: 0;
}

.marquee__cn {
  color: var(--muted);
  font-size: 0.38em;
  font-weight: 400;
  letter-spacing: 0.03em;
}

.marquee__row--outline .marquee__track {
  color: transparent;
  -webkit-text-stroke: 1px rgba(243, 235, 220, 0.24);
}

.marquee__row--outline .marquee__sep {
  color: rgba(243, 235, 220, 0.28);
  -webkit-text-stroke: 0;
}

.manifesto__body {
  display: grid;
  grid-template-columns: minmax(150px, 0.65fr) minmax(0, 1.8fr);
  gap: clamp(46px, 8vw, 156px);
  padding: clamp(80px, 14vh, 160px) var(--gutter) clamp(100px, 18vh, 200px);
}

.manifesto__aside {
  position: relative;
  align-self: start;
  padding-top: 7px;
}

.manifesto__note {
  margin-top: 30px;
  color: var(--ink);
  font-size: clamp(14px, 1.15vw, 18px);
  font-weight: 300;
  letter-spacing: 0.12em;
  line-height: 1.85;
}

.manifesto__scale {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: clamp(44px, 8vh, 86px);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.12em;
}

.manifesto__scale i {
  display: block;
  width: 66px;
  height: 1px;
  background: linear-gradient(90deg, var(--solar), var(--line));
}

.manifesto__statement {
  color: var(--ink);
  font-family: var(--display);
  font-size: clamp(38px, 5.4vw, 106px);
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1.26;
}

.manifesto__line {
  display: block;
  overflow: hidden;
  padding-bottom: 0.06em;
}

.manifesto__line > span {
  display: block;
}

.manifesto__line:nth-child(n + 3) {
  color: var(--muted);
}

.manifesto__meta-row {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr);
  gap: clamp(30px, 5vw, 90px);
  margin-top: clamp(48px, 8vh, 88px);
  padding-top: 28px;
  border-top: 1px solid var(--line);
}

.manifesto__meta-row > p {
  max-width: 48ch;
  color: var(--muted);
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1.9;
}

.manifesto__facts {
  display: flex;
  justify-content: flex-end;
  gap: clamp(24px, 3.2vw, 52px);
}

.manifesto__facts div {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.manifesto__facts span {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.12em;
}

.manifesto__facts strong {
  color: var(--ink);
  font-family: var(--display);
  font-size: clamp(17px, 1.35vw, 22px);
  font-weight: 500;
  letter-spacing: 0.03em;
}

/* ---------------- Gravity ---------------- */

.chapter--gravity {
  overflow: hidden;
}

.gravity__stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(400px, 1.1fr);
  align-items: center;
  gap: clamp(24px, 3vw, 68px);
  min-height: 100svh;
  padding: clamp(104px, 14vh, 148px) var(--gutter) clamp(48px, 7vh, 78px);
  overflow: hidden;
  background: radial-gradient(ellipse at 72% 48%, rgba(255, 106, 26, 0.1), transparent 44%);
}

.gravity__ghost {
  position: absolute;
  bottom: -0.1vh;
  left: -0.8vw;
  z-index: 0;
  color: transparent;
  font-family: var(--display);
  font-size: clamp(150px, 21vw, 400px);
  font-weight: 500;
  letter-spacing: -0.06em;
  line-height: 0.7;
  white-space: nowrap;
  pointer-events: none;
  -webkit-text-stroke: 1px rgba(243, 235, 220, 0.07);
}

.gravity__copy {
  position: relative;
  z-index: 2;
  max-width: 620px;
}

.gravity__title {
  margin-top: clamp(24px, 4vh, 40px);
  color: var(--ink);
  font-family: var(--display);
  font-size: clamp(52px, 7.1vw, 134px);
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 1.04;
}

.gravity__line {
  position: relative;
  display: block;
  overflow: hidden;
  padding-bottom: 0.05em;
}

.gravity__line > span {
  display: block;
}

.gravity__line--accent > span {
  color: var(--solar-soft);
}

.gravity__line--accent em {
  position: absolute;
  right: 4px;
  bottom: 0.55em;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  font-style: normal;
  letter-spacing: 0.13em;
}

.gravity__desc {
  max-width: 39ch;
  margin-top: clamp(26px, 4vh, 38px);
  color: var(--muted);
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 0.03em;
  line-height: 1.95;
}

.gravity__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(16px, 2.4vw, 38px);
  margin-top: clamp(38px, 6vh, 62px);
  padding-top: 17px;
  border-top: 1px solid var(--line);
}

.gravity__stats > div {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gravity__stats span {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.gravity__stats strong {
  color: var(--ink);
  font-family: var(--display);
  font-size: clamp(20px, 1.8vw, 28px);
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
}

.gravity__stats strong em {
  display: block;
  margin-top: 7px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  font-style: normal;
  font-weight: 400;
  letter-spacing: 0.1em;
}

.gravity__rule {
  width: 100%;
  height: 1px;
  margin-top: clamp(28px, 4vh, 46px);
  background: linear-gradient(90deg, var(--line), transparent);
}

.gravity__hint {
  display: block;
  margin-top: 14px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.14em;
}

.gravity__system {
  position: relative;
  justify-self: end;
  width: min(100%, 714px);
  aspect-ratio: 1;
  will-change: transform;
}

.system__halo {
  position: absolute;
  inset: 4%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 106, 26, 0.22) 0%,
    rgba(255, 106, 26, 0.055) 36%,
    transparent 64%
  );
  filter: blur(10px);
}

.system__axis {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, var(--line-soft), transparent);
}

.system__axis--x {
  top: 50%;
  right: 0;
  left: 0;
  height: 1px;
}

.system__axis--y {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: linear-gradient(180deg, transparent, var(--line-soft), transparent);
}

.system__orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid var(--line);
  border-radius: 50%;
}

.system__orbit--a {
  width: 75%;
  height: 30%;
  transform: translate(-50%, -50%) rotate(-22deg);
}

.system__orbit--b {
  width: 92%;
  height: 38%;
  border-color: var(--line-soft);
  border-style: dashed;
  transform: translate(-50%, -50%) rotate(26deg);
}

.system__spin {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.system__sat {
  position: absolute;
  top: 0;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--solar-soft);
  box-shadow: 0 0 18px rgba(255, 137, 51, 0.8);
  transform: translate(-50%, -50%);
}

.system__sat--alt {
  width: 4px;
  height: 4px;
  background: var(--ink);
  box-shadow: 0 0 12px rgba(243, 235, 220, 0.55);
}

.system__dial {
  position: absolute;
  inset: 16.5%;
  border: 1px solid var(--line-soft);
  border-radius: 50%;
}

.system__dial::before {
  position: absolute;
  inset: -8px;
  content: "";
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(243, 235, 220, 0.3) 0deg 0.55deg,
    transparent 0.65deg 4.8deg
  );
  mask-image: radial-gradient(circle, transparent 0 94%, black 94.5% 100%);
}

.system__dial-ring {
  position: absolute;
  inset: 9%;
  border: 1px dashed var(--line-soft);
  border-radius: 50%;
}

.system__core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  background: radial-gradient(
    circle at 43% 37%,
    #fff4dc 0%,
    #ffd798 13%,
    #ff9c51 28%,
    #f26018 45%,
    #7d2609 68%,
    #160a04 100%
  );
  box-shadow:
    0 0 80px rgba(255, 106, 26, 0.3),
    inset -24px -22px 44px rgba(0, 0, 0, 0.56);
  transform: translate(-50%, -50%);
}

.system__core::after {
  position: absolute;
  inset: 0;
  content: "";
  background: radial-gradient(circle at 36% 28%, rgba(255, 255, 255, 0.32), transparent 34%);
  mix-blend-mode: screen;
}

.system__core-light {
  position: absolute;
  bottom: 18%;
  left: 22%;
  width: 6%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 244, 220, 0.6);
  filter: blur(1px);
}

.system__core-label {
  position: absolute;
  bottom: 17%;
  left: 50%;
  color: rgba(255, 244, 220, 0.48);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.25em;
  transform: translateX(-50%);
}

.system__label {
  position: absolute;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.11em;
  white-space: nowrap;
}

.system__label--a {
  top: 14%;
  left: 1%;
}

.system__label--b {
  bottom: 6%;
  left: 7%;
}

.system__label::before {
  display: inline-block;
  width: 14px;
  height: 1px;
  margin-right: 8px;
  vertical-align: middle;
  content: "";
  background: currentColor;
  opacity: 0.55;
}

.system__index {
  position: absolute;
  top: 1%;
  left: 2%;
  color: transparent;
  font-family: var(--display);
  font-size: clamp(70px, 8vw, 150px);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 1;
  pointer-events: none;
  -webkit-text-stroke: 1px rgba(243, 235, 220, 0.08);
}

.gravity__foot {
  position: absolute;
  right: var(--gutter);
  bottom: 46px;
  left: var(--gutter);
  z-index: 2;
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.12em;
  pointer-events: none;
}

/* ---------------- Transit ---------------- */

.chapter--transit {
  overflow: hidden;
}

.transit__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100svh;
  min-height: 680px;
  padding: clamp(92px, 12vh, 132px) 0 clamp(48px, 6vh, 64px);
  overflow: hidden;
}

.transit__header {
  display: flex;
  flex: none;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin: 0 var(--gutter);
  padding-bottom: clamp(16px, 2.5vh, 28px);
  border-bottom: 1px solid var(--line-soft);
}

.transit__header-mid {
  display: flex;
  align-items: baseline;
  gap: 18px;
  margin-left: auto;
}

.transit__header-mid span {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.12em;
}

.transit__header-mid strong {
  color: var(--ink);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.08em;
}

.transit__count {
  flex: none;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.13em;
}

.transit__viewport {
  display: flex;
  flex: 1;
  align-items: center;
  width: 100%;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent 0, black 3.5%, black 96.5%, transparent 100%);
}

.transit__track {
  display: flex;
  align-items: center;
  width: max-content;
  height: 100%;
  padding: 0 var(--gutter);
  gap: clamp(20px, 2.4vw, 42px);
  will-change: transform;
}

.transit__lead {
  position: relative;
  flex: 0 0 auto;
  width: clamp(320px, 33vw, 510px);
  padding-right: clamp(26px, 4vw, 84px);
}

.transit__lead-index {
  position: absolute;
  top: -11vh;
  left: -0.6vw;
  color: transparent;
  font-family: var(--display);
  font-size: clamp(150px, 22vw, 410px);
  font-weight: 500;
  letter-spacing: -0.06em;
  line-height: 0.7;
  pointer-events: none;
  -webkit-text-stroke: 1px rgba(243, 235, 220, 0.07);
}

.transit__lead h2 {
  position: relative;
  z-index: 1;
  color: var(--ink);
  font-family: var(--display);
  font-size: clamp(66px, 7.5vw, 136px);
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 0.98;
}

.transit__lead h2 span {
  color: var(--solar-soft);
}

.transit__lead p {
  position: relative;
  z-index: 1;
  max-width: 24ch;
  margin-top: clamp(26px, 4vh, 42px);
  color: var(--muted);
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1.9;
}

.transit__lead-hint {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  margin-top: clamp(38px, 6vh, 64px);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.14em;
}

.transit__lead-hint::before {
  width: 26px;
  height: 1px;
  content: "";
  background: var(--solar-soft);
}

.transit__card {
  --card-ink: var(--ink);
  --card-muted: var(--muted);
  --card-line: var(--line);
  --card-shade: rgba(8, 7, 5, 0.82);

  position: relative;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: clamp(460px, 54vw, 900px);
  height: min(60vh, 620px);
  min-height: 410px;
  padding: clamp(18px, 2.2vw, 32px);
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--carbon);
  color: var(--card-ink);
  isolation: isolate;
}

.transit__card--silence {
  background:
    radial-gradient(ellipse at 76% 27%, rgba(243, 235, 220, 0.075), transparent 34%),
    radial-gradient(ellipse at 20% 90%, rgba(255, 106, 26, 0.07), transparent 46%),
    linear-gradient(150deg, #0e0c09 0%, #090806 62%, #0c0a08 100%);
}

.transit__card--drift {
  background:
    radial-gradient(ellipse at 30% 18%, rgba(255, 106, 26, 0.12), transparent 38%),
    radial-gradient(ellipse at 76% 84%, rgba(243, 235, 220, 0.06), transparent 32%),
    linear-gradient(160deg, #0b0907 0%, #100d09 42%, #070605 100%);
}

.transit__card--corona {
  --card-ink: var(--charcoal);
  --card-muted: rgba(10, 8, 6, 0.62);
  --card-line: rgba(10, 8, 6, 0.2);
  --card-shade: rgba(243, 231, 211, 0.9);

  border-color: rgba(10, 8, 6, 0.16);
  background:
    radial-gradient(ellipse at 74% 26%, rgba(255, 255, 255, 0.55), transparent 24%),
    radial-gradient(ellipse at 68% 30%, rgba(255, 106, 26, 0.3), transparent 48%),
    linear-gradient(145deg, #f4ead7 0%, #f7d9b2 48%, #eaa15d 100%);
}

.card__visual {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.card__visual::after {
  position: absolute;
  inset: 30% 0 0;
  content: "";
  background: linear-gradient(180deg, transparent, var(--card-shade) 92%);
}

.card__ghost {
  position: absolute;
  right: -0.04em;
  bottom: -0.13em;
  color: transparent;
  font-family: var(--display);
  font-size: clamp(150px, 17vw, 290px);
  font-weight: 500;
  letter-spacing: -0.055em;
  line-height: 0.7;
  white-space: nowrap;
  -webkit-text-stroke: 1px rgba(243, 235, 220, 0.1);
}

.transit__card--corona .card__ghost {
  -webkit-text-stroke-color: rgba(10, 8, 6, 0.12);
}

.card__halo {
  position: absolute;
  top: 8%;
  left: 50%;
  width: 54%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 106, 26, 0.26) 0%,
    rgba(255, 106, 26, 0.07) 42%,
    transparent 68%
  );
  filter: blur(7px);
  transform: translateX(-50%);
}

.transit__card--silence .card__halo {
  top: 20%;
  left: 63%;
  width: 30%;
  background: radial-gradient(circle, rgba(243, 235, 220, 0.17) 0%, transparent 68%);
}

.transit__card--corona .card__halo {
  top: 5%;
  left: 66%;
  width: 47%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 158, 74, 0.7) 30%,
    rgba(255, 106, 26, 0) 67%
  );
  filter: blur(10px);
}

.card__ring {
  position: absolute;
  top: 42%;
  left: 66%;
  border: 1px solid rgba(243, 235, 220, 0.13);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.card__ring--a {
  width: 56%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%) rotate(-16deg) scaleY(0.33);
}

.card__ring--b {
  width: 74%;
  aspect-ratio: 1;
  border-color: rgba(243, 235, 220, 0.08);
  transform: translate(-50%, -50%) rotate(28deg) scaleY(0.24);
}

.card__ring--c {
  width: 38%;
  aspect-ratio: 1;
  border-style: dashed;
  border-color: rgba(243, 235, 220, 0.16);
}

.transit__card--silence .card__ring {
  top: 38%;
  left: 70%;
  border-color: rgba(243, 235, 220, 0.1);
}

.transit__card--drift .card__ring {
  top: 37%;
  left: 60%;
}

.transit__card--corona .card__ring {
  top: 38%;
  left: 68%;
  border-color: rgba(10, 8, 6, 0.2);
}

.transit__card--corona .card__ring--b {
  border-color: rgba(10, 8, 6, 0.12);
}

.card__bead {
  position: absolute;
  top: 20.5%;
  left: 47.5%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--solar-soft);
  box-shadow: 0 0 16px rgba(255, 137, 51, 0.8);
}

.transit__card--silence .card__bead {
  top: 33%;
  left: 76%;
  width: 5px;
  height: 5px;
  background: var(--ink);
  box-shadow: 0 0 14px rgba(243, 235, 220, 0.7);
}

.transit__card--drift .card__bead {
  top: 26%;
  left: 29%;
}

.transit__card--corona .card__bead {
  top: 25%;
  left: 72%;
  background: var(--charcoal);
  box-shadow: none;
}

.card__scan {
  position: absolute;
  top: 26%;
  right: 10%;
  left: 36%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(243, 235, 220, 0.2), transparent);
}

.transit__card--corona .card__scan {
  background: linear-gradient(90deg, transparent, rgba(10, 8, 6, 0.22), transparent);
}

.card__top {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  color: var(--card-muted);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.12em;
}

.card__tag {
  padding: 5px 9px;
  border: 1px solid var(--card-line);
  font-size: 7px;
  letter-spacing: 0.1em;
}

.card__copy {
  position: relative;
  z-index: 2;
  width: min(62%, 440px);
  margin-top: auto;
}

.card__en {
  display: block;
  color: var(--card-muted);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.18em;
}

.card__copy h3 {
  margin-top: 15px;
  color: var(--card-ink);
  font-family: var(--display);
  font-size: clamp(36px, 3.5vw, 58px);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.card__copy p {
  max-width: 35ch;
  margin-top: 17px;
  color: var(--card-muted);
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.02em;
  line-height: 1.85;
}

.card__meta {
  display: block;
  margin-top: 24px;
  padding-top: 13px;
  border-top: 1px solid var(--card-line);
  color: var(--card-muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.1em;
}

.transit__footer {
  display: flex;
  flex: none;
  align-items: center;
  gap: 15px;
  margin: 0 var(--gutter);
  padding-top: clamp(15px, 2.3vh, 24px);
  border-top: 1px solid var(--line-soft);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.13em;
}

.transit__progress {
  width: clamp(80px, 12vw, 180px);
  height: 1px;
  overflow: hidden;
  background: var(--line);
}

.transit__progress-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--solar-soft);
  transform: scaleX(0);
  transform-origin: 0 50%;
}

.transit__footer span:last-child {
  margin-left: auto;
}

/* ---------------- Dawn ---------------- */

.chapter--dawn {
  overflow: hidden;
}

.dawn__stage {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100svh;
  min-height: 700px;
  padding: 120px var(--gutter) 80px;
  overflow: hidden;
}

.dawn__stage::after {
  position: absolute;
  inset: 0;
  z-index: 2;
  content: "";
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(8, 7, 5, 0.8) 0%, rgba(8, 7, 5, 0.34) 28%, transparent 58%),
    linear-gradient(0deg, rgba(8, 7, 5, 0.55) 0%, transparent 22%);
}

.dawn__copy {
  position: relative;
  z-index: 3;
}

.dawn__title {
  margin-top: clamp(26px, 4vh, 44px);
  color: transparent;
  font-family: var(--display);
  font-size: clamp(90px, 14.6vw, 274px);
  font-weight: 400;
  letter-spacing: -0.065em;
  line-height: 0.86;
  -webkit-text-stroke: 1px rgba(243, 235, 220, 0.5);
}

.dawn__title span {
  display: block;
}

.dawn__title .dawn__title-accent {
  margin-left: clamp(30px, 6vw, 108px);
  color: var(--solar-soft);
  -webkit-text-stroke: 0;
}

.dawn__copy > p {
  margin-top: clamp(30px, 4vh, 44px);
  color: var(--muted);
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1.9;
}

.dawn__hint {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: clamp(42px, 7vh, 72px);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.14em;
}

.dawn__hint i {
  width: 28px;
  height: 1px;
  background: var(--solar-soft);
}

.dawn__sun {
  position: absolute;
  right: -24vw;
  bottom: -32vh;
  left: -24vw;
  z-index: 1;
  height: 84vh;
  pointer-events: none;
  will-change: transform;
}

.dawn__sun span {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(255, 244, 220, 0.98) 0%,
    rgba(255, 208, 144, 0.9) 10%,
    rgba(255, 133, 61, 0.68) 27%,
    rgba(255, 106, 26, 0.28) 46%,
    rgba(255, 106, 26, 0) 70%
  );
  filter: blur(26px);
}

.dawn__reveal {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--charcoal);
  background:
    radial-gradient(ellipse at 50% 118%, rgba(255, 106, 26, 0.3), transparent 45%),
    radial-gradient(ellipse at 86% 0%, rgba(255, 191, 132, 0.34), transparent 30%),
    var(--cream);
  clip-path: circle(0% at 50% 92%);
  will-change: clip-path;
}

.dawn__reveal::before {
  position: absolute;
  top: -52%;
  right: -14%;
  width: min(78vw, 1180px);
  aspect-ratio: 1;
  content: "";
  border: 1px solid rgba(10, 8, 6, 0.12);
  border-radius: 50%;
  box-shadow:
    0 0 0 8vw rgba(255, 106, 26, 0.035),
    0 0 0 16vw rgba(255, 106, 26, 0.018);
}

.dawn__reveal::after {
  position: absolute;
  bottom: -48%;
  left: 50%;
  width: min(96vw, 1500px);
  aspect-ratio: 1;
  content: "";
  border: 1px solid rgba(10, 8, 6, 0.09);
  border-radius: 50%;
  transform: translateX(-50%);
}

.dawn__reveal-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: min(1200px, 84vw);
  min-height: 70vh;
}

.dawn__reveal-tag {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgba(10, 8, 6, 0.66);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.17em;
}

.dawn__reveal-tag::before {
  width: 26px;
  height: 1px;
  content: "";
  background: var(--solar);
}

.dawn__final {
  margin-top: clamp(26px, 4vh, 44px);
  color: var(--charcoal);
  font-family: var(--display);
  font-size: clamp(42px, 5.8vw, 108px);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 1.2;
}

.dawn__final em {
  color: var(--ember);
  font-family: var(--serif);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.02em;
}

.dawn__reveal :focus-visible {
  outline-color: var(--charcoal);
}

.dawn__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: clamp(38px, 5vh, 58px);
}

.dawn__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  min-height: 52px;
  padding: 0 22px;
  border: 1px solid var(--charcoal);
  background: var(--charcoal);
  color: var(--cream);
  font-family: var(--display);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-decoration: none;
  cursor: pointer;
  transition:
    color 220ms ease,
    background-color 220ms ease;
}

.dawn__cta:hover {
  background: transparent;
  color: var(--charcoal);
}

.dawn__cta--ghost {
  background: transparent;
  color: var(--charcoal);
}

.dawn__cta--ghost:hover {
  background: var(--charcoal);
  color: var(--cream);
}

.dawn__reveal-footer {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-top: clamp(50px, 8vh, 88px);
  padding-top: 17px;
  border-top: 1px solid rgba(10, 8, 6, 0.16);
  color: rgba(10, 8, 6, 0.64);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.12em;
}

@media (prefers-reduced-motion: no-preference) {
  .hud__live i {
    animation: hud-pulse 2.4s ease-in-out infinite;
  }

  .origin__scroll-cue span::after {
    animation: cue-fall 2.2s cubic-bezier(0.5, 0, 0.2, 1) infinite;
  }
}

@keyframes hud-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes cue-fall {
  0% {
    transform: translateY(0);
  }
  65%,
  100% {
    transform: translateY(200%);
  }
}

/* ---------------- Responsive ---------------- */

@media (max-width: 1280px) {
  .origin__meta {
    gap: 24px;
  }

  .gravity__stage {
    grid-template-columns: minmax(0, 1fr) minmax(380px, 0.95fr);
  }

  .system__label--a {
    left: 0;
  }

  .transit__card {
    width: 61vw;
  }
}

@media (max-width: 1024px) {
  .brand-divider,
  .brand-sub {
    display: none;
  }

  .hud__meta > span:first-child {
    display: none;
  }

  .origin__subline {
    gap: 24px;
  }

  .origin__meta {
    gap: 18px;
  }

  .meta__item {
    min-width: 78px;
  }

  .manifesto__body {
    gap: 52px;
  }

  .gravity__stage {
    grid-template-columns: minmax(0, 1fr) minmax(330px, 0.8fr);
    gap: 20px;
  }

  .gravity__line--accent em {
    display: none;
  }

  .gravity__stats {
    gap: 16px;
  }

  .gravity__system {
    width: min(100%, 600px);
  }

  .transit__lead {
    width: 34vw;
  }

  .transit__card {
    width: 66vw;
  }
}

@media (max-width: 860px) {
  .hud {
    top: 19px;
  }

  .hud__meta > span:not(.hud__live) {
    display: none;
  }

  .brand-name {
    font-size: 13px;
  }

  .chapter-nav {
    display: none;
  }

  .chrome-note {
    display: none;
  }

  .origin__inner {
    padding-top: 100px;
  }

  .origin__sun {
    width: min(138vw, 78vh);
    margin-bottom: -32vh;
  }

  .hero-title {
    font-size: clamp(76px, 19.5vw, 180px);
    line-height: 0.76;
  }

  .hero-title__caption {
    display: none;
  }

  .origin__subline {
    flex-direction: column;
    align-items: flex-start;
    gap: 22px;
  }

  .origin__meta {
    justify-content: space-between;
    width: 100%;
  }

  .meta__item {
    min-width: 0;
  }

  .origin__scroll-cue {
    display: none;
  }

  .marquee__track {
    font-size: clamp(58px, 15vw, 120px);
  }

  .manifesto__body {
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .manifesto__aside {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px 30px;
  }

  .manifesto__note {
    margin-top: 0;
  }

  .manifesto__scale {
    margin-top: 0;
  }

  .manifesto__statement {
    font-size: clamp(34px, 7.5vw, 62px);
    line-height: 1.35;
  }

  .manifesto__meta-row {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .manifesto__facts {
    justify-content: flex-start;
  }

  .gravity__stage {
    display: block;
    padding-top: 118px;
    padding-bottom: 92px;
  }

  .gravity__copy {
    z-index: 2;
    max-width: 90%;
  }

  .gravity__title {
    font-size: clamp(58px, 12vw, 92px);
  }

  .gravity__system {
    position: absolute;
    right: -18vw;
    bottom: 1vh;
    z-index: 0;
    width: 74vw;
    max-width: 560px;
    opacity: 0.35;
  }

  .gravity__system .system__label,
  .gravity__system .system__index,
  .gravity__system .system__axis {
    display: none;
  }

  .gravity__ghost,
  .gravity__foot {
    display: none;
  }

  .gravity__desc {
    max-width: 34ch;
  }

  .transit__stage {
    padding-top: 92px;
    padding-bottom: 58px;
  }

  .transit__header-mid {
    display: flex;
    margin-left: auto;
  }

  .transit__header-mid span {
    display: none;
  }

  .transit__header-mid strong {
    color: var(--muted);
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.08em;
  }

  .transit__count {
    display: none;
  }

  .transit__track {
    gap: 18px;
  }

  .transit__lead {
    width: 76vw;
    padding-right: 20px;
  }

  .transit__lead-index {
    top: -8vh;
    font-size: 54vw;
  }

  .transit__lead h2 {
    font-size: clamp(58px, 15vw, 92px);
  }

  .transit__card {
    width: 82vw;
    height: min(60vh, 560px);
  }

  .card__copy {
    width: min(82%, 420px);
  }

  .dawn__stage {
    padding: 110px var(--gutter) 54px;
  }

  .dawn__title {
    font-size: clamp(78px, 20vw, 154px);
  }

  .dawn__title .dawn__title-accent {
    margin-left: 8vw;
  }

  .dawn__sun {
    right: -74vw;
    bottom: -24vh;
    left: -74vw;
    height: 68vh;
  }

  .dawn__reveal-inner {
    width: 84vw;
    min-height: 76vh;
  }

  .dawn__final {
    font-size: clamp(36px, 7.8vw, 58px);
  }

  .dawn__reveal-footer {
    flex-wrap: wrap;
    gap: 10px 22px;
  }
}

@media (max-width: 560px) {
  .hud {
    top: 16px;
    right: 16px;
    left: 16px;
  }

  .brand-name {
    font-size: 12px;
  }

  .brand-mark {
    width: 24px;
    height: 24px;
  }

  .chrome-readout {
    bottom: 16px;
    left: 16px;
  }

  .origin__inner {
    padding: 86px 18px 34px;
  }

  .hero-title {
    font-size: clamp(64px, 21.5vw, 130px);
    letter-spacing: -0.06em;
  }

  .tagline-cn {
    font-size: 18px;
  }

  .origin__sun {
    width: min(160vw, 74vh);
    margin-bottom: -28vh;
  }

  .origin__meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 17px;
  }

  .origin__meta .meta__item:last-child {
    grid-column: 1 / -1;
  }

  .manifesto {
    padding-top: 76px;
  }

  .marquee {
    padding: 22px 0 26px;
  }

  .marquee__track {
    font-size: 19vw;
  }

  .manifesto__body {
    padding: 64px 18px 100px;
  }

  .manifesto__statement {
    font-size: clamp(31px, 10.2vw, 48px);
  }

  .manifesto__line:nth-child(n + 3) {
    font-size: 0.86em;
  }

  .gravity__stage {
    min-height: 760px;
    padding: 104px 18px 83px;
  }

  .gravity__copy {
    max-width: 100%;
  }

  .gravity__title {
    font-size: clamp(50px, 14.5vw, 78px);
    line-height: 1.08;
  }

  .gravity__desc {
    max-width: 31ch;
    font-size: 12px;
  }

  .gravity__stats {
    grid-template-columns: 1fr 1fr;
    row-gap: 24px;
    margin-top: 34px;
  }

  .gravity__stats > div:last-child {
    grid-column: 1 / -1;
  }

  .gravity__system {
    right: -31vw;
    bottom: 3vh;
    width: 96vw;
    opacity: 0.24;
  }

  .gravity__hint {
    margin-top: 11px;
  }

  .transit__stage {
    min-height: 630px;
    padding: 78px 0 58px;
  }

  .transit__viewport {
    mask-image: linear-gradient(90deg, transparent 0, black 7%, black 93%, transparent 100%);
  }

  .transit__header {
    margin: 0 18px;
  }

  .transit__header-mid strong {
    font-size: 9px;
  }

  .transit__lead {
    width: 82vw;
  }

  .transit__lead h2 {
    font-size: 16vw;
  }

  .transit__lead p {
    margin-top: 20px;
  }

  .transit__lead-hint {
    margin-top: 28px;
  }

  .transit__card {
    width: 86vw;
    height: min(59vh, 500px);
    min-height: 390px;
    padding: 17px;
  }

  .card__copy {
    width: 100%;
  }

  .card__copy h3 {
    font-size: 34px;
  }

  .card__copy p {
    max-width: 31ch;
    font-size: 11px;
  }

  .card__meta {
    margin-top: 18px;
  }

  .transit__footer {
    margin: 0 18px;
    padding-top: 14px;
  }

  .transit__footer span:last-child {
    display: none;
  }

  .dawn__stage {
    min-height: 720px;
    padding: 96px 18px 44px;
  }

  .dawn__title {
    font-size: clamp(76px, 23vw, 120px);
  }

  .dawn__copy > p {
    font-size: 12px;
  }

  .dawn__hint {
    margin-top: 38px;
  }

  .dawn__sun {
    right: -105vw;
    bottom: -16vh;
    left: -105vw;
    height: 62vh;
  }

  .dawn__reveal-inner {
    width: calc(100vw - 36px);
    min-height: 80vh;
  }

  .dawn__final {
    font-size: clamp(30px, 8.8vw, 42px);
    line-height: 1.28;
  }

  .dawn__actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .dawn__cta {
    width: 100%;
  }

  .dawn__reveal-footer {
    margin-top: 38px;
    font-size: 6px;
  }

  .dawn__reveal-footer span:nth-child(2) {
    display: none;
  }
}

@media (max-height: 760px) and (min-width: 861px) {
  .origin__inner {
    padding-top: 90px;
    padding-bottom: 24px;
  }

  .hero-title {
    font-size: clamp(84px, 15vw, 240px);
  }

  .origin__headline {
    padding: 18px 0 38px;
  }

  .origin__scroll-cue {
    display: none;
  }

  .gravity__stage {
    padding-top: 92px;
    padding-bottom: 55px;
  }

  .gravity__title {
    font-size: clamp(48px, 6vw, 96px);
  }

  .gravity__desc {
    margin-top: 22px;
  }

  .gravity__stats {
    margin-top: 26px;
  }

  .gravity__rule {
    margin-top: 24px;
  }

  .transit__stage {
    padding-top: 78px;
  }

  .transit__card {
    height: min(59vh, 520px);
  }

  .dawn__stage {
    padding-top: 92px;
  }

  .dawn__title {
    font-size: clamp(80px, 12vw, 190px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .helios *,
  .helios *::before,
  .helios *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }

  .cursor-glow {
    display: none;
  }

  .chapter--gravity {
    min-height: 100svh;
  }

  .gravity__stage {
    min-height: 100svh;
  }

  .transit__stage {
    height: auto;
    padding: 128px var(--gutter) 64px;
  }

  .transit__viewport {
    display: block;
    margin-top: 44px;
    overflow: visible;
    mask-image: none;
  }

  .transit__track {
    flex-wrap: wrap;
    width: auto;
    height: auto;
    padding: 0;
    gap: 22px;
    transform: none !important;
  }

  .transit__header,
  .transit__footer {
    margin-right: 0;
    margin-left: 0;
  }

  .transit__lead {
    width: 100%;
    padding-right: 0;
  }

  .transit__lead-index {
    top: -88px;
    left: 0;
    font-size: 220px;
  }

  .transit__card {
    width: calc(50% - 11px);
    height: min(62vh, 560px);
  }

  .transit__footer {
    margin-top: 38px;
  }

  .dawn__stage {
    display: block;
    height: auto;
    min-height: 100svh;
    padding: 140px var(--gutter) 70px;
  }

  .dawn__copy {
    padding-bottom: 72px;
  }

  .dawn__hint {
    display: none;
  }

  .dawn__sun {
    bottom: -18vh;
  }

  .dawn__reveal {
    position: relative;
    inset: auto;
    min-height: 80svh;
    padding: 68px var(--gutter);
    clip-path: none !important;
  }

  .dawn__reveal-inner {
    width: min(1100px, 100%);
    min-height: 60vh;
  }

  .transit__progress {
    background: var(--line);
  }

  .transit__progress-fill {
    transform: scaleX(1) !important;
  }
}

@media (prefers-reduced-motion: reduce) and (max-width: 860px) {
  .transit__stage {
    padding: 100px 18px 48px;
  }

  .transit__card {
    width: 100%;
  }

  .dawn__stage {
    padding: 112px 18px 48px;
  }

  .dawn__reveal {
    padding: 46px 20px;
  }

  .dawn__final {
    font-size: clamp(28px, 8vw, 40px);
  }
}
</style>
