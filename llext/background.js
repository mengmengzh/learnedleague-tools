chrome.webRequest.onCompleted.addListener(function (details) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { greeting: "loaded" }, function (response) {
    });
  });
}, { urls: ["https://*.learnedleague.com/oneday/results.php*", "https://*.learnedleague.com/oneday.php*"] });

chrome.runtime.onMessage.addListener(
  function (message, sender, sendResponse) {
    if (message.enableAddon == true) {
      chrome.pageAction.show(sender.tab.id);
    }
    if (message.enableAddon == false) {
      chrome.pageAction.hide(sender.tab.id);
    }
    sendResponse();
  }
);