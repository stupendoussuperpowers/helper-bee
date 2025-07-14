function parseFormattedDate(dateStr) {
	const date = new Date(dateStr);

	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	const yyyy = date.getFullYear();
	return `${yyyy}/${mm}/${dd}`;
}

function renderPrefixProgress(hints, enteredWords) {
	// Group prefixes by their first letter
	const groups = {};
	for (const prefix in hints.prefixes) {
		const count = String(hints.prefixes[prefix]).padEnd(2, ' ');
		const matched = String(enteredWords.filter(w => w.startsWith(prefix)).length).padStart(2, ' ');

		const firstLetter = prefix[0];
		if (!groups[firstLetter]) groups[firstLetter] = [];
		groups[firstLetter].push({ prefix, matched, count });
	}

	console.log({ groups });
	// Render each group as a line
	const lineDiv = document.getElementById("two-letter-list");
	for (const firstLetter of Object.keys(groups).sort()) {

		const lineText = groups[firstLetter]
			.map(({ prefix, matched, count }) => `<span class="prefix">${prefix + ' '}</span><span class=${matched.trim() == count.trim() ? 'done count' : 'count'}>${matched}/${count}</span>`).join("");

		lineDiv.innerHTML += `<div>` + lineText + `</div>`;
	}
}

function createColored(matched, count) {
	matched = String(matched);
	count = String(count);

	return `<span class=${matched.trim() == count.trim() ? 'done count' : 'count'}>
		${matched}/${count}
	</span>`;
}

function createLink(href, text, subtitle) {
	const linkToPlay = document.createElement("a");
	linkToPlay.className = "linktoplay";
	linkToPlay.href = href;
	linkToPlay.innerText = text;
	linkToPlay.target = "_blank";

	const subText = document.createElement("div");
	subText.innerHTML = subtitle;
	subText.marginLeft = "2px";
	subText.fontWeight = "bold";

	return [linkToPlay, subText];
}

function countMatchingWords(words, letters) {
	const letterSet = new Set(letters);

	let atLeastOnce = 0;
	let exactlyOnce = 0;

	for (const word of words.map(x => x.toLowerCase())) {
		const wordCounts = {};
		for (const ch of word) {
			wordCounts[ch] = (wordCounts[ch] || 0) + 1;
		}

		const hasAll = letters.every(l => wordCounts[l] >= 1);
		const hasExactlyOnce = letters.every(l => wordCounts[l] === 1);

		if (hasAll) atLeastOnce++;
		if (hasExactlyOnce) exactlyOnce++;
	}

	console.log(atLeastOnce, exactlyOnce);

	return {
		atLeastOnce,
		exactlyOnce
	};
}

function getAProgressBar(entered, total) {
	/*
	const progBar = document.createElement("div");
	progBar.class = 'sb-progress-bar';
	progBar.style = "height: 28px;";

	progBar.innerHTML = `
	<div class="sb-progress-line"></div>
	<div class="sb-progress-completed" style="width: ${entered / total * 100}%;"></div>

	<div class="sb-progress-marker" style="left: 95%;">
		<span class="sb-progress-value" style="z-index: 2; background-color: #d5d5d5" >${total}</span>
	</div>

	<div class="sb-progress-marker" style="z-index:3; left: ${entered / total * 100}%; top: -48px;">
		<span class="sb-progress-value" >${entered}</span>
	</div>
	`;

	*/

	const progressComp = document.getElementById("sb-progress-completed");
	progressComp.style.width = `${entered / total * 100}%`;

	const progressMarker = document.getElementById("sb-progress-marker");
	progressMarker.style.left = `${entered / total * 100}%`;

	const progressValue = document.getElementById("sb-progress-value");
	progressValue.innerText = `${entered}`;

	const progressTotal = document.getElementById("sb-progress-total");
	progressTotal.innerText = `${total}`;

	return;
}

