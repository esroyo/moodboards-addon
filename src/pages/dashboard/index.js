let updateMenu;
let addNewPictures;

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    var ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {type: mimeString});
    return blob;

}

jQuery(document).ready(function($) {

    const _config = {
        crossOriginService: '',
        defaultTitle: 'My moodboards',
    };

    var $body = $('body');

    if (!$body.hasClass('moodboards')) {
        return;
    }

    $(document).foundation();

    var defaultBackground = 'black',
        canvas = new fabric.Canvas('board', {
            backgroundColor: defaultBackground }),
        $container = $('.main'),
        $list = $('#moodboards-list'),
        saveTimeout = 800,
        storageLocked = false,
        resizeTimeout = 600,
        $name = $('#name'),
        $background = $('#background'),
        $save = $('#save'),
        $remove = $('#remove'),
        $format = $('#format'),
        $quality = $('#quality'),
        $multiplier = $('#multiplier'),
        $cropTop = $('#top'),
        $cropLeft = $('#left'),
        $cropWidth = $('#width'),
        $cropHeight = $('#height'),
        $doExport = $('#do-export');

    function setExportDefaults() {
        $format.val('png');
        $quality.val(1);
        $multiplier.val(1);
        $cropTop.val('');
        $cropLeft.val('');
        $cropWidth.val('');
        $cropHeight.val('');
    }

    function respondCanvas() {
        var w = $container.width(),
            h = $container.height();
        canvas.setDimensions({
            width: w,
            height: h
        });
        $cropWidth.attr('placeholder', w);
        $cropHeight.attr('placeholder', h);
        console.log('Dimensions of canvas where set to w: ' + $container.width() + ' h: ' + $container.height());
        //canvas.renderAll();
    }

    addNewPictures = function addNewPictures(boards, id) {
        return Promise.all(
            boards[id].pictures.map(function(pic) {
                if (pic.onCanvas) {
                    return;
                }
                return new Promise(function (resolve, reject) {
                    fabric.Image.fromURL(_config.crossOriginService + pic.src, function(img) {
                        canvas.add(img);
                        pic.onCanvas = true;
                        resolve();
                    }, { crossOrigin: 'anonymous' });
                });
            })
        ).then(function () {
            return browser.storage.local.set({ boards });
        });
    }

    function setTitle(name) {
        document.title = name
            ? `Moodboard: ${name}`
            : _config.defaultTitle;
    }

    function loadBoard(id) {

        canvas.clear();

        return browser.storage.local.get(['boards']).then(function (results) {
            const { boards = [] } = results;
            const currentBoard = boards[id] ? id : undefined;
            return browser.storage.local.set({ currentBoard }).then(() => boards);

        }).then(function (boards) {

            const board = boards[id];

            if (!board) {
                return Promise.resolve();
            }
            // restore
            $name.val(board.name);
            setExportDefaults();
            $body.removeClass('no-board');

            return new Promise(function (resolve, reject) {
                if (board.json) {

                    canvas.loadFromJSON(JSON.parse(board.json), function() {
                        canvas.renderAll();
                        addNewPictures(boards, id).then(resolve);
                    });
                    $background.val(board.json.background);

                } else { // immediate

                    canvas.setBackgroundColor(defaultBackground, canvas.renderAll.bind(canvas));
                    $background.val(defaultBackground);
                    addNewPictures(boards, id).then(resolve);
                }
            });
        });
    }

    updateMenu = function updateMenu() {

        browser.storage.local.get(['boards', 'currentBoard'])
            .then(function (results) {

                const { boards = [], currentBoard } = results;

                $list.empty();

                // set title
                setTitle(boards[currentBoard] && boards[currentBoard].name);

                if (!boards.length) {
                    $('<li><a>No moodboards</a></li>').appendTo($list);
                    return;
                }

                boards.map(function({ name }, id) {
                    return $('<a href="#" data-board="' + id + '">' + name + '</a>').
                            click(function(e) {
                                e.preventDefault();
                                loadBoard($(this).data('board'));
                            });
                }).forEach(function(item) {
                    $('<li>').append(item).appendTo($list);
                });
            });
    }

    /* DOM events start */
    $(window).resize(Foundation.utils.throttle(respondCanvas, resizeTimeout));

    canvas.on('after:render', Foundation.utils.debounce(function () {
        return browser.storage.local.get(['boards', 'currentBoard'])
            .then(function (results) {
                const { boards = [], currentBoard } = results;
                if (currentBoard !== undefined) {
                    boards[currentBoard].json = JSON.stringify(canvas.toJSON());
                    return browser.storage.local.set({ boards });
                }
            });
    }, saveTimeout));

    canvas.on('object:selected', function (sel) {
        if (sel.target.type !== 'group') {
            //canvas.sendBackwards(object)
            //canvas.sendToBack(object)
            //canvas.bringForward(selection.target)
            canvas.bringToFront(sel.target)
        }
    });

    $body.keyup(function(e) {
        if (e.keyCode == 46) { //delete
            if(canvas.getActiveObjects()){
                canvas.getActiveObjects().forEach(function (o) {
                    canvas.remove(o);
                });
                canvas.discardActiveObject().renderAll();
            }
        }
    });

    $('[data-reveal-id]').click( function (e) {
        // if no board open: avoid options modal
        if ($body.hasClass('no-board')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    $format.change(function(e) {
        $quality.prop('disabled', $(this).val() === 'png');
    });

    $doExport.click(function(e) {
        e.preventDefault();
        //canvas.renderAll(true);
        var options = $('#export > form').serializeArray()
            .reduce(function(prev, cur) {
                // no value
                if (!cur.value.trim())
                    return prev;
                // check numerics
                var parsedInt = parseInt(cur.value),
                    parsedFloat = parseFloat(cur.value);
                if (parsedInt.toString() == cur.value)
                    cur.value = parsedInt;
                if (parsedFloat.toString() == cur.value)
                    cur.value = parsedFloat;
                prev[cur.name] = cur.value;
                return prev;
            }, {});
        var name = $('#options > form input#name').val();
        browser.downloads.download({
            url: URL.createObjectURL(dataURItoBlob(canvas.toDataURL(options))),
            filename: `${name}.${options.format === 'jpeg' ? 'jpg' : options.format}`,
        }).then(function () {
            $('#export a.close-reveal-modal').trigger('click');
        });
    });

    $remove.click(function on_remove(e) {

        e.preventDefault();

        $remove.prop('disabled', true);

        if (!confirm('This action CANNOT be undone. This will permanently delete this moodboard. Are you ABSOLUTELY sure?')) {
            $remove.prop('disabled', false);
            return;
        }

        browser.storage.local.get(['boards', 'currentBoard'])
            .then(function (results) {
                let { boards = [], currentBoard } = results;
                if (currentBoard === undefined) {
                    $remove.prop('disabled', false);
                    throw new Error('No board selected as currentBoard');
                }
                boards.splice(currentBoard, 1);
                currentBoard = undefined;
                canvas.clear();
                canvas.setBackgroundColor(defaultBackground, canvas.renderAll.bind(canvas));
                // Note: forced to remove cause storage array removal works strange here :-/
                return browser.storage.local.remove(['boards', 'currentBoard'])
                    .then(function () {
                        return browser.storage.local.set({ boards, currentBoard });
                    });
            })
            .then(function () {
                $('#options a.close-reveal-modal').trigger('click');
                $body.addClass('no-board');
                $remove.prop('disabled', false);
                updateMenu();
            });
    });

    $save.click(function on_save(e) {

        e.preventDefault();

        $save.prop('disabled', true);

        var options = $('#options > form').serializeArray()
            .reduce(function(prev, cur) {
                prev[cur.name] = cur.value;
                return prev;
            }, {});

        if (!options.name.trim()) {
            alert('Board name CANNOT be empty!');
            $save.prop('disabled', false);
            return false;
        }

        browser.storage.local.get(['boards', 'currentBoard'])
            .then(function (results) {
                const { boards = [], currentBoard } = results;
                if (currentBoard === undefined) {
                    $save.prop('disabled', false);
                    throw new Error('No board selected as currentBoard');
                }
                boards[currentBoard].name = options.name;
                return browser.storage.local.set({ boards });
            }).then(function () {
                canvas.setBackgroundColor(options.background, canvas.renderAll.bind(canvas));
                $('#options a.close-reveal-modal').trigger('click');
                $save.prop('disabled', false);
            });
    });
    /* DOM events end */

    /* initial calls */
    updateMenu();
    respondCanvas();
    browser.storage.local.get(['boards', 'currentBoard'])
        .then(function (results) {
            const { boards = [], currentBoard } = results;
            if (currentBoard !== undefined) {
                return loadBoard(currentBoard);
            } else if (boards.length) {
                return loadBoard(0);
            }
        });

});
