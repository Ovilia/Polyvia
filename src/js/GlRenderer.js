// `GLRenderer` renders the output using WebGL according to the result
// computed in `Polyvia`.

define(function(require, exports, module) {
    require('delaunay');
    require('three');

    function GlRenderer(canvas) {
        this.canvas = canvas;
        this.init();
    };

    module.exports = GlRenderer;



    GlRenderer.prototype.init = function(polyvia) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas
        });
        this.renderer.setClearColor(0x000000);
        this.scene = new THREE.Scene();
        
        // camera
        // canvas size is 400x300
        this.camera = new THREE.OrthographicCamera(-this.canvas.width / 2,
                this.canvas.width / 2, -this.canvas.height / 2, 
                this.canvas.height / 2, 0, 10);
        this.camera.position.set(0, 0, 5);
        //camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.scene.add(this.camera);
        
        // a plane in the scene
        this.plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true
            })
        );
        this.scene.add(this.plane);
        
    }



    GlRenderer.prototype.render = function(polyvia) {
        var renderSize = this.getRenderSize(polyvia.srcImg.width,
                polyvia.srcImg.height);

        this.plane.scale.set(renderSize.w, renderSize.h, 1);

        this.renderer.render(this.scene, this.camera);
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
            dw: dw,
            dh: dh
        };
    }
});
