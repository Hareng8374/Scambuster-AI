chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scambuster-scan",
    title: "Scan with ScamBuster AI",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scambuster-scan" && info.selectionText) {
    chrome.storage.local.set({ selectedText: info.selectionText }, () => {
      chrome.action.openPopup();
    });
  }
});
