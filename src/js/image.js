require(['GlRenderer', 'dat'], function(GlRenderer, dat) {

    var img = './src/img/3.jpg';
    var canvas = document.getElementById('canvas');

    // init canvas width to that of window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var start = new Date();
    var renderer = new GlRenderer(canvas, 2000, true, img, function() {
        renderTime(start);
    });



    // event handling
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderer.resize();
    }



    // dat.gui
    var hasWireframe = false;
    var GuiConfig = function() {
        this['Image URL'] = '';

        this['Upload Image'] = function() {
            var input = document.getElementById('img-path');
            input.addEventListener('change', function() {
                var file = input.files[0];
                config['Image URL'] = file.name;

                var reader = new FileReader();
                reader.onload = function(e) {
                    var start = new Date();
                    renderer.updateImage(e.target.result, function() {
                        renderTime(start);
                    });
                };
                reader.readAsDataURL(file);

                // Iterate over all controllers
                for (var i in gui.__controllers) {
                    gui.__controllers[i].updateDisplay();
                }
            });
            input.click();
        };

        this['Vertex Cnt'] = 2000;

        this['Wireframe'] = function() {
            hasWireframe = !hasWireframe;
            renderer.setWireframe(hasWireframe);
        };

        this['Render'] = function() {
            renderer.setVertexCnt(this['Vertex Cnt']);
            rerender();
        };
    };
    var config = new GuiConfig();
    var gui = new dat.GUI();

    var vertexCntGui = gui.add(config, 'Vertex Cnt', 100, 5000).step(100);
    vertexCntGui.onChange(function(value) {
        renderer.setVertexCnt(value);
        rerender();
    });

    gui.add(config, 'Image URL', config['Image URL']);
    gui.add(config, 'Upload Image');
    gui.add(config, 'Render');
    gui.add(config, 'Wireframe');



    function showMsg(txt) {
        // delete previous msg
        var msgs = document.getElementsByClassName('msg');
        for (var i = msgs.length - 1; i >= 0; --i) {
            document.body.removeChild(msgs[i]);
        }

        var msg = document.createElement('div');
        msg.className = 'msg';
        msg.innerHTML = txt;
        document.body.appendChild(msg);

        // message displays after 5 seconds
        setTimeout(function() {
            if (msg.parentNode === document.body) {
                document.body.removeChild(msg);
            }
        }, 5000);
    }

    function rerender() {
        var start = new Date();
        renderer.render(function() {
            renderTime(start);
        });
    }

    function renderTime(start) {
        var end = new Date();
        var time = parseFloat((end - start) / 1000, 3);
        showMsg('Render time: ' + time + ' seconds');
    }
});
