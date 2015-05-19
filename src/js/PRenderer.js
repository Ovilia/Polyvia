// `PRenderer` renders the output to canvas according to the result
// computed in `Polyvia`.

define(function(require, exports, module) {
    function PRenderer(ctx) {
        console.log('PRenderer init.');

        this.ctx = ctx; // drawing context of canvas
    };

    module.exports = PRenderer;



    PRenderer.prototype.render = function(polyvia) {
        this.ctx.drawImage(polyvia.srcImg, 0, 0);
    }
});
