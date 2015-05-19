// `Polyvia` handles Delaunay Trianglate in a relative coordinate,
// but not the rendering part.
// Rendering is handled in `PRenderer`, which is responsive according
// to output size.

define(function(require, exports, module) {

    var PRenderer = require('PRenderer');

    function Polyvia(imgPath, canvas, options) {
        console.log('Polyvia init.');
        var that = this;

        this.renderer = new PRenderer(canvas);

        // original image
        this.srcImg = new Image();
        this.srcImg.src = imgPath;
        this.srcImg.onload = function() {
            that.render();
        };

        // options
        // TODO: extends options neatly
        this.options = options || {
            vertexCnt: 1000
        };
    };

    module.exports = Polyvia;



    Polyvia.prototype.render = function() {
        this.renderer.render(this);
    }



    Polyvia.prototype.getVertices = function() {
        // coordinate of vertexes are calculated in 
        // (w, h) belonging to ([0, 1], [0, imgHeight / imgWidth])
        var imgWidth = this.srcImg.width;
        var imgHeight = this.srcImg.height;
        var maxWidth = imgWidth ? 1 : 0;
        var maxHeight = imgWidth ? imgHeight / imgWidth : 0;

        // TODO: compute vertexes according to pixel color

        this.vertexArr = [[0, 0], [1, 0], [0, 1], [1, 1]];
        var len = this.options.vertexCnt - 4; // four corners pushed already
        for (var i = 0; i < len; ++i) {
            this.vertexArr.push([Math.random(), Math.random()]);
        }
        return this.vertexArr;
    }
});
