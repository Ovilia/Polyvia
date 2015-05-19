define(function(require, exports, module) {
    var img = './src/img/18.jpg';
    var canvas = document.getElementById('canvas');

    // init canvas width to that of window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var Polyvia = require('Polyvia');
    var p = new Polyvia(img, canvas);
});
