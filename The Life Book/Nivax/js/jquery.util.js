/* this file to expand the jquery function*/

$.fn.get_charof = function () {
    //split the text by cursor
    var left, right;
    var s = window.getSelection();
    //TODO:Add IE support ,this function just for chrome/ff
    s.anchorOffset > s.focusOffset ? (left = s.focusOffset, right = s.anchorOffset) : (left = s.anchorOffset, right = s.focusOffset);

    // console.log($(this)[0].innerText,o)
    var text = $(this).text();

    var l = text.length;
    var left_c = text.slice(0, left);
    var right_c = text.slice(right, l);
    //s.deleteFromDocument();
    return [left_c, right_c];
};

$.fn.saveRange = function () {
    if (window.getSelection) { //non IE Browsers
        var saveoffset = window.getSelection().focusOffset;
    }
    //else if (document.selection) { // IE
    //}
    return saveoffset;
};

$.fn.restoreRange = function (savedRange, current) {
    if (window.getSelection) { // non IE Browsers
        var textNode;
        var s = window.getSelection();
        if (current) textNode = $(this)[0].firstChild;
        else textNode = $(this).children('.content').children('.editer').children('i')[0].firstChild;
        var range = document.createRange();
        try {
            range.setStart(textNode, savedRange);
            range.collapse(true);
            s.removeAllRanges();
            s.addRange(range);
        } catch (e) {
            return;
        }
    }
    //else if (document.selection) { //IE
    //}
};