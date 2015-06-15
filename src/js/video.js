require(['GlRenderer', 'stats'], function(GlRenderer, Stats) {
    var stats = new Stats();
    stats.setMode(0);

    // init canvas width to that of window
    var canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var renderer = null;

    // align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);

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

                renderer = new GlRenderer(canvas, false, video);
                renderFrame();
            };
            video.width = 512;
            video.height = 256;
        }, function (err) {
            alert('Request camera failed');
        });
    } else {
        alert('getUserMedia not supported');
    }

    function renderFrame() {
        stats.begin();

        // if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // setTimeout(function() {

            renderer.render();
        // }, 1000);
        // }

        stats.end();

        // requestAnimationFrame(renderFrame);
    }
});
