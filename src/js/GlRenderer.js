function GlRenderer(canvas, maxVertexCnt, isImg, imgPath, videoElement) {
    this.canvas = canvas;
    this.maxVertexCnt = maxVertexCnt;
    this.isImg = isImg;
    if (!isImg) {
        this.video = imgPath;
        this.videoWidth = videoElement.videoWidth;
        this.videoHeight = videoElement.videoHeight;
        this.videoElement = videoElement;
    } else {
        var callback = videoElement;
    }

    this.init();

    this.updateImage(imgPath, callback);

    this.hasWireframe = false;

    // window.renderer = this;
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



    if (!this.isImg) {
        // video texture, for rendering edge texture
        this.videoImage = document.createElement('canvas');
        this.videoImage.width = this.canvas.width;
        this.videoImage.height = this.canvas.height;

        // video source image canvas, for reading video colors
        var videoSrcImage = document.createElement('canvas');
        videoSrcImage.width = this.videoWidth;
        videoSrcImage.height = this.videoHeight;
        this.videoSrcCtx = videoSrcImage.getContext('2d');

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

        // arrary of selected x and y in last frame,
        // in video coordinate
        // {2: [3, 4], 5: [6]} for (x, y) = (2, 3), (2, 4), (5, 6)
        this.lastSelected = {};
        this.thisSelected = {};
    }
};



// set maximum vertex cnt
GlRenderer.prototype.setVertexCnt = function(cnt) {
    this.maxVertexCnt = cnt;
};



// returns bool state of if (x, y) is selected to form triangle
GlRenderer.prototype._isLastSelected = function(x, y) {
    var ys = this.lastSelected[x];
    if (ys) {
        for (var i = ys.length - 1; i >= 0; --i) {
            if (ys[i] == y) {
                return true;
            }
        }
    }
    return false;
};

// push to thisSelected array, won't check if has already added
GlRenderer.prototype._setThisSelected = function(x, y) {
    var ys = this.thisSelected[x];
    if (ys) {
        ys.push(y);
    } else {
        this.thisSelected[x] = [y];
    }
};



// display and hide wireframe
GlRenderer.prototype.setWireframe = function(hasWireframe) {
    if (this.wireframeMesh) {
        this.wireframeMesh.visible = hasWireframe;
        if (this.hasWireframe != hasWireframe) {
            this.renderer.render(this.finalScene, this.camera);
            this.hasWireframe = hasWireframe;
        }
    }
};



// change to a new image
GlRenderer.prototype.updateImage = function(imgPath, callback) {
    this.imgPath = imgPath;
    this._renderSize = null;
    this.clear();
    if (this.imgMesh) {
        this.scene.remove(this.imgMesh);
        this.imgMesh = null;
    }

    // render the srcImg to get pixel color later
    this.preRender(callback);
};



// remove objects from the scene
GlRenderer.prototype.clear = function() {
    // remove meshes from scene
    if (this.faceMesh) {
        this.finalScene.remove(this.faceMesh);
        this.faceMesh = null;
    }
    if (this.wireframeMesh) {
        this.finalScene.remove(this.wireframeMesh);
        this.wireframeMesh = null;
    }
};


