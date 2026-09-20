export {};

import type { NoteTimingEvent } from "abcjs";

function createCursorControl(container: HTMLElement) {
	function clearHighlights() {
		container.querySelectorAll(".abcjs-highlight").forEach((el) => el.classList.remove("abcjs-highlight"));
	}
	return {
		onStart() {
			const svg = container.querySelector("svg");
			if (!svg) return;
			const cursor = document.createElementNS("http://www.w3.org/2000/svg", "line");
			cursor.setAttribute("class", "abcjs-cursor");
			cursor.setAttribute("x1", "0");
			cursor.setAttribute("y1", "0");
			cursor.setAttribute("x2", "0");
			cursor.setAttribute("y2", "0");
			svg.appendChild(cursor);
		},
		onEvent(ev: NoteTimingEvent) {
			if (ev.measureStart && ev.left === undefined) return;
			clearHighlights();
			const noteEls = (ev.elements ?? []).flat();
			for (const el of noteEls) el.classList.add("abcjs-highlight");

			const cursor = container.querySelector("svg .abcjs-cursor") as SVGLineElement | null;
			if (cursor && ev.left !== undefined && noteEls.length) {
				const boxes = noteEls.map((el) => (el as unknown as SVGGraphicsElement).getBBox());
				const top = Math.min(...boxes.map((b) => b.y));
				const bottom = Math.max(...boxes.map((b) => b.y + b.height));
				cursor.setAttribute("x1", String(ev.left - 2));
				cursor.setAttribute("x2", String(ev.left - 2));
				cursor.setAttribute("y1", String(top));
				cursor.setAttribute("y2", String(bottom));
			}
		},
		onFinished() {
			clearHighlights();
			const cursor = container.querySelector("svg .abcjs-cursor");
			cursor?.setAttribute("x1", "0");
			cursor?.setAttribute("x2", "0");
			cursor?.setAttribute("y1", "0");
			cursor?.setAttribute("y2", "0");
		},
	};
}

const blocks = Array.from(document.querySelectorAll<HTMLElement>("pre.abc-notation"));

if (blocks.length) {
	import("abcjs")
		.then(async ({ default: abcjs }) => {
			for (const node of blocks) {
				const source = node.textContent ?? "";
				node.innerHTML = "";

				const notationEl = document.createElement("div");
				notationEl.className = "abc-notation__score";
				const controlsEl = document.createElement("div");
				controlsEl.className = "abc-notation__controls";
				node.append(notationEl, controlsEl);

				let visualObj;
				try {
					const staffwidth = Math.max(300, notationEl.clientWidth || 660);
					[visualObj] = abcjs.renderAbc(notationEl, source, {
						responsive: "resize",
						staffwidth,
						foregroundColor: "currentColor",
					});
					node.dataset.rendered = "true";
				} catch (error) {
					console.error("Could not render ABC notation", error);
					continue;
				}

				if (!abcjs.synth.supportsAudio()) {
					controlsEl.textContent = "Trình duyệt này không hỗ trợ phát âm thanh.";
					continue;
				}

				const synthControl = new abcjs.synth.SynthController();
				synthControl.load(controlsEl, createCursorControl(notationEl), {
					displayLoop: true,
					displayRestart: true,
					displayPlay: true,
					displayProgress: true,
					displayWarp: false,
				});

				try {
					await synthControl.setTune(visualObj, false, {
						soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/",
					});
				} catch (error) {
					console.error("Could not load ABC audio", error);
					controlsEl.textContent = "Không tải được âm thanh cho bản nhạc này.";
				}
			}
		})
		.catch((error) => console.error("Could not load abcjs", error));
}