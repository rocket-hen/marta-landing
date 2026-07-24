// Vanilla-JS port of the landing page's interactive behavior (originally a single
// stateful component in the source design). Runs only on the home page.

import { copy, type Lang } from '../i18n/copy';

const ACCENT = '#B0512E';

// The demo transcript / hero caption toggle (data-transcript-lang) is a separate,
// narrower "which language is the phone call shown in" control — decoupled from the
// page's own language (document.documentElement.lang), which drives everything else.
function pageLang(): Lang {
	return document.documentElement.lang === 'es' ? 'es' : 'en';
}

const CAPTIONS: Record<Lang, string[]> = {
	es: [
		'Nuevo piso en Gran Vía detectado…',
		'"Buenas, soy Marta, asistente de IA."',
		'"¿El jueves a las 17:30 le viene bien?"',
		'"Perfecto, queda reservado. ¡Gracias!"',
		'',
	],
	en: [
		'New listing on Gran Vía detected…',
		'"Hi, I\'m Marta, an AI assistant."',
		'"Does Thursday at 17:30 work for you?"',
		'"Perfect, it\'s booked. Thank you!"',
		'',
	],
};

const TRANSCRIPTS: Record<Lang, { who: string; color: string; text: string }[]> = {
	es: [
		{ who: 'Marta', color: ACCENT, text: 'Buenas tardes, soy Marta, una asistente de inteligencia artificial. Llamo de parte de un inquilino interesado en el piso de la calle Sueca.' },
		{ who: 'Agente', color: '#6B675F', text: '¿Sigue disponible? Sí, sí. ¿Cuándo querría verlo?' },
		{ who: 'Marta', color: ACCENT, text: 'Mi cliente puede el jueves a partir de las 17:00 o el viernes por la mañana. ¿Qué le viene mejor?' },
		{ who: 'Agente', color: '#6B675F', text: 'El jueves a las 17:30 me va perfecto. ¿Me pasa su nombre?' },
	],
	en: [
		{ who: 'Marta', color: ACCENT, text: "Good afternoon, I'm Marta, an AI assistant. I'm calling on behalf of a tenant interested in the flat on Calle Sueca." },
		{ who: 'Agent', color: '#6B675F', text: 'Is it still available? Yes, yes. When would they like to see it?' },
		{ who: 'Marta', color: ACCENT, text: 'My client is free Thursday from 5pm, or Friday morning. Which suits you better?' },
		{ who: 'Agent', color: '#6B675F', text: 'Thursday at 5:30 works perfectly. Can I take their name?' },
	],
};

function mm(n: number): string {
	return '0:' + String(n).padStart(2, '0');
}

function initReveal() {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('visible');
					observer.unobserve(entry.target);
				}
			});
		},
		{ threshold: 0.1 },
	);
	document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

	function revealInView() {
		document.querySelectorAll<HTMLElement>('.reveal:not(.visible)').forEach((el) => {
			const r = el.getBoundingClientRect();
			if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
				el.classList.add('visible');
				observer.unobserve(el);
			}
		});
		const pain = document.querySelector('[data-screen-label="Pain strip"]');
		if (pain) {
			const pr = pain.getBoundingClientRect();
			if (pr.top < window.innerHeight * 0.85 && pr.bottom > 0) startCount();
		}
	}

	requestAnimationFrame(revealInView);
	setTimeout(() => {
		document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
		startCount();
	}, 1200);

	return revealInView;
}

let counted = false;
function startCount() {
	if (counted) return;
	counted = true;
	const start = performance.now();
	const D = 1300;
	const replyEl = document.querySelector<HTMLElement>('[data-stat="reply-rate"]');
	const applicantsEl = document.querySelector<HTMLElement>('[data-stat="applicants"]');
	const hoursEl = document.querySelector<HTMLElement>('[data-stat="hours"]');
	const costEl = document.querySelector<HTMLElement>('[data-stat="cost"]');

	const { hoursSuffix, weekSuffix } = copy[pageLang()].pain;

	function tick(now: number) {
		const p = Math.min(1, (now - start) / D);
		const eased = 1 - Math.pow(1 - p, 3);
		if (replyEl) replyEl.textContent = Math.round(78 * eased) + '%';
		if (applicantsEl) applicantsEl.textContent = Math.round(40 * eased) + '–99';
		if (hoursEl) hoursEl.textContent = Math.round(24 * eased) + hoursSuffix;
		if (costEl) costEl.textContent = '€' + Math.round(800 * eased) + weekSuffix;
		if (p < 1) requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);
}