// render again without changing triangle positions
GlRenderer.prototype.render = function(callback) {
    this.clear();

    if (!this.isImg) {
        this.preRender();
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

        // set thisSelected to lastSelected
        this.lastSelected = this.thisSelected;
        this.thisSelected = {};
    }

    if (callback) {
        callback();
    }

    function process() {
        that.composer.render();
        // read pixels of edge detection
        var gl = that.renderer.getContext();
        if (that.isImg) {
            var iw = size.w;
            var ih = size.h;
            var pixels = new Uint8Array(iw * ih * 4);
            gl.readPixels(size.ow, size.oh, size.w, size.h,
                gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        } else {
            var iw = that.videoWidth;
            var ih = that.videoHeight;
            var pixels = new Uint8Array(iw * ih * 4);
            gl.readPixels(0, that.canvas.height - ih, iw, ih,
                gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        }

        that.vertices = [[0, 0], [0, 1], [1, 0], [1, 1]];
        // append to vertex array
        var len = iw * ih;
        var loops = 0;
        var i = 4;
        // select those edges that in lastSelected
        for (var xi in that.lastSelected) {
            var x = parseInt(xi, 10);
            if (that.lastSelected[xi] != undefined) {
                for (var yi = that.lastSelected[xi].length; yi >= 0; --yi) {
                    var y = that.lastSelected[xi][yi];
                    var id = y * iw + x;
                    var red = pixels[id * 4];
                    if (red > 40 && Math.random() > 0.2) {
                        that._setThisSelected(xi, y);
                        that.vertices.push([x / iw, y / ih]);
                        ++i;
                    }
                }
            }
        }
        var edgeCnt = Math.floor(that.maxVertexCnt * 0.95);
        var maxLoop = that.maxVertexCnt * 100;
        for (; i < edgeCnt && loops < maxLoop; ++i, ++loops) {
            var id = Math.floor(Math.random() * len);
            var x = id % iw;
            var y = Math.floor(id / iw);
            var red = pixels[id * 4];
            if (red > 100 || red > Math.random() * 100) {
                // is a selected edge vertex
                if (!that.isImg) {
                    that._setThisSelected(x, y);
                }

                that.vertices.push([x / iw, y / ih]);
            } else {
                --i;
            }
        }

        for (; i < that.maxVertexCnt; ++i) {
            // randomly selected vertices will not push to thisSelected
            var rx = Math.random();
            var ry = Math.random();
            that.vertices.push([rx, ry]);
            if (!that.isImg) {
                that._setThisSelected(Math.floor(rx * iw),
                        Math.floor(ry * ih));
            }
        }

        // calculate delaunay triangles
        that.triangles = Delaunay.triangulate(that.vertices);

        // render triangle meshes
        that.renderTriangles(iw, ih);
    }
};



// render triangle meshes to screen
GlRenderer.prototype.renderTriangles = function(iw, ih) {
    this.faceMesh = [];
    var wireframeGeo = new THREE.Geometry();
    var vertices = this.vertices;
    var triangles = this.triangles;
    var size = this.getRenderSize();
    if (this.isImg) {
        var iwn = this.srcImg.width;
        var ihn = this.srcImg.height;
    } else {
        var iwn = iw;
        var ihn = ih;
    }
    // face mesh
    var geo = new THREE.Geometry();
    var len = triangles.length;
    var fid = 0;
    for(var i = triangles.length - 1; i > 2; i -= 3) {
        // positions of three vertices
        var a = [vertices[triangles[i]][0] * size.w + size.dw,
                vertices[triangles[i]][1] * size.h + size.dh];
        var b = [vertices[triangles[i - 1]][0] * size.w + size.dw,
                vertices[triangles[i - 1]][1] * size.h + size.dh];
        var c = [vertices[triangles[i - 2]][0] * size.w + size.dw,
                vertices[triangles[i - 2]][1] * size.h + size.dh];

        // fill with color in center of gravity
        var x = Math.floor((vertices[triangles[i]][0]
                + vertices[triangles[i - 1]][0]
                + vertices[triangles[i - 2]][0]) / 3 * iwn);
        var y = ihn - Math.floor((vertices[triangles[i]][1]
                + vertices[triangles[i - 1]][1]
                + vertices[triangles[i - 2]][1]) / 3 * ihn);
        x = Math.min(iwn, Math.max(0, x - 1));
        y = Math.min(ihn, Math.max(0, y - 1));
        var id = (y * iwn + x) * 4;
        var rgb = 'rgb(' + this.srcPixel[id] + ', ' + this.srcPixel[id + 1]
                + ', ' + this.srcPixel[id + 2] + ')';

        // draw the triangle
        geo.vertices.push(new THREE.Vector3(a[0], a[1], 1));
        geo.vertices.push(new THREE.Vector3(b[0], b[1], 1));
        geo.vertices.push(new THREE.Vector3(c[0], c[1], 1));
        geo.faces.push(new THREE.Face3(len - i - 1, len - i, len - i + 1));
        geo.faces[fid++].color = new THREE.Color(rgb);
    }
    this.faceMesh = new THREE.Mesh(geo, this.faceMaterial);
    this.finalScene.add(this.faceMesh);

    this.wireframeMesh = new THREE.Mesh(geo, this.wireframeMaterial);
    this.wireframeMesh.position.z = 2;
    if (!this.hasWireframe) {
        this.wireframeMesh.visible = false;
    }
    this.finalScene.add(this.wireframeMesh);

    this.renderer.render(this.finalScene, this.camera);
}



GlRenderer.prototype.resize = function() {
    // TODO: this function still not works yet
    var h = this.canvas.height;
    var w = this.canvas.width;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);

    this._renderSize = null; // flag to recalculate
}



// render origin image to get pixel color
GlRenderer.prototype.preRender = function(callback) {
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

            if (callback) {
                callback();
            }
        };
    } else {
        // original video
        this.videoSrcCtx.drawImage(this.videoElement, 0, 0,
            this.videoWidth, this.videoHeight);
        // console.log(this.videoImage.toDataURL());
        this.srcPixel = this.videoSrcCtx.getImageData(0, 0,
            this.videoWidth, this.videoHeight).data;
    }
}



GlRenderer.prototype.getRenderSize = function(imgWidth, imgHeight) {
    if (this._renderSize) {
        return this._renderSize;
    }

    var imgWidth = this.isImg ? this.srcImg.width : this.videoWidth;
    var imgHeight = this.isImg ? this.srcImg.height : this.videoHeight;

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

    this._renderSize = {
        w: w,
        h: h,
        dw: Math.floor(ow - cw / 2),
        dh: Math.floor(oh - ch / 2),
        ow: ow,
        oh: oh
    };
    return this._renderSize;
}
