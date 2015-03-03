jQuery(document).ready(function($) {

    var $body = $('body');

    if (!$body.hasClass('moodboards'))
        return;

    $(document).foundation();

    var defaultBackground = 'black',
        canvas = new fabric.Canvas('board', {
            backgroundColor: defaultBackground }),
        $container = $('.main'),
        $list = $('#moodboards-list'),
        saveTimeout = 1000,
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

    function loadBoard(idx) {
        self.port.emit('board:load', idx);
        canvas.clear();
    }

    self.port.on('list:restore', function(boards) {

        if (!boards.length) return;

        $list.empty();
        boards.map(function(name, idx) {
            return $('<a href="#" data-board="' + idx + '">' + name + '</a>').
                    click(function(e) {
                        e.preventDefault();
                        loadBoard($(this).data('board'));
                    });
        }).forEach(function(item) {
            $('<li>').append(item).appendTo($list);
        });

    });

    self.port.on('board:restore', function(board) {
        $name.val(board.name);
        setExportDefaults();
        $body.removeClass('no-board');
        if (board.json) {
            canvas.loadFromJSON(board.json, function() {
                canvas.renderAll();
                self.port.emit('board:restored');
            });
            $background.val(board.json.background);
        }
        else { // immediate
            canvas.setBackgroundColor(defaultBackground, canvas.renderAll.bind(canvas));
            $background.val(defaultBackground);
            self.port.emit('board:restored');
        }
    });

    self.port.on('picture:add', function(pic) {
        fabric.Image.fromURL(pic.src, function(img) {
            canvas.add(img);
        }, {crossOrigin:'anonymous'});
    });

    /* DOM events start */
    $(window).resize(Foundation.utils.throttle(respondCanvas, resizeTimeout));

    canvas.on('after:render',
        Foundation.utils.debounce(function(options) {
            self.port.emit('board:store', canvas.toJSON());
        }, saveTimeout)
    );

    canvas.on('object:selected', function(sel) {
        if (sel.target.type !== 'group') {
            //canvas.sendBackwards(object)
            //canvas.sendToBack(object)
            //canvas.bringForward(selection.target)
            canvas.bringToFront(sel.target)
        }
    });

    $body.keyup(function(e) {
        if (e.keyCode == 46) { //delete
            if(canvas.getActiveGroup()){
                canvas.getActiveGroup().forEachObject(function(o){ canvas.remove(o) });
                canvas.discardActiveGroup().renderAll();
            } else {
                canvas.remove(canvas.getActiveObject());
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
        self.port.emit('board:export', canvas.toDataURL(options));
    });

    $remove.click(function(e) {
        e.preventDefault();
        if (confirm('This action CANNOT be undone. This will permanently delete this moodboard. Are you ABSOLUTELY sure?')) {
            self.port.emit('board:delete');
            canvas.clear();
            canvas.setBackgroundColor(defaultBackground, canvas.renderAll.bind(canvas));
            $('#options a.close-reveal-modal').trigger('click');
            $body.addClass('no-board');
        }
    });

    $save.click(function(e) {
        e.preventDefault();
        var options = $('#options > form').serializeArray()
            .reduce(function(prev, cur) {
                prev[cur.name] = cur.value;
                return prev;
            }, {});
        if (!options.name.trim()) {
            alert('Board name CANNOT be empty!');
            return false;
        }
        self.port.emit('board:save', options);
        canvas.setBackgroundColor(options.background, canvas.renderAll.bind(canvas));
        $('#options a.close-reveal-modal').trigger('click');
    });
    /* DOM events end */

    /* initial calls */
    respondCanvas();

});
