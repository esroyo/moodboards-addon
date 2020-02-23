browser.browserAction.onClicked.addListener(function () {

    browser.tabs.query({
        url: browser.runtime.getURL('/src/pages/addon/index.html'),
    })
    .then(function ([tab]) {
        if (!tab) {
            // If no addon tab present: open
            browser.tabs.create({
                url: '/src/pages/addon/index.html',
            });
        } else if (tab.active) {
            // If the addon tab is currently active: highlight
            browser.tabs.highlight({ tabs: [tab.index] });
        } else {
            // If the addon tab is currently not-active: activate
            browser.tabs.update(tab.id, { active: true });
        }
    });
});
