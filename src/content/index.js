let clickedElement;

document.addEventListener('mousedown', function (event) {
  clickedElement = event.target;
}, true);

function getSrc(e) {

    // img
    if (e.src) {
        return e.src;
    }

    // search background
    const style = window.getComputedStyle(e);
    const bg = style.getPropertyValue('background-image');

    if (['none', 'initial', 'inherit'].indexOf(bg) >= 0) {
        return;
    }

    const match = /url\(('|")?([^'")]*)('|")?\)/.exec(bg);

    if (match) {
        return match[2];
    }
}

function hasParent(e) {
    return e.parentNode && e.nodeName !== 'HTML';
}

function findSrc(e, backward = 2) {
    let src = getSrc(e);

    if (src) {
        return src;
    }

    // search in children
    let current = e;
    while (backward && hasParent(current)) {
        current = current.parentNode;
        backward -= 1;
    }
    for (let child of current.children) {
        src = findSrc(child, 0);
        if (src) {
            return src;
        }
    }

    // search in the ancestors
    while (current.parentNode && current.nodeName !== 'HTML') {
        current = current.parentNode;
        src = getSrc(current);
        if (src) {
            return src;
        }
    }
}

function addImage({ boardId, src, targetElementId }) {

    if (!src) {
        // If not "src" given by context click info
        // then we need to search the element where click originated
        const elem = (targetElementId && browser.contextMenus.getTargetElement(targetElementId))
            || clickedElement;
        src = elem && findSrc(elem);
    }

    return browser.storage.local.get(['boards']).then(function (result) {

        const { boards = [] } = result;

        // Create a new board
        if (boardId === undefined) {

            let name;
            while (!name) {
                name = (prompt('Please enter the name for the new moodboard', '') || '').trim();
            }
            boardId = boards.push({ name, pictures: [] }) - 1;
        }

        // Add the picture
        if (src) {
            boards[boardId].pictures.push({ src, onCanvas: false });
        }

        return browser.storage.local.set({ boards });
    });
}