//function renderProgress(hints, enteredWords) {
function callback(hints, enteredWords, puzzDate, playLetters) {
	const status = document.getElementById("status");
	status.innerHTML = "";

	if (puzzDate) {
		status.innerHTML = `${new Date(puzzDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
	}

	if (!enteredWords) {
		const linkToPlay = document.getElementById("play-bee");
		linkToPlay.style.display = "block";

		return;
	}

	enteredWords = enteredWords.map(x => x.toUpperCase());

	const totalWords = Object.values(hints.prefixes).reduce((sum, count) => sum + count, 0);
	const enteredCount = enteredWords.length;

	console.log({ totalWords, enteredCount });

	// const progressBarContainer = document.getElementById("progress-bar");
	const barProgress = getAProgressBar(enteredCount, totalWords);
	// progressBarContainer.appendChild(barProgress);


	const { atLeastOnce, exactlyOnce } = countMatchingWords(enteredWords, playLetters);

	const pangramDiv = document.getElementById("pangram");
	pangramDiv.innerHTML = createColored(atLeastOnce, hints.pangrams);

	const perfectDiv = document.getElementById("perfect");
	perfectDiv.innerHTML = createColored(exactlyOnce, hints.perfect);

	renderPrefixProgress(hints, enteredWords);


	console.log(hints.matrix, hints.matrixLength);
	if (hints.matrix && hints.matrixLength) {
		const table = document.getElementById("spelling-bee-grid");
		// Table header row
		const thead = document.createElement("thead");
		const headerRow = document.createElement("tr");

		// First empty top-left cell
		headerRow.appendChild(document.createElement("th"));

		// Add length headers, e.g. 4,5,6,7,8,9,11
		for (const len of hints.matrixLength) {
			const th = document.createElement("th");
			th.textContent = len;
			headerRow.appendChild(th);
		}
		thead.appendChild(headerRow);
		table.appendChild(thead);

		// Table body
		const tbody = document.createElement("tbody");

		for (const [letter, expectedCounts] of Object.entries(hints.matrix)) {
			const tr = document.createElement("tr");

			// Letter cell
			const letterTd = document.createElement("td");
			letterTd.textContent = letter;
			letterTd.style.fontWeight = "bold";
			tr.appendChild(letterTd);

			// Count cells
			const foundCounts = new Array(expectedCounts.length).fill(0);
			for (const word of enteredWords) {
				if (word.startsWith(letter)) {
					const len = word.length;
					const idx = hints.matrixLength.indexOf(len);
					if (idx !== -1) foundCounts[idx]++;
				}
			}

			for (let i = 0; i < expectedCounts.length; i++) {
				const td = document.createElement("td");
				const found = foundCounts[i];
				const expected = expectedCounts[i];

				td.textContent = expected > 0 ? `${found}/${expected}` : "";

				td.className = expected > 0 && found >= expected ? "done mcount" : "mcount";
				tr.appendChild(td);
			}

			tbody.appendChild(tr);

		}
		table.appendChild(tbody);
	}

	const allTheHints = document.getElementById("all-the-hints");
	allTheHints.style.display = "block";
}

function executeScript(tabId, func) {
	return chrome.scripting.executeScript({
		target: { tabId },
		func
	}).then(results => results?.[0]?.result);
}

function getStorage(key) {
	return new Promise(resolve => chrome.storage.local.get(key, resolve));
}

chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
	const tab = tabs[0];
	if ((!tab || !tab.url.includes("spelling-bee")) || tab.url.includes("spelling-bee-forum")) {
		callback(null);
		return;
	}

	const rawDate = await executeScript(tab.id, () => {
		const el = document.querySelector("span.pz-game-date");
		return el ? el.textContent.trim() : null;
	})

	const puzzDate = parseFormattedDate(rawDate);

	const { sb_hints } = await getStorage("sb_hints");

	if (!sb_hints || !sb_hints[puzzDate]) {
		const linkToHints = document.getElementById("get-hints-link");
		linkToHints.href = `https://www.nytimes.com/${puzzDate}/crosswords/spelling-bee-forum.html`;

		const getHint = document.getElementById("get-hints");
		getHint.style.display = "block";

		return;
	}

	const playLetters = await executeScript(tab.id, () => {
		return Array.from(document.querySelectorAll("text.cell-letter"))
			.map(el => el.textContent.trim().toLowerCase())
			.filter(Boolean);
	});

	const enteredWords = await executeScript(tab.id, () => {
		return Array.from(document.querySelectorAll("ul.sb-wordlist-items-pag li"))
			.map(el => el.textContent.trim().toLowerCase())
			.filter(Boolean);
	});

	console.log({ enteredWords });
	if (chrome.runtime.lastError || !enteredWords) {
		callback(sb_hints[puzzDate], [], null, null);
	} else {
		callback(sb_hints[puzzDate], enteredWords, puzzDate, playLetters);
	}
});

