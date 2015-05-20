// `PRenderer` renders the output to canvas according to the result
// computed in `Polyvia`.

define(function(require, exports, module) {
    require('delaunay');

    function PRenderer(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d'); // drawing context of canvas
    };

    module.exports = PRenderer;



    PRenderer.prototype.render = function(polyvia) {
        var cw = this.canvas.width;
        var ch = this.canvas.height;

        var iw = polyvia.srcImg.width;
        var ih = polyvia.srcImg.height;

        // clear canvas
        this.ctx.clearRect(0, 0, cw, ch);

        if (cw / ch > iw / ih) {
            /* |----------------------|
             * |    |************|    |
             * |    |************|    |
             * |    |************|    |
             * |    |************|    |
             * |----------------------|
             */
            // clip left and right part of the canvas
            var w = ch / ih * iw;
            var h = ch;
            var dw = (cw - w) / 2; // offset
            var dh = 0;
        } else {
            /* |----------------------|
             * |                      |
             * |----------------------|
             * |**********************|
             * |**********************|
             * |----------------------|
             * |                      |
             * |----------------------|
             */
            // clip top and bottom part of the canvas
            var w = cw;
            var h = cw / iw * ih;
            var dw = 0;
            var dh = (ch - h) / 2;
        }

        // draw source image to canvas to get pixel color
        this.ctx.drawImage(polyvia.srcImg, dw, dh, w, h);

        // calculate vertex positions
        var vertices = polyvia.getVertices();

        var triangles = Delaunay.triangulate(vertices);
        for(var i = triangles.length - 1; i > 2; i -= 3) {
            // positions of three vertices
            var a = [vertices[triangles[i]][0] * w + dw, 
                    vertices[triangles[i]][1] * h + dh];
            var b = [vertices[triangles[i - 1]][0] * w + dw, 
                    vertices[triangles[i - 1]][1] * h + dh];
            var c = [vertices[triangles[i - 2]][0] * w + dw, 
                    vertices[triangles[i - 2]][1] * h + dh];

            // fill with color in center of gravity
            var x = (a[0] + b[0] + c[0]) / 3;
            var y = (a[1] + b[1] + c[1]) / 3;
            var pixel = this.ctx.getImageData(x, y, 1, 1).data;
            var rgba = 'rgba(' + pixel[0] + ', ' + pixel[1] + ', ' + pixel[2]
                    + ',' + pixel[3] + ')';
            this.ctx.fillStyle = rgba;

            // draw the triangle
            this.ctx.beginPath();
            this.ctx.moveTo(a[0], a[1]);
            this.ctx.lineTo(b[0], b[1]);
            this.ctx.lineTo(c[0], c[1]);
            this.ctx.closePath();
            this.ctx.fill();

            // draw the vertices
            // this.ctx.fillStyle = 'rgb(255, 255, 0)';
            // this.ctx.fillRect(a[0], a[1], 1, 1);
            // this.ctx.fillRect(b[0], b[1], 1, 1);
            // this.ctx.fillRect(c[0], c[1], 1, 1);
        }
    }
});
