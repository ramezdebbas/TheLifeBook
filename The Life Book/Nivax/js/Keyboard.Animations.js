(function () {
    // Alias for animation namespace
    var AnimationMetrics = Windows.UI.Core.AnimationMetrics;

    // This class is used later on...
    var OffsetArray = WinJS.Class.define(function (offset, defOffset) {
        // Constructor
        if (Array.isArray(offset) && offset.length > 0) {
            this.offsetArray = offset;
        } else if (offset && offset.hasOwnProperty("top") && offset.hasOwnProperty("left")) {
            this.offsetArray = [offset];
        } else if (defOffset) {
            this.offsetArray = defOffset;
        } else {
            this.offsetArray = [{ top: "0px", left: "11px", rtlflip: true }]; // Default to 11 pixel from the left (or right if RTL)
        }
    }, { // Public Members
        getOffset: function (i) {
            if (i >= this.offsetArray.length) {
                i = this.offsetArray.length - 1;
            };
            return this.offsetArray[i];
        }
    });

    function uniformizeNumber(s, flipSign, elem) {
        s = s.toString();
        for (var lastLetter = s.length; s.charAt(lastLetter - 1) > "9"; lastLetter--) {
        }
        var val = parseFloat(s.substring(0, lastLetter));
        if (val && flipSign && window.getComputedStyle(elem).direction === "rtl") {
            val = -val;
        }
        return val.toString() + s.substring(lastLetter);
    }

    // ...as is this function
    function translateCallback(offsetArray, prefix) {
        prefix = prefix || "";
        return function (i, elem) {
            var offset = offsetArray.getOffset(i);
            return prefix + "translate(" + uniformizeNumber(offset.left, offset.rtlflip, elem) + ", " + uniformizeNumber(offset.top) + ")";
        };
    }

    function roundControl(x) {
        return Math.round(x * 10) / 10;
    }

    // Get the metrics for the "ShowPanel" and "HidePanel" animation curves, which are used by the Input Pane
    var showAnimation = AnimationMetrics.AnimationDescription(AnimationMetrics.AnimationEffect.showPanel, AnimationMetrics.AnimationEffectTarget.primary).animations[0];
    var hideAnimation = AnimationMetrics.AnimationDescription(AnimationMetrics.AnimationEffect.hidePanel, AnimationMetrics.AnimationEffectTarget.primary).animations[0];

    // Create a new namespace to hold the animation functions
    WinJS.Namespace.define("Keyboard.Animations", {

        // The semantics for these animation functions are just like the WinJS.UI.Animation functions
        // Use this function to move an element up above the soft keyboard when the soft keyboard appears
        inputPaneShowing: function (element, offset) {
            var offsetArray = new OffsetArray(offset);
            return WinJS.UI.executeAnimation(element,
            {
                property: "transform",
                delay: 0,
                duration: showAnimation.duration,
                timing: "cubic-bezier(" + roundControl(showAnimation.control1.x) + "," + roundControl(showAnimation.control1.y) + "," + roundControl(showAnimation.control2.x) + "," + roundControl(showAnimation.control2.y) + ")",
                from: "translate(0px, 0px)",
                to: translateCallback(offsetArray)
            });
        },

        // Use this function to move an element back down when the soft keyboard disappears
        inputPaneHiding: function (element, offset) {
            var offsetArray = new OffsetArray(offset);
            return WinJS.UI.executeAnimation(element,
            {
                property: "transform",
                delay: 0,
                duration: hideAnimation.duration,
                timing: "cubic-bezier(" + roundControl(hideAnimation.control1.x) + "," + roundControl(hideAnimation.control1.y) + "," + roundControl(hideAnimation.control2.x) + "," + roundControl(hideAnimation.control2.y) + ")",
                from: translateCallback(offsetArray),
                to: "translate(0px, 0px)"
            });
        }
    });
})();