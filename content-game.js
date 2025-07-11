function getEnteredWords() {
	return Array.from(document.querySelectorAll("ul.sb-wordlist-items-pag li"))
		.map(el => el.textContent.trim().toLowerCase())
		.filter(w => w.length > 0);
}

chrome.storage.local.get("sb_hints", ({ sb_hints }) => {
	if (!sb_hints) return;

	const entered = getEnteredWords();
	console.log({ sb_hints });
});

