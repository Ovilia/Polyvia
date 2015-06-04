// `GLRenderer` renders the output using WebGL according to the result
// computed in `Polyvia`.

define(function(require, exports, module) {
    require('delaunay');
    require('three');

    function GlRenderer(canvas, polyvia) {
        this.canvas = canvas;
        this.polyvia = polyvia;
        this.init(polyvia);
    };

    module.exports = GlRenderer;



    GlRenderer.prototype.init = function() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas
        });
        this.renderer.setClearColor(0xffffff);

        this.scene = new THREE.Scene();
        
        this.camera = new THREE.OrthographicCamera(-this.canvas.width / 2,
                this.canvas.width / 2, -this.canvas.height / 2, 
                this.canvas.height / 2, 0, 10);
        this.camera.position.set(0, 0, 5);
        this.scene.add(this.camera);

        // render the srcImg to get pixel color later
        this.preRender(this.polyvia.srcImg);
        
        // this.plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
        //     new THREE.MeshBasicMaterial({
        //         color: 0xff0000,
        //         wireframe: true
        //     })
        // );
        // this.scene.add(this.plane);
    }



    GlRenderer.prototype.render = function() {
        var size = this.getRenderSize(this.polyvia.srcImg.width,
                this.polyvia.srcImg.height);

        // this.plane.scale.set(renderSize.w, renderSize.h, 1);

        // calculate vertex positions
        console.time('vertex');
        var vertices = this.polyvia.getVertices();
        console.timeEnd('vertex');

        // compose triangles
        console.time('triangle');
        var triangles = Delaunay.triangulate(vertices);
        console.timeEnd('triangle');

        console.time('render');
        for(var i = triangles.length - 1; i > 2; i -= 3) {
            // positions of three vertices
            var a = [vertices[triangles[i]][0] * size.w + size.dw, 
                    vertices[triangles[i]][1] * size.h + size.dh];
            var b = [vertices[triangles[i - 1]][0] * size.w + size.dw, 
                    vertices[triangles[i - 1]][1] * size.h + size.dh];
            var c = [vertices[triangles[i - 2]][0] * size.w + size.dw, 
                    vertices[triangles[i - 2]][1] * size.h + size.dh];

            // fill with color in center of gravity
            var x = (a[0] + b[0] + c[0]) / 3;
            var y = (a[1] + b[1] + c[1]) / 3;
            var pixel = this.srcCtx.getImageData(x, y, 1, 1).data;
            var rgb = 'rgb(' + pixel[0] + ', ' + pixel[1] + ', ' + pixel[2]
                    + ')';

            // draw the triangle
            var geo = new THREE.Geometry();
            geo.vertices.push(new THREE.Vector3(a[0], a[1], 0));
            geo.vertices.push(new THREE.Vector3(b[0], b[1], 0));
            geo.vertices.push(new THREE.Vector3(c[0], c[1], 0));
            geo.faces.push(new THREE.Face3(0, 1, 2));
            var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
                color: new THREE.Color(rgb),
                wireframe: true
            }));
            this.scene.add(mesh);
        }
        console.timeEnd('render');

        this.renderer.render(this.scene, this.camera);
    }



    // render origin image to get pixel color
    GlRenderer.prototype.preRender = function(img) {
        // tmp canvas
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        this.srcCtx = canvas.getContext('2d');
        this.srcCtx.drawImage(img, 0, 0, img.width, img.height);
    }



    GlRenderer.prototype.getRenderSize = function(imgWidth, imgHeight) {
        var cw = this.canvas.width;
        var ch = this.canvas.height;

        var iw = imgWidth;
        var ih = imgHeight;

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

        return {
            w: w,
            h: h,
            dw: dw - cw / 2,
            dh: dh - ch / 2
        };
    }
});
