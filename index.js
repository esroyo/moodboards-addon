//var self = require('sdk/self');

// a dummy function, to show how tests work. 
// to see how to test this function, look at ../test/test-main.js
//function dummy(text, callback) {
//  callback(text);
//}

//exports.dummy = dummy;
const buttons = require('sdk/ui/button/toggle');
const tabs = require('sdk/tabs');
const cm = require('sdk/context-menu');
const ss = require('sdk/simple-storage');
const { Cc, Ci, Cu } = require('chrome');

require('proxy-server');
var _button, _cmenu,
    _tab, _worker,
    _locked = false;
    defaultTitle = 'My moodboards';

function Picture(prop) {
    this.src = prop.src;
    this.onCanvas = false;
}

function Board(name) {
    this.name = name;
    this.pictures = [];
}

Board.prototype.addNewPictures = function() {
    if (!_worker) return;

    if (!_locked) {
        _locked = true;
        this.pictures.forEach(function(pic, idx) {
            if (!pic.onCanvas) {
                pic.onCanvas = true;
                _worker.port.emit('picture:add', {
                    src: pic.src,
                    idx: idx
                });
            }
        });
        _locked = false;
    }
};

function buildMenu() {
    _cmenu.items.forEach(function(item) {
        _cmenu.removeItem(item);
    });
    ss.storage.boards.forEach(function(board, idx) {
        _cmenu.addItem(
            cm.Item({
                label: board.name,
                data: idx.toString()
            })
        );
    });

    if (ss.storage.boards.length)
        _cmenu.addItem(cm.Separator());

    _cmenu.addItem(cm.Item({
        label: 'New moodboard ...',
        data: 'new'
    }));
}

function updateListOnTab() {
    console.log('Send order to update moodboards list...');
    if (_tab && _worker) {
        _worker.port.emit('list:restore',
            ss.storage.boards.map(function(board) {
                return board.name;
            })
        );
    } else {
        console.log('Order was not send :( _tab: ' + !!_tab + ' _worker: ' + !!_worker);
    }
}

function onOpen(tab) {
    _tab = tab;
    _tab.title = defaultTitle;
}

function onReady(tab) {
    _worker = tab.attach({
        contentScriptFile: [
            './lib/foundation/js/vendor/jquery.js',
            './lib/foundation/js/foundation.min.js',
            './lib/fabric/dist/fabric.min.js',
            './handle-canvas.js'
        ]
    });

    /* tab event */
    _worker.port.on('board:load', loadBoard);

    _worker.port.on('board:store', function(json) {
        if (ss.storage.currentBoard !== undefined) {
            console.log('The canvas changed! STORE!');
            ss.storage.boards[ss.storage.currentBoard].json = json;
        }
    });
    _worker.port.on('board:save', function(options) {
        if (ss.storage.currentBoard !== undefined) {
            console.log('The moodboard options changed! SAVE!');
            if (options.name) {
                ss.storage.boards[ss.storage.currentBoard].name = options.name;
                updateListOnTab();
                buildMenu();
                _tab.title = 'Moodboard: ' + options.name;
            }
        }
    });
    _worker.port.on('board:export', function(data) {
        //tabs.open(data);
        var type = data.split(',')[0].split(':')[1].split(';')[0].split('/')[1];
        var utils = require('sdk/window/utils');
        var active = utils.getMostRecentBrowserWindow();

        const nsIFilePicker = Ci.nsIFilePicker;

        var fp = Cc["@mozilla.org/filepicker;1"]
            .createInstance(nsIFilePicker);
        fp.init(active, "Save as image", nsIFilePicker.modeSave);
        fp.appendFilter("Image", "*." + type);

        var rv = fp.show();
        if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
            var file = fp.file;
            // Get the path as string. Note that you usually won't 
            // need to work with the string paths.
            var path = fp.file.path;

            var parts = path.split('.');
            if (parts[parts.length - 1] !== type)
                path = path + '.' + type;

            Cu.import("resource://gre/modules/Downloads.jsm");
            Cu.import("resource://gre/modules/osfile.jsm");
            Cu.import("resource://gre/modules/Task.jsm");

            Task.spawn(function () {
                yield Downloads.fetch(data, path);
            }).then(null, Cu.reportError);

        }
    });

    _worker.port.on('board:delete', function(options) {
        if (ss.storage.currentBoard !== undefined) {
            var idx = ss.storage.currentBoard;
            ss.storage.currentBoard = undefined;
            console.log('Oh my good! You have deleted moodboard with idx '+idx+'!');
            ss.storage.boards.splice(idx, 1);
            updateListOnTab();
            buildMenu();
            _tab.title = defaultTitle;
        }
    });
}

