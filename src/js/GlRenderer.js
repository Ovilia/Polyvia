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
    };



    GlRenderer.prototype.render = function() {
        this.rerender();

        // this.setWireframe(this.polyvia.options.renderVertices);
    };



    // display and hide wireframe
    GlRenderer.prototype.setWireframe = function(hasWireframe) {
        this.wireframeMesh.visible = hasWireframe;
        this.renderer.render(this.scene, this.camera);
    };



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
        var srcTexture = THREE.ImageUtils.loadTexture('../src/img/mao.png', {},
            function() {
                console.time('composer');
                that.composer.render();
                console.timeEnd('composer');

                console.time('readPixels');
                // read pixels of edge detection
                var pixels = new Uint8Array(size.w * size.h * 4);
                var gl = that.renderer.getContext();
                gl.readPixels(size.ow, size.oh, size.w, size.h,
                    gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                console.timeEnd('readPixels');
                
                console.time('vertex');
                that.vertices = [[0, 0], [0, 1], [1, 0], [1, 1]];
                // append to vertex array
                console.log(size.w, size.h);
                var i = 0;
                for (var x = 0; x < size.w; ++x) {
                    for (var y = 0; y < size.h; ++y) {
                        if (pixels[i] > 0) {
                            // is a selected edge vertex
                            that.vertices.push([x, y]);
                            console.log(x, y);
                        }
                        // console.log(pixels[i]);
                        i += 4;
                    }
                }
                console.log('vertex cnt:', that.vertices.length);
                console.timeEnd('vertex');

                // calculate delaunay triangles
                console.time('triangle');
                that.triangles = Delaunay.triangulate(that.vertices);
                console.log('triangle cnt:', that.triangles.length);
                console.timeEnd('triangle');

                // render triangle meshes
                console.time('render');
                that.renderTriangles();
                console.timeEnd('render');
                console.timeEnd('total');
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
    };



    // render triangle meshes to screen
    GlRenderer.prototype.renderTriangles = function() {
        this.faceMesh = [];
        var wireframeGeo = new THREE.Geometry();
        var vertices = this.vertices;
        var triangles = this.triangles;
        var size = this.getRenderSize(this.polyvia.srcImg.width,
                this.polyvia.srcImg.height);
        for (var i = 0; i < vertices.length; i++) {
            var plane = new THREE.Mesh(new THREE.PlaneGeometry(3, 3),
                new THREE.MeshBasicMaterial({color: 0xffff00}));
            plane.position.set(vertices[i][0] + size.dw, vertices[i][1] + size.dh, 1);
            this.scene.add(plane);
        };
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
        //     geo.vertices.push(new THREE.Vector3(a[0], a[1], 1));
        //     geo.vertices.push(new THREE.Vector3(b[0], b[1], 1));
        //     geo.vertices.push(new THREE.Vector3(c[0], c[1], 1));
        //     geo.faces.push(new THREE.Face3(0, 1, 2));
        //     geo.faces[0].color = new THREE.Color(rgb);
        //     var mesh = new THREE.Mesh(geo, this.faceMaterial);
        //     this.faceMesh.push(mesh);
        //     this.scene.add(mesh);

        //     // wireframe mesh
        //     wireframeGeo.vertices.push(new THREE.Vector3(a[0], a[1], 2));
        //     wireframeGeo.vertices.push(new THREE.Vector3(b[0], b[1], 2));
        //     wireframeGeo.vertices.push(new THREE.Vector3(c[0], c[1], 2));
        //     wireframeGeo.faces.push(new THREE.Face3(triangles.length - i - 1,
        //             triangles.length - i, triangles.length - i + 1));
        // }
        // add wireframe mesh to scene
        this.wireframeMesh = new THREE.Mesh(wireframeGeo, 
                this.wireframeMaterial);
        this.scene.add(this.wireframeMesh);

        this.renderer.render(this.scene, this.camera);
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
            var w = Math.floor(ch / ih * iw);
            var h = ch;
            var ow = Math.floor((cw - w) / 2); // offset
            var oh = 0;
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
            var h = Math.floor(cw / iw * ih);
            var ow = 0;
            var oh = Math.floor((ch - h) / 2);
        }

        return {
            w: w,
            h: h,
            dw: Math.floor(ow - cw / 2),
            dh: Math.floor(oh - ch / 2),
            ow: ow,
            oh: oh
        };
    }

    return GlRenderer;
});
