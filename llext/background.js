chrome.webRequest.onCompleted.addListener(function(details) {
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
chrome.tabs.sendMessage(tabs[0].id, {greeting: "loaded"}, function(response) {
  });
});
	
}, {urls : ["https://*.learnedleague.com/oneday/results.php*"]});

