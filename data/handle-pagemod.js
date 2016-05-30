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

window.addEventListener('contextmenu', function(e) {
    self.port.emit('contextmenu', findSrc(e.target));
}, true);

