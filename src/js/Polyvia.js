// `Polyvia` handles Delaunay Trianglate in a relative coordinate,
// but not the rendering part.
// Rendering is handled in `PRenderer`, which is responsive according
// to output size.


define(function (require, exports, module) {
    console.log('Polyvia');

    var GlRenderer = require('GlRenderer');

    function Polyvia(imgPath, imgId, canvas, options) {
        var that = this;

        // original image
        this.srcImg = new Image();
        this.srcImg.src = imgPath;
        this.srcImg.onload = function() {
            that.renderer = new GlRenderer(canvas, that);
            that.render();
        };

        this.imgId = imgId;

        // set options
        this.set(options);
    };



    Polyvia.prototype.render = function() {
        // console.time('track');
        this.faces = [];
        this.renderer.render();

        // var that = this;
        // if (that.faces !== undefined) {
        //     that.renderer.render();
        // } else {
        //     // face detection
        //     var tracker = new tracking.ObjectTracker(['face']);
        //     tracker.setStepSize(1.8);
        //     tracking.track('#' + this.imgId, tracker);
        //     tracker.on('track', function(event) {
        //         console.timeEnd('track');
        //         that.faces = [];
        //         event.data.forEach(function(rect) {
        //             console.log(rect);
        //             that.faces.push([rect.x, rect.y, rect.width, rect.height]);
        //         });
        //         // TODO: removing faking face positions
        //         //that.faces.push([218, 107, 200, 200]);
        //         // render
        //         that.renderer.render();
        //     });
        // }
    }



    Polyvia.prototype.set = function(options) {
        // TODO: extends options neatly
        this.options = options || {
            vertexCnt: 1000,
            edgeWeight: 0.9,
            renderVertices: true
        };
    }



    // Polyvia.prototype.getVertices = function() {
    //     // coordinate of vertexes are calculated in 
    //     // (w, h) belonging to ([0, 1], [0, 1])

    //     // draw image to canvas to get source image
    //     tracking.Fast.THRESHOLD = 10;
    //     var canvas = document.createElement('canvas');
    //     var w = this.srcImg.width;
    //     var h = this.srcImg.height;
    //     canvas.width = w;
    //     canvas.height = h;
    //     var ctx = canvas.getContext('2d');
    //     ctx.drawImage(this.srcImg, 0, 0, w, h);
    //     var imageData = ctx.getImageData(0, 0, w, h);

    //     // edge detection
    //     var sobel = tracking.Image.sobel(imageData.data, w, h);
    //     var sobelGray = tracking.Image.grayscale(sobel, w, h);
    //     var threshold = 50;  // TODO
    //     var corners = [];
    //     var faceEdges = [];
    //     for (var i = 0; i < h; ++i) {
    //         for (var j = 0; j < w; ++j) {
    //             if (sobelGray[i * w + j] > threshold) {
    //                 var isInFace = false;
    //                 for (var f = 0; f < this.faces.length; ++f) {
    //                     if (j > this.faces[f][0] - this.faces[f][2] * 0.1
    //                             && j < this.faces[f][0] + this.faces[f][2] * 1.1
    //                             && i > this.faces[f][1] - this.faces[f][3] * 0.1
    //                             && i < this.faces[f][1] + this.faces[f][3] * 1.1) {
    //                         // edges in face area
    //                         faceEdges.push([j / w, i / h]);
    //                         isInFace = true;
    //                     }
    //                 }
    //                 if (!isInFace) {
    //                     corners.push([j / w, i / h]);
    //                 }
    //             }
    //         }
    //     }



    //     this.vertexArr = [[0, 0], [1, 0], [0, 1], [1, 1]];
    //     var vCnt = this.options.vertexCnt - 4; // four corners pushed already
    //     var fCnt = Math.min(faceEdges.length, 
    //             vCnt * this.options.edgeWeight * 0.5);
    //     var cCnt = Math.min(corners.length, vCnt * this.options.edgeWeight);

    //     // push edges in face area
    //     for (var i = 0; i < fCnt; ++i) {
    //         var id = Math.floor(Math.random() * faceEdges.length);
    //         if (!faceEdges[id]['added']) {
    //             this.vertexArr.push(faceEdges[id]);
    //             faceEdges[id]['added'] = true;
    //         }
    //     }

    //     // push other edges
    //     for (var i = this.vertexArr.length; i < cCnt; ++i) {
    //         var id = Math.floor(Math.random() * corners.length);
    //         if (!corners[id]['added']) {
    //             this.vertexArr.push(corners[id]);
    //             corners[id]['added'] = true;
    //         }
    //     }

    //     // push other edges
    //     for (var i = this.vertexArr.length; i < vCnt - cCnt; i++) {
    //         this.vertexArr.push([Math.random(), Math.random()]);
    //     };
    //     return this.vertexArr;
    // }
    return Polyvia;
});
