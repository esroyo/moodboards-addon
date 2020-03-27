const updateMenu = (function () {

    let rootId;
    const otherIds = [];
    const documentUrlPatterns = ['http://*/*', 'https://*/*'];
    const contexts = ['all'];

    function onclick(info, tab) {
        const boardId = info.menuItemId === 'add-new'
            ? 'undefined'
            : info.menuItemId.split('-')[1];
        browser.tabs.executeScript(tab.id, {
            frameId: info.frameId,
            code: `addImage({ boardId: ${boardId}, src: '${info.srcUrl || ''}', targetElementId: ${info.targetElementId} })`,
        });
    }

    return function updateMenu() {

        if (!rootId) {
            rootId = browser.contextMenus.create({
                id: 'main',
                title: 'Add Image to moodboard',
                documentUrlPatterns,
                contexts,
            });
        }

        while (otherIds.length) {
            browser.contextMenus.remove(otherIds.pop());
        }

        browser.storage.local.get(['boards']).then(function (result) {
            const { boards = [] } = result;
            boards.forEach(function ({ name }, id) {
                otherIds.push(browser.contextMenus.create({
                    id: `add-${id}`,
                    title: `Add to "${name}"`,
                    documentUrlPatterns,
                    contexts,
                    parentId: rootId,
                    // icons: {
                    //     16: 'assets/img/pin.svg',
                    // },
                    onclick,
                }));
            });
        }).then(function () {
            otherIds.push(browser.contextMenus.create({
                id: `ruler`,
                type: 'separator',
                documentUrlPatterns,
                contexts,
                parentId: rootId,
            }));
            otherIds.push(browser.contextMenus.create({
                id: 'add-new',
                title: 'Add to a new moodboard',
                documentUrlPatterns,
                contexts,
                parentId: rootId,
                onclick,
            }));
        });
    }

}());
