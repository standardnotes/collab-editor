(function () {

    var TextPatcher = {};

/*  diff takes two strings, the old content, and the desired content
    it returns the difference between these two strings in the form
    of an 'Operation' (as defined in chainpad.js).

    diff is purely functional.
*/
var diff = TextPatcher.diff = function (oldval, newval) {
    // Strings are immutable and have reference equality. I think this test is O(1), so its worth doing.
    if (oldval === newval) {
        return;
    }

    var commonStart = 0;
    while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
        commonStart++;
    }

    var commonEnd = 0;
    while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) &&
        commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
        commonEnd++;
    }

    var toRemove = 0;
    var toInsert = '';

    /*  throw some assertions in here before dropping patches into the realtime */
    if (oldval.length !== commonStart + commonEnd) {
        toRemove = oldval.length - commonStart - commonEnd;
    }
    if (newval.length !== commonStart + commonEnd) {
        toInsert = newval.slice(commonStart, newval.length - commonEnd);
    }

    return {
        type: 'Operation',
        offset: commonStart,
        toInsert: toInsert,
        toRemove: toRemove
    };
};

/*  patch accepts a realtime facade and an operation (which might be falsey)
    it applies the operation to the realtime as components (remove/insert)

    patch has no return value, and operates solely through side effects on
    the realtime facade.
*/
var patch = TextPatcher.patch = function (ctx, op) {
    if (!op) { return; }

    if (ctx.patch) {
        ctx.patch(op.offset, op.toRemove, op.toInsert);
    } else {
        console.log("chainpad.remove and chainpad.insert are deprecated. "+
            "update your chainpad installation to the latest version.");
        if (op.toRemove) { ctx.remove(op.offset, op.toRemove); }
        if (op.toInsert) { ctx.insert(op.offset, op.toInsert); }
    }
};

/*  format has the same signature as log, but doesn't log to the console
    use it to get the pretty version of a diff */
var format = TextPatcher.format = function (text, op) {
    return op?{
        insert: op.toInsert,
        remove: text.slice(op.offset, op.offset + op.toRemove)
    }: { insert: '', remove: '' };
};

/*  log accepts a string and an operation, and prints an object to the console
    the object will display the content which is to be removed, and the content
    which will be inserted in its place.

    log is useful for debugging, but can otherwise be disabled.
*/
var log = TextPatcher.log = function (text, op) {
    if (!op) { return; }
    console.log(format(text, op));
};

/* applyChange takes:
    ctx: the context (aka the realtime)
    oldval: the old value
    newval: the new value

    it performs a diff on the two values, and generates patches
    which are then passed into `ctx.remove` and `ctx.insert`.

    Due to its reliance on patch, applyChange has side effects on the supplied
    realtime facade.
*/
var applyChange = TextPatcher.applyChange = function(ctx, oldval, newval, logging) {
    var op = diff(oldval, newval);
    if (logging) { log(oldval, op); }
    patch(ctx, op);
};

var transformCursor = TextPatcher.transformCursor = function (cursor, op) {
    if (!op) { return cursor; }
    var pos = op.offset;
    var remove = op.toRemove;
    var insert = op.toInsert.length;
    if (typeof cursor === 'undefined') { return; }
    if (typeof remove === 'number' && pos < cursor) {
        cursor -= Math.min(remove, cursor - pos);
    }
    if (typeof insert === 'number' && pos < cursor) {
        cursor += insert;
    }
    return cursor;
};

var create = TextPatcher.create = function(config) {
    var ctx = config.realtime;
    var logging = config.logging;

    // initial state will always fail the !== check in genop.
    // because nothing will equal this object
    var content = {};

    // *** remote -> local changes
    ctx.onPatch(function(pos, length) {
        content = ctx.getUserDoc();
    });

    // propogate()
    return function (newContent, force) {
        if (newContent !== content || force) {
            applyChange(ctx, ctx.getUserDoc(), newContent, logging);
            if (ctx.getUserDoc() !== newContent) {
                console.log("Expected that: `ctx.getUserDoc() === newContent`!");
            }
            else { content = ctx.getUserDoc(); }
            return true;
        }
        return false;
    };
};

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = TextPatcher;
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define(function () {
            return TextPatcher;
        });
    } else {
        window.TextPatcher = TextPatcher;
    }
}());
