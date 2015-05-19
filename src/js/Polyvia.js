// `Polyvia` handles Delaunay Trianglate in a relative coordinate,
// but not the rendering part.
// Rendering is handled in `PRenderer`, which is responsive according
// to output size.

define(function(require, exports, module) {

    var PRenderer = require('PRenderer');

    function Polyvia(imgPath, ctx) {
        console.log('Polyvia init.');
        var that = this;

        this.renderer = new PRenderer(ctx);

        this.srcImg = new Image();
        this.srcImg.src = imgPath;
        this.srcImg.onload = function() {
            that.render();
        };
    };

    module.exports = Polyvia;



    Polyvia.prototype.render = function() {
        this.renderer.render(this);
    }
});
