document.addEventListener('DOMContentLoaded', function () {
    browser.runtime.sendMessage({ type: 'setupme' });
});
