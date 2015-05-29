define(function(require, exports, module) {
    var img = './src/img/18.jpg';
    var canvas = document.getElementById('canvas');

    // init canvas width to that of window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var Polyvia = require('Polyvia');
    var polyvia = new Polyvia(img, 'source-img', canvas);



    // event handling
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        polyvia.render();
    }



    // dat.gui
    require('gui');
    var GuiConfig = function() {
        this['Image Path'] = '18.jpg';

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

        this['Apply'] = function() {
            polyvia.set({
                vertexCnt: this['Vertex Cnt'],
                edgeWeight: 41 - this['Edges Weight'] * 40
            });
            polyvia.render();
        };
    };
    var config = new GuiConfig();
    var gui = new dat.GUI();
    gui.add(config, 'Image Path', config['Image Path']);
    gui.add(config, 'Upload Image');
    gui.add(config, 'Vertex Cnt', 100, 5000).step(100);
    gui.add(config, 'Edge Weight', 0, 1).step(0.05);
    gui.add(config, 'Apply');
});
