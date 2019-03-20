// Saves options to chrome.storage
function save_options() {
  var doAll = document.getElementById('doAll').value;
  chrome.storage.local.set({
    doAll: doAll
  }, function() {
    // Update status to let user know options were saved.
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get({
    doAll: 0 
  }, function(items) {
    document.getElementById('doAll').value = items.doAll;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('doAll').addEventListener('change',
    save_options);
