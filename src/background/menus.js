const updateMenu = (function () {

    let rootId;
    const otherIds = [];

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
            rootId = browser.menus.create({
                id: 'main',
                title: 'Add Image to moodboard',
                documentUrlPatterns: ['http://*/*', 'https://*/*'],
                contexts: ['all'],
            });
        }

        while (otherIds.length) {
            browser.menus.remove(otherIds.pop());
        }

        browser.storage.local.get({ boards: [] }).then(function ({ boards }) {
            boards.forEach(function ({ name }, id) {
                otherIds.push(browser.menus.create({
                    id: `add-${id}`,
                    title: `Add to "${name}"`,
                    parentId: rootId,
                    // icons: {
                    //     16: 'assets/img/pin.svg',
                    // },
                    onclick,
                }));
            });
        }).then(function () {
            otherIds.push(browser.menus.create({
                id: `ruler`,
                type: 'separator',
                parentId: rootId,
            }));
            otherIds.push(browser.menus.create({
                id: 'add-new',
                title: 'Add to a new moodboard',
                parentId: rootId,
                onclick,
            }));
        });
    }

}());
