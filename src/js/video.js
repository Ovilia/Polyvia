(function () {
    var stats = new Stats();
    stats.setMode(0);

    // init canvas width to that of window
    var canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var renderer = null;

    // align top-left
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.left = '0px';
    // stats.domElement.style.top = '0px';
    // document.body.appendChild(stats.domElement);

    // local video
    var video = document.createElement('video');
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (navigator.getUserMedia) {
        navigator.getUserMedia({
            video: true
        }, function (stream) {
            video.src = window.URL.createObjectURL(stream);
            video.onloadedmetadata = function(e) {
                video.play();

                // update canvas position
                if (canvas.width > this.videoWidth) {
                    canvas.width = this.videoWidth;
                    canvas.height = this.videoHeight;

                    // var info = document.getElementById('info');
                    // info.style.width = Math.floor((window.innerWidth 
                    //         - this.videoWidth) / 2) + 'px';
                }

                renderer = new GlRenderer(canvas, 3000, false, video, this);
                renderFrame();
            };
            video.load();
        }, function (err) {
            alert('Request camera failed');
        });
    } else {
        alert('getUserMedia not supported');
    }

    function renderFrame() {
        // stats.begin();

        renderer.render();

        // stats.end();

        requestAnimationFrame(renderFrame);
    }
})();
