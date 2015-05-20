// `Polyvia` handles Delaunay Trianglate in a relative coordinate,
// but not the rendering part.
// Rendering is handled in `PRenderer`, which is responsive according
// to output size.

define(function(require, exports, module) {

    var PRenderer = require('PRenderer');

    require('tracking');

    function Polyvia(imgPath, canvas, options) {
        var that = this;

        this.renderer = new PRenderer(canvas);

        // original image
        this.srcImg = new Image();
        this.srcImg.src = imgPath;
        this.srcImg.onload = function() {
            that.render();
        };

        // set options
        this.set(options);
    };

    module.exports = Polyvia;



    Polyvia.prototype.render = function() {
        this.renderer.render(this);
    }



    Polyvia.prototype.set = function(options) {
        // TODO: extends options neatly
        this.options = options || {
            vertexCnt: 1000,
            edgeWeight: 9
        };
    }



    Polyvia.prototype.getVertices = function() {
        // coordinate of vertexes are calculated in 
        // (w, h) belonging to ([0, 1], [0, 1])

        // calculate corners
        tracking.Fast.THRESHOLD = 10;
        var canvas = document.createElement('canvas');
        var w = this.srcImg.width;
        var h = this.srcImg.height;
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(this.srcImg, 0, 0, w, h);
        var imageData = ctx.getImageData(0, 0, w, h);
        this.grayImage = tracking.Image.grayscale(imageData.data, w, h);
        var corners = tracking.Fast.findCorners(this.grayImage, w, h);

        // push corner vertices into vertex arrary
        this.vertexArr = [[0, 0], [1, 0], [0, 1], [1, 1]];
        var cCnt = corners.length / 2;
        var vCnt = this.options.vertexCnt - 4; // four corners pushed already
        for (var i = 0; i < vCnt; ++i) {
            var id = Math.floor(Math.random() * cCnt) * 2;
            this.vertexArr.push([corners[id] / w, corners[id + 1] / h]);
        }
        if (vCnt > cCnt) {
            // push more random vertices if corners are not enough
            for (var i = 0; i < vCnt - cCnt; i++) {
                this.vertexArr.push([Math.random(), Math.random()]);
            };
        }
        return this.vertexArr;
    }
});
