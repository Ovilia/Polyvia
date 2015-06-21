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

    function GlRenderer(canvas, isImg, imgPath, videoWidth, videoHeight) {
        this.canvas = canvas;
        this.isImg = isImg;
        if (!isImg) {
            this.video = imgPath;
            this.videoWidth = videoWidth;
            this.videoHeight = videoHeight;
        }

        this.init();
        this.updateImage(imgPath);

        window.renderer = this;
    };



    GlRenderer.prototype.init = function() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setClearColor(0x0);

        this.scene = new THREE.Scene();
        this.finalScene = new THREE.Scene();
        
        this.camera = new THREE.OrthographicCamera(-this.canvas.width / 2,
                this.canvas.width / 2, this.canvas.height / 2, 
                -this.canvas.height / 2, 0, 10);
        this.camera.position.set(0, 0, 5);
        this.scene.add(this.camera);
        this.finalScene.add(this.camera);



        var renderPass = new THREE.RenderPass(this.scene, this.camera);

        var edgeShader = new THREE.ShaderPass(THREE.EdgeShader);

        var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
        effectCopy.renderToScreen = true;

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(edgeShader);
        this.composer.addPass(effectCopy);



        if (!this.isImg) {
            // video texture, for rendering edge texture
            this.videoImage = document.createElement('canvas');
            this.videoImage.width = this.canvas.width;
            this.videoImage.height = this.canvas.height;

            this.videoImageContext = this.videoImage.getContext('2d');
            // background color if no video present
            this.videoImageContext.fillStyle = '#000000';
            this.videoImageContext.fillRect(0, 0, this.videoImage.width, 
                this.videoImage.height);

            this.videoTexture = new THREE.Texture(this.videoImage);
            this.videoTexture.minFilter = THREE.LinearFilter;
            this.videoTexture.magFilter = THREE.LinearFilter;
            
            var videoMaterial = new THREE.MeshBasicMaterial({
                map: this.videoTexture,
                overdraw: true
            });
            var videoGeometry = new THREE.PlaneGeometry(this.videoImage.width,
                this.videoImage.height);
            this.videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
            this.videoMesh.position.set(0, 0, -1);
            this.scene.add(this.videoMesh);
        }
    };



    // display and hide wireframe
    GlRenderer.prototype.setWireframe = function(hasWireframe) {
        this.wireframeMesh.visible = hasWireframe;
        this.renderer.render(this.scene, this.camera);
    };



    // change to a new image
    GlRenderer.prototype.updateImage = function(imgPath) {
        this.imgPath = imgPath;

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
        this.preRender();
        console.timeEnd('preRender');
    };



    // render again without changing triangle positions
    GlRenderer.prototype.render = function() {
        if (!this.isImg) {
            this.preRender();
        }

        // remove meshes from scene
        if (this.faceMesh) {
            for (var i = 0; i < this.faceMesh.length; ++i) {
                this.finalScene.remove(this.faceMesh[i]);
            }
            this.faceMesh[i] = [];
        }
        if (this.wireframeMesh) {
            this.finalScene.remove(this.wireframeMesh);
            this.wireframeMesh = null;
        }

        var size = this.getRenderSize();

        // plane for render target
        var that = this;
        if (this.isImg) {
            // image
            var srcTexture = THREE.ImageUtils.loadTexture(this.imgPath, {}, process);
            srcTexture.magFilter = THREE.LinearFilter;
            srcTexture.minFilter = THREE.LinearFilter;
            this.imgMesh = new THREE.Mesh(new THREE.PlaneGeometry(
                size.w, size.h), new THREE.MeshBasicMaterial({
                    map: srcTexture
            }));
            this.imgMesh.position.z = -1;
            this.scene.add(this.imgMesh);
        } else {
            // video
            this.videoImageContext.drawImage(this.video, 0, 0);
            if (this.videoTexture) {
                this.videoTexture.needsUpdate = true;
            }
            process();
        }

        function process() {
            // console.time('composer');
            that.composer.render();
            // console.timeEnd('composer');

            // console.time('readPixels');
            // read pixels of edge detection
            var pixels = new Uint8Array(size.w * size.h * 4);
            var gl = that.renderer.getContext();
            gl.readPixels(size.ow, size.oh, size.w, size.h,
                gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            // console.timeEnd('readPixels');
            
            console.time('vertex');
            that.vertices = [[0, 0], [0, 1], [1, 0], [1, 1]];
            // append to vertex array
            // console.log(size.w, size.h);
            var i = 0;
            var arr = [];
            var len = pixels.length / 4;
            var loops = 0;
            for (var i = 0; i < 3000 && loops < 20000; ++i, ++loops) {
                var id = Math.floor(Math.random() * len);
                var x = id % size.w;
                var y = Math.floor(id / size.w);
                var red = pixels[id * 4];
                if (red > 20 || red > Math.random() * 1000) {
                    // is a selected edge vertex
                    that.vertices.push([x, y]);
                } else {
                    --i;
                }
            }
            console.log('vertex cnt:', that.vertices.length);
            console.timeEnd('vertex');

            // calculate delaunay triangles
            console.time('triangle');
            that.triangles = Delaunay.triangulate(that.vertices);
            // console.log('triangle cnt:', that.triangles.length);
            console.timeEnd('triangle');

            // render triangle meshes
            console.time('render');
            that.renderTriangles();
            console.timeEnd('render');
        }
    };



    // render triangle meshes to screen
    GlRenderer.prototype.renderTriangles = function() {
        this.faceMesh = [];
        var wireframeGeo = new THREE.Geometry();
        var vertices = this.vertices;
        var triangles = this.triangles;
        var size = this.getRenderSize();
        var iw = this.isImg ? this.srcImg.width : this.video.width;
        var ih = this.isImg ? this.srcImg.height : this.video.height;
        for(var i = triangles.length - 1; i > 2; i -= 3) {
            // positions of three vertices
            var a = [vertices[triangles[i]][0] + size.dw,
                    vertices[triangles[i]][1] + size.dh];
            var b = [vertices[triangles[i - 1]][0] + size.dw,
                    vertices[triangles[i - 1]][1] + size.dh];
            var c = [vertices[triangles[i - 2]][0] + size.dw,
                    vertices[triangles[i - 2]][1] + size.dh];

            // fill with color in center of gravity
            var x = Math.floor((vertices[triangles[i]][0] 
                    + vertices[triangles[i - 1]][0] 
                    + vertices[triangles[i - 2]][0]) / 3 / size.w * iw);
            var y = Math.floor((1 - (vertices[triangles[i]][1] 
                    + vertices[triangles[i - 1]][1] 
                    + vertices[triangles[i - 2]][1]) / 3 / size.h) * ih);
            var id = (y * iw + x) * 4;
            var rgb = 'rgb(' + this.srcPixel[id] + ', ' + this.srcPixel[id + 1]
                    + ', ' + this.srcPixel[id + 2] + ')';

            // draw the triangle
            // face mesh
            var geo = new THREE.Geometry();
            geo.vertices.push(new THREE.Vector3(a[0], a[1], 1));
            geo.vertices.push(new THREE.Vector3(b[0], b[1], 1));
            geo.vertices.push(new THREE.Vector3(c[0], c[1], 1));
            geo.faces.push(new THREE.Face3(0, 1, 2));
            geo.faces[0].color = new THREE.Color(rgb);
            var mesh = new THREE.Mesh(geo, this.faceMaterial);
            this.faceMesh.push(mesh);
            this.finalScene.add(mesh);

            // wireframe mesh
            // wireframeGeo.vertices.push(new THREE.Vector3(a[0], a[1], 2));
            // wireframeGeo.vertices.push(new THREE.Vector3(b[0], b[1], 2));
            // wireframeGeo.vertices.push(new THREE.Vector3(c[0], c[1], 2));
            // wireframeGeo.faces.push(new THREE.Face3(triangles.length - i - 1,
            //         triangles.length - i, triangles.length - i + 1));
        }
        // add wireframe mesh to scene
        // this.wireframeMesh = new THREE.Mesh(wireframeGeo, 
        //         this.wireframeMaterial);
        // this.finalScene.add(this.wireframeMesh);

        console.time('finalRender');
        this.renderer.render(this.finalScene, this.camera);
        console.timeEnd('finalRender');
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
        this.render();
        // console.log(this.camera.top);
    }



    // render origin image to get pixel color
    GlRenderer.prototype.preRender = function() {
        if (this.isImg) {
            // original image
            this.srcImg = new Image();
            this.srcImg.src = this.imgPath;

            var that = this;
            var img = this.srcImg;
            this.srcImg.onload = function() {
                // tmp canvas
                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var srcCtx = canvas.getContext('2d');
                srcCtx.drawImage(img, 0, 0, img.width, img.height);

                that.srcPixel = srcCtx.getImageData(0, 0, img.width, img.height).data;

                that.render();
            };
        } else {
            // original video
            this.srcPixel = this.videoImageContext.getImageData(0, 0,
                canvas.width, canvas.height).data;
        }
    }



    GlRenderer.prototype.getRenderSize = function(imgWidth, imgHeight) {
        var imgWidth = this.isImg ? this.srcImg.width : this.video.width;
        var imgHeight = this.isImg ? this.srcImg.height : this.video.height;

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
