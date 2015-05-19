define(function(require, exports, module) {
    var Polyvia = require('Polyvia');

    p = new Polyvia();

});

// var canvas = document.getElementById("canvas"),
//     ctx = canvas.getContext("2d"),
//         vertices = new Array(2048),
//         i, x, y;
// for(i = vertices.length; i--; ) {
//     do {
//         x = Math.random() - 0.5;
//         y = Math.random() - 0.5;
//         } while(x * x + y * y > 0.25);
//         x = (x * 0.96875 + 0.5) * canvas.width;
//         y = (y * 0.96875 + 0.5) * canvas.height;
//         vertices[i] = [x, y];
//     }
// console.time("triangulate");
// var triangles = Delaunay.triangulate(vertices);
// console.timeEnd("triangulate");
// for(i = triangles.length; i; ) {
//     ctx.beginPath();
//     --i; ctx.moveTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
//     --i; ctx.lineTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
//     --i; ctx.lineTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
//     ctx.closePath();
//     ctx.stroke();
// }
