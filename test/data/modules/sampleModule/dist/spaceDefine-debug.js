define("test/sampleModule/0.0.1/spaceDefine-debug", [], function(require, exports) {
    // var a = require('a');
    // var b = require('b');
    // var c = require('c');
    // var $ = require('$');
    exports.get = function(id) {
        return $(id);
    };
});