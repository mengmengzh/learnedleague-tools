// Grab the logged in user from the welcome message
var welcomeSpan = $('span:contains("Welcome,")').text();
var welcomeMatch = welcomeSpan.match(/Welcome, (.*)\!/);
var currUser;
if (welcomeMatch)
{
	currUser = welcomeMatch[1];
}


var doAll;
chrome.storage.local.get({
	doAll: 0
}, function(items) {
	doAll = items.doAll;
	doCalc();
});
// initialize upon first page load, also add listener for ajax requests within page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log(sender.tab ?
		"from a content script:" + sender.tab.url :
		"from the extension");
	if (request.greeting == "loaded")
	{
		chrome.storage.local.get({
			doAll: 0
		}, function(items) {
			doAll = items.doAll;
			doCalc();
		});
	}
	sendResponse({farewell: "goodbye"});
});
chrome.storage.onChanged.addListener(function(changes, namespace) {
   for(key in changes) {
     if(key === 'doAll') {
	     doAll = changes[key].newValue;
	     doCalc();
     }
   }
 });

function doCalc()
{
	$('.llext').remove();
	// grab the row with question percentages and store the percentages
	var pctsRow = $('td.std-head-mid:contains("% incorrect:")').parent();
	var qPcts = [];
	var qCounter = 0;
	var tdCounter = 0;
	pctsRow.children().each(function() {
		tdCounter++;
		if(tdCounter >= 2 && tdCounter <= 13) {
			qPcts[qCounter] = $(this).text()*1;
			qCounter++;
		}
	});
	var resTable = pctsRow.closest('table');
	resTable.find('tr').each(function() {
		// only calculating for current user for now
		if((doAll === "1")|| (currUser && $(this).hasClass(currUser))) {
			if($(this).find('td').has('a').length == 0) {
				return;
			}
			var potentialPoints = new Array();
			qCounter = 0;
			// go through user's results and add up potential money values for each correct answer
			$(this).children().each(function() {
				if($(this).hasClass('bb')) {
					if($(this).hasClass('omg')) {
						potentialPoints.push({q:qCounter, points: 15 + qPcts[qCounter]});
					}
					qCounter++;
				}
			});
			potentialPoints.sort(function(a,b) {
				return b.points-a.points
			});
			var bestQs = new Array();
			var bestQsPoints = new Array();
			var bestScore = 0;

			// calculate best possible score and store best five questions for later
			for(var iter = 0; iter < potentialPoints.length; iter++) {
				if(iter < 5) {
					bestQs.push(potentialPoints[iter].q);
					bestScore += potentialPoints[iter].points;
					bestQsPoints[potentialPoints[iter].q] = potentialPoints[iter].points;
				} else {
					bestScore += 15;
				}
			}
			qCounter = 0;
			var doneTot = false;
			var newRow = $(this).clone();
			newRow.addClass('llext');
			newRow.children().each(function() {
				if($(this).hasClass('bb')) {
					if($.inArray(qCounter,bestQs) >= 0) {
						var llclass = "best";
						if(bestQsPoints[qCounter] > $(this).text()*1) {
							llclass += ' better';
						}
						$(this).html('<span class="llext '+llclass+'">'+bestQsPoints[qCounter]+'</span>');
					} else if($(this).hasClass('u')) {
						$(this).html('<span class="llext worse">15</span>');
					}
					qCounter++;
				}
				else if($(this).hasClass('ot') && !doneTot) {
					var llclass = "best";
					if(bestScore > $(this).text()*1) {
							llclass += ' better';
					}
					$(this).html('<span class="llext ' + llclass+'">'+bestScore+'</span>');
					doneTot = true;
				} else if(!($(this).hasClass('oc'))) {
					$(this).html('');
				}
			});
			newRow.insertAfter($(this));
		}
	});

}
