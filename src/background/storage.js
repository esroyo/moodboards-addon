function onStorageChange(changes, area) {

    const env = window.__background === true ? 'BACKGROUND' : 'PAGE';

    if (area !== 'local') {
        return;
    }

    // Change in the amount of boards
    const num_boards_diff = changes.boards && (changes.boards.oldValue || []).length !== (changes.boards.newValue || []).length;
    // Change in the name of the boards
    const name_boards_diff = changes.boards && (changes.boards.oldValue || []).map(b => b.name).join(',') !== (changes.boards.newValue || []).map(b => b.name).join(',');

    if (num_boards_diff || name_boards_diff) {
        updateMenu();
        return;
    }

    // Change in the selected board
    if (changes.currentBoard) {
        updateMenu();
        return;
    }

    // Change in the amount of pictures (only in the addon page)
    if (env === 'PAGE') {
        browser.storage.local.get(['currentBoard'])
            .then(function (result) {
                const { currentBoard } = result;
                if (currentBoard === undefined) {
                    return
                }
                const boardOldValue = changes.boards && (changes.boards.oldValue || [])[currentBoard];
                const boardNewValue = changes.boards && (changes.boards.newValue || [])[currentBoard];
                const num_pics_diff = boardOldValue && boardNewValue && boardOldValue.pictures.length !== boardNewValue.pictures.length;
                if (num_pics_diff) {
                    return addNewPictures(changes.boards.newValue, currentBoard);
                }
            });
    }
}

browser.storage.onChanged.addListener(onStorageChange);