function initHeaderScroll(revealInView: () => void) {
	const header = document.getElementById('site-header');
	let lastSy = 0;
	let ticking = false;

	window.addEventListener(
		'scroll',
		() => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				const sy = window.scrollY;
				const down = sy > lastSy && sy > 80;
				header?.classList.toggle('hidden', down);

				const p1 = document.querySelector<HTMLElement>('[data-px="1"]');
				if (p1) p1.style.transform = `translateY(${sy * 0.08}px)`;
				const p2 = document.querySelector<HTMLElement>('[data-px="2"]');
				if (p2) p2.style.transform = `translateY(${sy * 0.04}px)`;

				revealInView();
				lastSy = Math.max(0, sy);
				ticking = false;
			});
		},
		{ passive: true },
	);
}

interface StepState {
	opacity: number;
	bg: string;
	iconColor: string;
	fw: number;
	active: boolean;
	past: boolean;
}

function computeSteps(cardStep: number): StepState[] {
	return [0, 1, 2, 3].map((i) => ({
		opacity: cardStep >= i ? 1 : 0.3,
		bg: cardStep > i ? '#1A1917' : cardStep === i && (i === 1 || i === 2) ? ACCENT : '#E3E0D8',
		iconColor: cardStep > i || (cardStep === i && (i === 0 || i === 3)) ? '#FFF' : '#6B675F',
		fw: cardStep === i || (cardStep >= 3 && i === 3) ? 500 : 400,
		active: cardStep === i,
		past: cardStep > i,
	}));
}

function initHeroCard(getLang: () => Lang) {
	const hero = document.querySelector('[data-screen-label="Hero"]');
	if (!hero) return;

	const stepEls = Array.from(hero.querySelectorAll<HTMLElement>('.step'));
	const dropdownEl = hero.querySelector<HTMLElement>('[data-dropdown]');
	const captionEl = hero.querySelector<HTMLElement>('[data-caption]');

	let cardStep = 0;
	let typeIv: ReturnType<typeof setInterval> | undefined;

	function applyCardStep(step: number) {
		const states = computeSteps(step);
		stepEls.forEach((stepEl, i) => {
			const st = states[i];
			stepEl.style.opacity = String(st.opacity);

			const dot = stepEl.querySelector<HTMLElement>('[data-dot]');
			if (dot) dot.style.background = st.bg;

			const label = stepEl.querySelector<HTMLElement>('[data-label]');
			if (label) label.style.fontWeight = String(st.fw);

			const checkIcon = stepEl.querySelector<SVGElement>('[data-icon="check"]');
			const ring = stepEl.querySelector<HTMLElement>('[data-ring]');

			if (i === 0 || i === 3) {
				checkIcon?.setAttribute('stroke', st.iconColor);
			} else {
				const otherIcon = stepEl.querySelector<SVGElement>(
					i === 1 ? '[data-icon="phone"]' : '[data-icon="briefcase"]',
				);
				// SVGElement has no `hidden` IDL reflection (that's HTMLElement-only), so
				// toggling the .hidden property here is a silent no-op — use the attribute directly.
				if (ring) ring.hidden = !st.active;
				checkIcon?.toggleAttribute('hidden', !st.past);
				otherIcon?.toggleAttribute('hidden', !st.active);
			}
		});

		if (dropdownEl) dropdownEl.style.transform = step >= 3 ? 'translateY(0)' : 'translateY(100%)';
	}

	function typeCaption(step: number, lang: Lang) {
		clearInterval(typeIv);
		const full = CAPTIONS[lang][step] ?? '';
		if (captionEl) captionEl.textContent = '';
		if (!full) return;
		let i = 0;
		typeIv = setInterval(() => {
			i++;
			if (captionEl) captionEl.textContent = full.slice(0, i);
			if (i >= full.length) clearInterval(typeIv);
		}, 30);
	}

	applyCardStep(0);
	typeCaption(0, getLang());

	setInterval(() => {
		if (document.hidden) return;
		cardStep = (cardStep + 1) % 5;
		applyCardStep(cardStep);
		typeCaption(cardStep, getLang());
	}, 2200);

	return { getCardStep: () => cardStep, typeCaption };
}

