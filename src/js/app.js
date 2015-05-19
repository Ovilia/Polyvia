define(function(require, exports, module) {
    var img = './src/img/18.jpg';
    var canvas = document.getElementById('canvas');

    // init canvas width to that of window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var Polyvia = require('Polyvia');
    var polyvia = new Polyvia(img, canvas);



    // dat.gui
    require('gui');
    var GuiConfig = function() {
        this.VertexCnt = 1000;
        this.Render = function() {
            polyvia.set({
                vertexCnt: this.VertexCnt
            });
            polyvia.render();
            console.log(this.VertexCnt);
        };
    };
    var config = new GuiConfig();
    var gui = new dat.GUI();
    gui.add(config, 'VertexCnt', 100, 10000).step(100);
    gui.add(config, 'Render');
});