function onLoad(tab) {
    /* init tab */
    updateListOnTab();

    if (ss.storage.currentBoard !== undefined) {
        loadBoard(ss.storage.currentBoard);
    }
    /* init tab end */
}

function onClose(tab) {
    _button.checked = false;
    _tab = _worker = undefined;
}

function createNewTab() {
    tabs.open({
        url: './index.html',
        isPinned: true,
        onOpen,
        onReady,
        onLoad,
        onClose 
    });
}

function loadBoard(idx) {
        ss.storage.currentBoard = undefined;
        console.log('Loading board with idx ' + idx);
        var board = ss.storage.boards[idx];
        if (!board) return;

        ss.storage.currentBoard = idx;
        _worker.port.emit('board:restore', board);
        _worker.port.on('board:restored', function() {
            console.log('The board ' + ss.storage.currentBoard + ' has been restored. AddNewPictures to it .....');
            ss.storage.boards[ss.storage.currentBoard].addNewPictures();
        });
        _tab.title = 'Moodboard: ' + board.name;
}

_cmenu = cm.Menu({
    label: 'Add Image to moodboard',
    image: require("sdk/self").data.url('assets/img/pin-16.png'),
    context: cm.SelectorContext('img'),
    contentScriptFile: './handle-cm.js',
    onMessage: function(msg) {
        if (msg.name) { // new moodboard
            msg.idx = ss.storage.boards.push(new Board(msg.name)) - 1;
            buildMenu();
            updateListOnTab();
        }
        var imgIdx = ss.storage.boards[msg.idx].pictures.push(new Picture(msg)) - 1;
        if (_tab && ss.storage.currentBoard === msg.idx) {
            // LOOK HERE
            console.log('The moodboards tab is open and shows board with idx' + msg.idx);
            ss.storage.boards[msg.idx].pictures[imgIdx].onCanvas = true;
            _worker.port.emit('picture:add', {src: msg.src, idx: imgIdx});
        }
    }
});

function checkTab() {
    if (this.url.indexOf('resource://moodboards-addon') > -1) {
        _tab = this;
        _button.checked = true;
        onReady(_tab);
        onLoad(_tab);
        onOpen(_tab);
        _tab.onOpen = onOpen;
        _tab.onClose = onClose;
    }
}

function initializeAddon() {

    require("sdk/system/unload").when(function(reason) {
        if (reason === 'uninstall' || reason === 'disable') {
            if (_worker) {
                _worker.destroy();
            }
            if (_tab) {
                _tab.close();
            }
        }
    });


    ss.storage.boards = ss.storage.boards || [];

    for (let tab of tabs) {
        if (tab.readyState === 'interactive' || tab.readyState === 'complete') {
            checkTab(tab);
        } else {
            tab.on('ready', checkTab.bind(tab)); 
        }
    }

    buildMenu();
}

/* the button for the Firefox toolbar */
_button = buttons.ToggleButton({
    id: 'moodboards-addon',
    label: 'Quick moodboards',
    icon: {
        16:'./assets/img/moodboard-16.png',
        32:'./assets/img/moodboard-32.png',
        64:'./assets/img/moodboard-64.png'
    },
    onChange: function() {
        // delete the window state for the current window,
        // automatically set when the user click on the button
        this.state('window', null);

        // now that the state hierarchy is clean, set the global state
        this.checked = !this.checked;
        if (this.checked) {
            if (_tab) {
                _tab.activate();
            } else {
                createNewTab();
            }
        } else if (_tab) {
            _tab.close();
        }
    }
});

/* init add-on */
initializeAddon();
