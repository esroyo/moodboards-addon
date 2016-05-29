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

function findSrc(e) {
    let src = getSrc(e);

    if (src) {
        return src;
    }

    for (let child of e.children) {
        src = findSrc(child);
        if (src) {
            return src;
        }
    }

    let current = e;
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

