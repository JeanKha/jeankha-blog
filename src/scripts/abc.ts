export {};

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
					// Đo đúng chiều rộng khung chứa thật để bản nhạc lấp đầy, không bị cụt
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
				synthControl.load(controlsEl, null, {
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