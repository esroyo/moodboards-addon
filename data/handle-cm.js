self.on('click', function(node, data) {
    var msg = {
        src: node.src,
        idx: parseInt(data)
    };
    if (data == 'new') {
        while (!msg.name) {
            msg.name = prompt('Please enter the name for the new moodboard', '').trim();
        }
    }
    self.postMessage(msg);
});
