import gsap from "gsap";

const DRUK_FONT_FAMILY = "'Druk Wide', sans-serif";
const DRUK_FONT_LOADS = [`600 16px ${DRUK_FONT_FAMILY}`, `800 16px ${DRUK_FONT_FAMILY}`];
const DRUK_CHARS = "АБВГДЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function ensureDrukFontReady() {
	const fonts = document.fonts;

	if (!fonts?.load) {
		return Promise.resolve();
	}

	return Promise.allSettled(DRUK_FONT_LOADS.map((font) => fonts.load(font)));
}

export function mountLetters(canvas) {
	const container = canvas.parentElement;

	function getSize() {
		return {
			w: container.clientWidth || window.innerWidth,
			h: container.clientHeight || window.innerHeight,
		};
	}

	ensureDrukFontReady().finally(() => init(canvas, getSize));
}

function init(c, getSize) {
	const ctx = c.getContext("2d");
	let { w: cw, h: ch } = getSize();
	c.width = cw;
	c.height = ch;
	let radius = Math.max(cw, ch);

	const TOTAL = 99;

	const colors = [
		"#F9C996",
		"#B5D1F6",
		"#e9f4ac",
		"#ded3f4",
		"#F7B067",
		"#6C9CDC",
		"#dfef87",
		"#cfbfef",
		"#F18200",
		"#3D80D8",
		"#cde647",
		"#B2A1EA",
		"#B1620F",
		"#1760C1",
		"#96a834",
		"#8473a9",
	];

	function pr(seed) {
		return ((seed * 2654435769) >>> 0) / 4294967296;
	}

	const particles = Array.from({ length: TOTAL }, (_, i) => {
		const tier = i % 8 === 0 ? 2 : i % 3 === 1 ? 1 : 0;
		const fontWeight = i % 2 === 0 ? "800" : "600";
		const fontFamily = DRUK_FONT_FAMILY;
		const baseFontSize =
			tier === 0
				? 48 + Math.floor(pr(i * 3) * 40)
				: tier === 1
					? 100 + Math.floor(pr(i * 3 + 1) * 70)
					: 186 + Math.floor(pr(i * 3 + 2) * 70);
		const char = DRUK_CHARS[Math.floor(i * 1.618) % DRUK_CHARS.length];

		const color = colors[(i * 3 + Math.floor(pr(i) * 7)) % colors.length];

		return { x: 0, y: 0, scale: 0, rotate: 0, char, fontWeight, fontFamily, baseFontSize, color };
	});

	const tl = gsap
		.timeline({ onUpdate: draw })
		.fromTo(
			particles,
			{
				x: (i) => {
					const a = (i / TOTAL) * Math.PI * 2 - Math.PI / 2;
					return Math.cos(a * 10) * radius;
				},
				y: (i) => {
					const a = (i / TOTAL) * Math.PI * 2 - Math.PI / 2;
					return Math.sin(a * 10) * radius;
				},
				scale: 1.1,
				rotate: 0,
			},
			{
				duration: 5,
				ease: "sine",
				x: 0,
				y: 0,
				scale: 0,
				rotate: -3,
				stagger: { each: -0.05, repeat: -1 },
			},
			0,
		)
		.seek(99);

	function draw() {
		particles.sort((a, b) => a.scale - b.scale);
		ctx.clearRect(0, 0, cw, ch);
		for (const p of particles) {
			const fs = p.baseFontSize * p.scale;
			if (fs < 0.8) {
				continue;
			}
			ctx.save();
			ctx.translate(cw / 2, ch / 2);
			ctx.rotate(p.rotate);
			ctx.font = `${p.fontWeight} ${fs}px ${p.fontFamily}`;
			ctx.fillStyle = p.color;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(p.char, p.x, p.y);
			ctx.restore();
		}
	}

	const ro = new ResizeObserver(() => {
		const { w, h } = getSize();
		cw = c.width = w;
		ch = c.height = h;
		radius = Math.max(cw, ch);
		tl.invalidate();
	});
	ro.observe(c.parentElement);

	c.addEventListener("pointerup", () => {
		gsap.to(tl, { timeScale: tl.isActive() ? 0 : 1 });
	});
}