function initDemoPlayer(getLang: () => Lang) {
	const demo = document.querySelector('[data-screen-label="Live demo"]');
	if (!demo) return null;

	const DUR = 34;
	const waveEl = demo.querySelector<HTMLElement>('[data-wave]');
	const playBtn = demo.querySelector<HTMLButtonElement>('[data-play]');
	const timeEl = demo.querySelector<HTMLElement>('[data-time]');
	const transcriptEl = demo.querySelector<HTMLElement>('[data-transcript]');

	const audioBars = Array.from({ length: 48 }).map((_, i) => ({
		h: Math.round(22 + (Math.abs(Math.sin(i * 0.7)) * 0.6 + Math.abs(Math.sin(i * 0.23)) * 0.4) * 78),
		dur: 0.5 + Math.random() * 0.55,
		del: Math.random() * -1.3,
	}));

	const barEls: HTMLElement[] = [];
	if (waveEl) {
		audioBars.forEach((b) => {
			const bar = document.createElement('div');
			bar.className = 'bar';
			bar.style.height = b.h + '%';
			waveEl.appendChild(bar);
			barEls.push(bar);
		});
	}

	let t = 0;
	let playing = false;
	let playIv: ReturnType<typeof setInterval> | undefined;

	function renderWave() {
		barEls.forEach((bar, i) => {
			const b = audioBars[i];
			const on = (i + 0.5) / audioBars.length <= t / DUR;
			bar.style.background = on ? ACCENT : '#D8D4CC';
			bar.style.animation = playing
				? `audioBounce ${b.dur}s ease-in-out ${b.del}s infinite alternate`
				: 'none';
		});
		if (timeEl) timeEl.textContent = `${mm(t)} / ${mm(DUR)}`;
		waveEl?.setAttribute('aria-valuenow', String(t));
	}

	function renderTranscript() {
		if (!transcriptEl) return;
		const lines = TRANSCRIPTS[getLang()];
		const activeLine = t > 0 ? Math.min(lines.length - 1, Math.floor(t / (DUR / lines.length))) : -1;
		transcriptEl.innerHTML = '';
		lines.forEach((line, i) => {
			const rowOpacity = activeLine === -1 ? 1 : i === activeLine ? 1 : 0.4;
			const weight = activeLine === i ? 500 : 300;

			const row = document.createElement('div');
			row.className = 'line';
			row.style.opacity = String(rowOpacity);

			const who = document.createElement('div');
			who.className = 'who';
			who.style.color = line.color;
			who.textContent = line.who;

			const text = document.createElement('div');
			text.className = 'text';
			text.style.fontWeight = String(weight);
			text.textContent = line.text;

			row.append(who, text);
			transcriptEl.appendChild(row);
		});
	}

	function updatePlayBtn() {
		if (playBtn) playBtn.textContent = playing ? '❚❚' : '▶';
	}

	function togglePlay() {
		if (playing) {
			clearInterval(playIv);
			playing = false;
		} else {
			playIv = setInterval(() => {
				t += 1;
				if (t >= DUR) {
					clearInterval(playIv);
					t = 0;
					playing = false;
				}
				renderWave();
			}, 1000);
			playing = true;
		}
		renderWave();
		updatePlayBtn();
	}

	function seekTo(frac: number) {
		t = Math.max(0, Math.min(DUR, Math.round(frac * DUR)));
		renderWave();
		renderTranscript();
	}

	playBtn?.addEventListener('click', togglePlay);
	waveEl?.addEventListener('click', (e) => {
		const r = waveEl.getBoundingClientRect();
		seekTo((e.clientX - r.left) / r.width);
	});
	waveEl?.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			seekTo((t + 1) / DUR);
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			seekTo((t - 1) / DUR);
		}
	});

	renderWave();
	renderTranscript();
	updatePlayBtn();

	return { renderTranscript };
}

function initTranscriptToggle(onChange: (lang: Lang) => void) {
	let lang: Lang = pageLang();

	function applyButtons() {
		document.querySelectorAll<HTMLElement>('[data-transcript-lang]').forEach((btn) => {
			btn.dataset.active = String(btn.dataset.transcriptLang === lang);
		});
	}

	function setLang(next: Lang) {
		lang = next;
		applyButtons();
		onChange(lang);
	}

	document.querySelectorAll<HTMLElement>('[data-transcript-lang]').forEach((btn) => {
		btn.addEventListener('click', () => {
			const next = btn.dataset.transcriptLang as Lang;
			setLang(next);
		});
	});

	applyButtons();
	return { getLang: () => lang };
}

