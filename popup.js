function parseFormattedDate(dateStr) {
	//	const dateStr = document.querySelector("span.pz-game-date")?.textContent.trim() ? parseFormattedDate(dateStr) : null;

	const date = new Date(dateStr);

	console.log("Date:", date, dateStr);

	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	const yyyy = date.getFullYear();
	return `${yyyy}/${mm}/${dd}`;
}

function renderPrefixProgress(hints, enteredWords, container) {
	//	const container = document.getElementById("prefixes");
	//	container.innerHTML = "";

	const twoLetter = document.createElement("div");
	twoLetter.innerHTML = "<h3>Two Letter List</h3>";

	container.appendChild(twoLetter);

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
	for (const firstLetter of Object.keys(groups).sort()) {
		const lineDiv = document.createElement("div");

		const lineText = groups[firstLetter]
			.map(({ prefix, matched, count }) => `<span style="font-weight: 500;">${prefix}</span> <span class= ${matched.trim() == count.trim() ? 'done count' : 'count'}> ${matched}/${count}</span>`)
			.join("  "); // two spaces for separation

		lineDiv.innerHTML = lineText;
		container.appendChild(lineDiv);
	}
}

//function renderProgress(hints, enteredWords) {
function callback(hints, enteredWords, puzzDate) {
	console.log({ enteredWords });
	const container = document.getElementById("prefixes");
	const status = document.getElementById("status");

	container.innerHTML = "";

	status.innerHTML = "";
	if (puzzDate) {
		status.innerHTML = `${new Date(puzzDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
	}

	if (!enteredWords) {
		console.log("Early return?");

		const linkToPlay = document.createElement("a");
		linkToPlay.className = "linktoplay";
		linkToPlay.href = "https://nytimes.com/puzzles/spelling-bee/";
		linkToPlay.innerText = "Play today's NYT Spelling Bee!"
		linkToPlay.target = "_blank";

		const subText = document.createElement("div");
		subText.innerHTML = "And come back here to track your progress.";
		subText.marginLeft = "2px";
		subText.fontWeight = "bold";

		container.appendChild(linkToPlay);
		container.appendChild(subText);
		return;
	}

	enteredWords = enteredWords.map(x => x.toUpperCase());

	const totalWords = Object.values(hints.prefixes).reduce((sum, count) => sum + count, 0);
	const enteredCount = enteredWords.length;

	console.log({ totalWords, enteredCount });

	// Display progress at the top
	const progressDiv = document.createElement("div");
	progressDiv.style.marginBottom = "8px";
	progressDiv.style.marginTop = "8px";
	progressDiv.style.fontSize = "18px";
	progressDiv.innerHTML = `<b id='totalwords'> Total Words:</b> ${enteredCount} / ${totalWords}`;
	container.appendChild(progressDiv);

	container.appendChild(document.createElement("hr"));

	renderPrefixProgress(hints, enteredWords, container);

	container.appendChild(document.createElement("hr"));

	console.log(hints.matrix, hints.matrixLength);
	if (hints.matrix && hints.matrixLength) {

		const matrixSection = document.createElement("div");
		matrixSection.innerHTML = "<h3>Spelling Bee Grid</h3>";

		// Create table
		const table = document.createElement("table");
		table.style.borderCollapse = "collapse";
		table.style.width = "100%";

		// Table header row
		const thead = document.createElement("thead");
		const headerRow = document.createElement("tr");

		// First empty top-left cell
		headerRow.appendChild(document.createElement("th"));

		// Add length headers, e.g. 4,5,6,7,8,9,11
		for (const len of hints.matrixLength) {
			const th = document.createElement("th");
			th.textContent = len;
			th.style.border = "1px solid #ccc";
			th.style.padding = "4px 8px";
			th.style.textAlign = "center";
			th.style.fontFamily = "monospace";  // for nice fixed-width alignment
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
			letterTd.style.border = "1px solid #ccc";
			letterTd.style.padding = "4px 8px";
			letterTd.style.textAlign = "center";
			letterTd.style.fontFamily = "monospace";
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
				td.style.border = "1px solid #ccc";
				td.style.textAlign = "center";
				td.style.fontFamily = "monospace";

				if (expected > 0) {
					td.style.color = found >= expected ? "green" : "#555";
					td.style.fontWeight = found >= expected ? "bold" : "normal";
				}

				tr.appendChild(td);
			}

			tbody.appendChild(tr);

		}
		table.appendChild(tbody);
		matrixSection.appendChild(table);
		container.appendChild(matrixSection);
	}
}

function executeScript(tabId, func) {
	return chrome.scripting.executeScript({
		target: { tabId },
		func
	}).then(results => results?.[0]?.result);
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

	console.log("puzz date:", puzzDate);

	chrome.storage.local.get("sb_hints", ({ sb_hints }) => {
		if (!sb_hints || !sb_hints[puzzDate]) {
			const status = document.getElementById("status");
			const container = document.getElementById("prefixes");

			container.innerHTML = "";

			const linkToHints = document.createElement("a");

			linkToHints.className = "linktoplay";

			linkToHints.href = `https://www.nytimes.com/${puzzDate}/crosswords/spelling-bee-forum.html`;

			linkToHints.innerText = "Get Official Hints!"

			linkToHints.target = "_blank";

			status.innerHTML = "";

			container.appendChild(linkToHints);

			return;
		}

		chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => {
				return Array.from(document.querySelectorAll("ul.sb-wordlist-items-pag li"))
					.map(el => el.textContent.trim().toLowerCase())
					.filter(Boolean);
			}
		}, results => {
			console.log({ results });
			if (chrome.runtime.lastError || !results || !results[0]) {

				callback(sb_hints[puzzDate], [], null);
			} else {
				callback(sb_hints[puzzDate], results[0].result, puzzDate);
			}
		});

	});
});

