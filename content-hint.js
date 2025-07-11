function parsePrefixClues() {
	const clues = {};
	const clueLines = Array.from(document.querySelectorAll("p, li"))
		.map(p => p.textContent.trim())
		.filter(t => /^[a-z]{2}-\d/.test(t));

	for (let line of clueLines) {
		line.split(/\s+/).forEach(pair => {
			const [prefix, count] = pair.split("-");
			clues[prefix.toUpperCase()] = parseInt(count);
		});
	}

	return clues;
}

function parseMatrix() {
	const matrix = {};
	const table = document.querySelector("table.table");
	if (!table) return null;

	const rows = Array.from(table.querySelectorAll("tr.row"));

	// First row is the header — extract the lengths like [4, 5, 6, 7, 8, 9, 11]
	const headerCells = rows[0].querySelectorAll("td.cell");
	const wordLengths = Array.from(headerCells)
		.slice(1, -1)
		.map(cell => parseInt(cell.textContent));

	// Loop through all body rows except first (header) and last (Σ row)
	for (const row of rows.slice(1, -1)) {
		const cells = row.querySelectorAll("td.cell");
		const firstLetterCell = cells[0];
		const totalCell = cells[cells.length - 1];
		const letterMatch = firstLetterCell.textContent.trim().match(/^([a-z]):$/i);

		if (!letterMatch) continue; // skip if not a valid row
		const letter = letterMatch[1]; // .toLowerCase();

		const counts = Array.from(cells)
			.slice(1, -1) // skip first (letter) and last (Σ)
			.map(cell => {
				const t = cell.textContent.trim();
				return t === "-" ? 0 : parseInt(t, 10);
			});

		matrix[letter.toUpperCase()] = counts;
	}

	return {
		matrix,
		wordLengths,
	};
}

function saveHintData() {
	console.log("[start] hint parsing...");
	const prefixes = parsePrefixClues();
	const matrixResults = parseMatrix();
	console.log({ matrixResults });
	const timestamp = new Date().toISOString();

	chrome.storage.local.set({
		sb_hints: {
			prefixes,
			matrix: matrixResults.matrix,
			matrixLength: matrixResults.wordLengths,
			timestamp
		}
	}, () => console.log("Spelling Bee hint data saved!"));
}

saveHintData();

