// `GLRenderer` renders the output using WebGL according to the result
// computed in `Polyvia`.

define(function (require, exports, module) {

    var THREE            = require('three');
    THREE.CopyShader     = require('threeCopy');
    THREE.EdgeShader     = require('threeEdge');
    THREE.EffectComposer = require('threeComposer');
    THREE.MaskPass       = require('threeMask');
    THREE.RenderPass     = require('threeRender');
    THREE.ShaderPass     = require('threeShader');

    var Delaunay = require('delaunay');

    function GlRenderer(canvas, polyvia) {
        this.canvas = canvas;
        this.polyvia = polyvia;
        this.init(polyvia);
    };



    GlRenderer.prototype.init = function() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas
        });
        this.renderer.setClearColor(0x0);

        this.scene = new THREE.Scene();
        
        this.camera = new THREE.OrthographicCamera(-this.canvas.width / 2,
                this.canvas.width / 2, this.canvas.height / 2, 
                -this.canvas.height / 2, 0, 10);
        this.camera.position.set(0, 0, 5);
        this.scene.add(this.camera);

        // material for vertex wireframe
        this.wireframeMaterial = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: 0xffff00
        });
        this.wireframeMesh = null;

        // material for face color
        this.faceMaterial = new THREE.MeshBasicMaterial({
            vertexColors: THREE.FaceColors,
            color: 0xffffff
        });
        this.faceMesh = null;

        // render the srcImg to get pixel color later
        console.time('preRender');
        this.preRender(this.polyvia.srcImg);
        console.timeEnd('preRender');
    }



    GlRenderer.prototype.render = function() {
        // calculate vertex positions
        // console.time('vertex');
        // this.vertices = this.polyvia.getVertices();
        // console.timeEnd('vertex');

        // compose triangles
        console.time('triangle');
        this.vertices = [];
        this.triangles = Delaunay.triangulate(this.vertices);
        console.timeEnd('triangle');

        console.time('render');
        // this.rerender();
        console.timeEnd('render');



        // this.renderer.render(this.scene, this.camera);
        this.rerender();
        console.log('rerender');

        // this.setWireframe(this.polyvia.options.renderVertices);
    }



    // display and hide wireframe
    GlRenderer.prototype.setWireframe = function(hasWireframe) {
        this.wireframeMesh.visible = hasWireframe;
        this.renderer.render(this.scene, this.camera);
    }



    // render again without changing triangle positions
    GlRenderer.prototype.rerender = function() {
        // remove meshes from scene
        if (this.faceMesh) {
            for (var i = 0; i < this.faceMesh.length; ++i) {
                this.scene.remove(this.faceMesh[i]);
            }
        }
        if (this.wireframeMesh) {
            this.scene.remove(this.wireframeMesh);
        }

        var size = this.getRenderSize(this.polyvia.srcImg.width,
                this.polyvia.srcImg.height);

        // plane for render target
        var that = this;
        var srcTexture = THREE.ImageUtils.loadTexture('../src/img/18.jpg', {}, function() {
            that.composer.render();
            // that.renderer.render(that.scene, that.camera);
        });
        srcTexture.magFilter = THREE.LinearFilter;
        srcTexture.minFilter = THREE.LinearFilter;
        this.imgMesh = new THREE.Mesh(new THREE.PlaneGeometry(
                size.w, size.h), new THREE.MeshBasicMaterial({
                    map: srcTexture
                }));
        this.imgMesh.position.z = -1;
        this.scene.add(this.imgMesh);

        var renderPass = new THREE.RenderPass(this.scene, this.camera);

        var edgeShader = new THREE.ShaderPass(THREE.EdgeShader);

        var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
        effectCopy.renderToScreen = true;

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(edgeShader);
        this.composer.addPass(effectCopy);

        console.log(this.composer.renderTarget2);
        // composer.render();

        // this.faceMesh = [];
        // var wireframeGeo = new THREE.Geometry();
        // var vertices = this.vertices;
        // var triangles = this.triangles;
        // for(var i = triangles.length - 1; i > 2; i -= 3) {
        //     // positions of three vertices
        //     var a = [vertices[triangles[i]][0] * size.w + size.dw, 
        //             vertices[triangles[i]][1] * size.h + size.dh];
        //     var b = [vertices[triangles[i - 1]][0] * size.w + size.dw, 
        //             vertices[triangles[i - 1]][1] * size.h + size.dh];
        //     var c = [vertices[triangles[i - 2]][0] * size.w + size.dw, 
        //             vertices[triangles[i - 2]][1] * size.h + size.dh];

        //     // fill with color in center of gravity
        //     var x = Math.floor((vertices[triangles[i]][0] 
        //             + vertices[triangles[i - 1]][0] 
        //             + vertices[triangles[i - 2]][0]) / 3 
        //             * this.polyvia.srcImg.width);
        //     var y = Math.floor((vertices[triangles[i]][1] 
        //             + vertices[triangles[i - 1]][1] 
        //             + vertices[triangles[i - 2]][1]) / 3 
        //             * this.polyvia.srcImg.height);
        //     var id = (y * this.polyvia.srcImg.width + x) * 4;
        //     var rgb = 'rgb(' + this.srcPixel[id] + ', ' + this.srcPixel[id + 1]
        //             + ', ' + this.srcPixel[id + 2] + ')';

        //     // draw the triangle
        //     // face mesh
        //     var geo = new THREE.Geometry();
        //     geo.vertices.push(new THREE.Vector3(a[0], a[1], 0));
        //     geo.vertices.push(new THREE.Vector3(b[0], b[1], 0));
        //     geo.vertices.push(new THREE.Vector3(c[0], c[1], 0));
        //     geo.faces.push(new THREE.Face3(0, 1, 2));
        //     geo.faces[0].color = new THREE.Color(rgb);
        //     var mesh = new THREE.Mesh(geo, this.faceMaterial);
        //     this.faceMesh.push(mesh);
        //     this.scene.add(mesh);

        //     // wireframe mesh
        //     wireframeGeo.vertices.push(new THREE.Vector3(a[0], a[1], 1));
        //     wireframeGeo.vertices.push(new THREE.Vector3(b[0], b[1], 1));
        //     wireframeGeo.vertices.push(new THREE.Vector3(c[0], c[1], 1));
        //     wireframeGeo.faces.push(new THREE.Face3(triangles.length - i - 1,
        //             triangles.length - i, triangles.length - i + 1));
        // }
        // // add wireframe mesh to scene
        // this.wireframeMesh = new THREE.Mesh(wireframeGeo, 
        //         this.wireframeMaterial);
        // this.scene.add(this.wireframeMesh);

        // this.renderer.render(this.scene, this.camera);
    }



    GlRenderer.prototype.resize = function() {
        // TODO: this function still not works yet
        var h = this.canvas.height;
        var w = this.canvas.width;
        // this.wireframeMesh.position.y += h / 2 - this.camera.top;
        // this.wireframeMesh.position.x += w / 2 - this.camera.left;

        this.camera.left = -w / 2;
        this.camera.right = w / 2;
        this.camera.top = -h / 2;
        this.camera.right = h / 2;
        this.rerender();
        // console.log(this.camera.top);
    }



    // render origin image to get pixel color
    GlRenderer.prototype.preRender = function(img) {
        // tmp canvas
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var srcCtx = canvas.getContext('2d');
        srcCtx.drawImage(img, 0, 0, img.width, img.height);

        this.srcPixel = srcCtx.getImageData(0, 0, img.width, img.height).data;
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

    return GlRenderer;
});