function initFaqAccordion() {
	const items = document.querySelectorAll<HTMLElement>('[data-faq-list] .item');
	items.forEach((item) => {
		const toggle = item.querySelector<HTMLButtonElement>('[data-faq-toggle]');
		const answer = item.querySelector<HTMLElement>('[data-faq-answer]');
		const glyph = item.querySelector<HTMLElement>('[data-faq-glyph]');

		toggle?.addEventListener('click', () => {
			const isOpen = toggle.getAttribute('aria-expanded') === 'true';

			items.forEach((other) => {
				if (other === item) return;
				other.querySelector('[data-faq-toggle]')?.setAttribute('aria-expanded', 'false');
				const otherAnswer = other.querySelector<HTMLElement>('[data-faq-answer]');
				if (otherAnswer) otherAnswer.hidden = true;
				const otherGlyph = other.querySelector<HTMLElement>('[data-faq-glyph]');
				if (otherGlyph) otherGlyph.textContent = '+';
			});

			toggle.setAttribute('aria-expanded', String(!isOpen));
			if (answer) answer.hidden = isOpen;
			if (glyph) glyph.textContent = isOpen ? '+' : '−';
		});
	});
}

function initWaitlistModal() {
	const overlay = document.querySelector<HTMLElement>('[data-modal-overlay]');
	const modal = document.querySelector<HTMLElement>('[data-modal]');
	const formWrap = document.querySelector<HTMLElement>('[data-modal-form]');
	const successWrap = document.querySelector<HTMLElement>('[data-modal-success]');
	const successHeading = successWrap?.querySelector<HTMLElement>('h3');
	const form = document.querySelector<HTMLFormElement>('[data-waitlist-form]');
	const submitBtn = document.querySelector<HTMLButtonElement>('[data-waitlist-submit]');
	const statusEl = document.querySelector<HTMLElement>('[data-form-status]');
	if (!overlay) return;

	const t = copy[pageLang()].waitlist;

	function setStatus(message: string) {
		if (!statusEl) return;
		statusEl.textContent = message;
		statusEl.focus();
	}

	function openModal(e?: Event) {
		e?.preventDefault();
		overlay!.hidden = false;
	}

	function closeModal() {
		overlay!.hidden = true;
		form?.reset();
		if (statusEl) statusEl.textContent = '';
		if (formWrap) formWrap.hidden = false;
		if (successWrap) successWrap.hidden = true;
		if (submitBtn) {
			submitBtn.disabled = false;
			submitBtn.textContent = t.submit;
		}
	}

	document.querySelectorAll('[data-open-waitlist]').forEach((el) => {
		el.addEventListener('click', openModal);
	});
	overlay.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) closeModal();
	});
	modal?.addEventListener('click', (e) => e.stopPropagation());
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && !overlay!.hidden) closeModal();
	});

	form?.addEventListener('submit', async (e) => {
		e.preventDefault();
		if (!submitBtn) return;

		if (statusEl) statusEl.textContent = '';
		submitBtn.disabled = true;
		submitBtn.textContent = t.submitting;

		const data = new FormData(form);
		const payload = {
			email: data.get('email'),
			company: data.get('company'), // honeypot
		};

		try {
			const res = await fetch('/api/waitlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				if (formWrap) formWrap.hidden = true;
				if (successWrap) successWrap.hidden = false;
				successHeading?.focus();
				// Conversion event, distinct from the click-based tracking in BaseLayout —
				// this only fires once the signup actually succeeds.
				(window as unknown as { dataLayer: unknown[] }).dataLayer =
					(window as unknown as { dataLayer: unknown[] }).dataLayer || [];
				(window as unknown as { dataLayer: unknown[] }).dataLayer.push({ event: 'waitlist_signup_success' });
				return;
			}

			let message = t.errorGeneric;
			try {
				const body = (await res.json()) as { error?: string };
				if (body.error) message = body.error;
			} catch {
				// keep the generic fallback above
			}
			setStatus(message);
		} catch {
			setStatus(t.errorNetwork);
		} finally {
			submitBtn.disabled = false;
			submitBtn.textContent = t.submit;
		}
	});
}

function init() {
	const revealInView = initReveal();
	initHeaderScroll(revealInView);
	initFaqAccordion();
	initWaitlistModal();

	// Lang state is shared between the hero caption and the demo transcript.
	let heroApi: ReturnType<typeof initHeroCard>;
	let demoApi: ReturnType<typeof initDemoPlayer>;
	const langApi = initTranscriptToggle((lang) => {
		if (heroApi) heroApi.typeCaption(heroApi.getCardStep(), lang);
		demoApi?.renderTranscript();
	});
	heroApi = initHeroCard(langApi.getLang);
	demoApi = initDemoPlayer(langApi.getLang);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
