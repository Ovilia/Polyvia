require(['Polyvia'], function(Polyvia) {
    console.log('app called');
    var img = './src/img/3.jpg';
    var canvas = document.getElementById('canvas');

    // init canvas width to that of window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var polyvia = new Polyvia(img, 'source-img', canvas);



    // event handling
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        polyvia.renderer.resize();
    }



    // dat.gui
    require('dat.gui');
    var hasWireframe = true;
    var GuiConfig = function() {
        this['Image Path'] = '3.jpg';

        this['Upload Image'] = function() {
            var input = document.getElementById('img-path');
            input.addEventListener('change', function() {
                var file = input.files[0];
                config['Image Path'] = file.name;
                // Iterate over all controllers
                for (var i in gui.__controllers) {
                    gui.__controllers[i].updateDisplay();
                }
            });
            input.click();
        };

        this['Vertex Cnt'] = 1000;

        this['Edge Weight'] = 0.8;

        this['Wireframe'] = function() {
            hasWireframe = !hasWireframe;
            polyvia.renderer.setWireframe(hasWireframe);
        };

        this['Apply'] = function() {
            polyvia.set({
                vertexCnt: this['Vertex Cnt'],
                edgeWeight: this['Edge Weight'],
                // renderVertices: this['Render Vertices']
            });
            polyvia.renderer.render();
        };
    };
    var config = new GuiConfig();
    var gui = new dat.GUI();
    gui.add(config, 'Image Path', config['Image Path']);
    gui.add(config, 'Upload Image');
    gui.add(config, 'Vertex Cnt', 100, 5000).step(100);
    gui.add(config, 'Edge Weight', 0, 1).step(0.05);
    gui.add(config, 'Wireframe');
    gui.add(config, 'Apply');
});
