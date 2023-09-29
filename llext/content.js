// Grab the logged in user from the welcome message
let currUser = null;
for (const span of document.querySelectorAll('span')) {
	const match = span.textContent.match(/Welcome, (.*)\!/);
	if (match) {
		currUser = match[1];
		break;
	};
}


let doAll;
chrome.storage.local.get({
	doAll: 0
}, function (items) {
	doAll = items.doAll;
	doCalc();
});

// fire off PageAction
chrome.runtime.sendMessage({ enableAddon: true });

// initialize upon first page load, also add listener for ajax requests within page
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.greeting == "loaded") {
		chrome.storage.local.get({
			doAll: 0
		}, function (items) {
			doAll = items.doAll;
			doCalc();
		});
	}
	sendResponse({ farewell: "goodbye" });
});
chrome.storage.onChanged.addListener(function (changes, namespace) {
	for (key in changes) {
		if (key === 'doAll') {
			doAll = changes[key].newValue;
			doCalc();
		}
	}
});

function doCalc() {
	for (const llRow of document.querySelectorAll('.llext')) {
		llRow.parentNode.removeChild(llRow);
	}

	// grab the row with question percentages and store the percentages
	let pctsRow = null;
	for (const row of document.querySelectorAll('td.std-head-mid')) {
		if (row.textContent.includes('% incorrect:')) {
			pctsRow = row.parentNode;
		}
	}
	if (!pctsRow) {
		return;
	}
	let qPcts = [];
	let qCounter = 0;
	for (let i = 1; i < Math.min(pctsRow.childNodes.length, 13); i++) {
		qPcts[i - 1] = Number(pctsRow.childNodes[i].textContent);
	}
	const resTable = pctsRow.closest('table');
	if (!resTable) {
		return;
	}
	for (const resRow of resTable.querySelectorAll('tr')) {
		if ((doAll !== "1") && (!currUser || !resRow.classList.contains(currUser))) {
			continue;
		}
		if (!resRow.querySelector('td')?.querySelector('a')) {
			continue;
		}
		const potentialPoints = [];
		qCounter = 0;
		// go through user's results and add up potential money values for each correct answer
		for (const resCell of resRow.childNodes) {
			if (resCell.classList.contains('bb')) {
				if (resCell.classList.contains('omg')) {
					const selected = resCell.classList.contains('u');
					potentialPoints.push({
						q: qCounter,
						points: 15 + qPcts[qCounter],
						selected
					});
				}
				qCounter++;
			}
		}
		potentialPoints.sort((a, b) => (b.points !== a.points ? b.points - a.points : b.sel - a.sel));
		let bestQs = new Array();
		let bestQsPoints = new Array();
		let bestScore = 0;

		// calculate best possible score and store best five questions for later
		for (let iter = 0; iter < potentialPoints.length; iter++) {
			if (iter < 5) {
				bestQs.push(potentialPoints[iter].q);
				bestScore += potentialPoints[iter].points;
				bestQsPoints[potentialPoints[iter].q] = potentialPoints[iter].points;
			} else {
				bestScore += 15;
			}
		}

		const newRow = resRow.cloneNode(true);
		qCounter = 0;
		let doneTot = false;
		newRow.classList.add('llext');
		for (const newCell of newRow.childNodes) {
			if (newCell.classList.contains('bb')) {
				if (bestQs.includes(qCounter)) {
					createComparisonCell(newCell, bestQsPoints[qCounter]);
				} else if (newCell.classList.contains('u')) {
					setCell(newCell, ['llext-worse'], 15);
				}
				qCounter++;
			}
			else if (newCell.classList.contains('ot') && !doneTot) {
				createComparisonCell(newCell, bestScore);
				doneTot = true;
			} else if (!(newCell.classList.contains('oc'))) {
				newCell.replaceChildren();
			}
		}
		resRow.after(newRow);
	}
}

function createComparisonCell(cell, comparePoints) {
	const cellPoints = Number(cell.textContent);
	const classList = ['llext-best'];
	if (comparePoints > cellPoints) {
		classList.push('llext-better');
	}
	setCell(cell, classList, comparePoints);
}

function setCell(cell, classList, contents) {
	const cellSpan = document.createElement('span');
	cellSpan.textContent = contents;
	for (const cl of classList) {
		cellSpan.classList.add(cl);
	}
	cell.replaceChildren(cellSpan);
}