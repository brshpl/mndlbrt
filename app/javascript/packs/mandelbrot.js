//= require jquery
//= require jquery_ujs

let WORKER_PATH = 'http://localhost:3000/worker.js';
const WORKER_JS = 'http://localhost:3000/worker.js';
const WORKER_BURNING_SHIP_JS = 'http://localhost:3000/worker_burning_ship.js';
let str_star        = document.getElementById('star').innerText;
let str_tornado     = document.getElementById('tornado').innerText;
let str_satellite   = document.getElementById('satellite').innerText;
let str_valley1     = document.getElementById('valley1').innerText;
let str_valley2     = document.getElementById('valley2').innerText;
let str_burn_ship   = document.getElementById('burning_ship').innerText;

function map(value, domain, range, isDecel){
    if (isDecel){
        return range[0] + (range[1] - range[0]) * interCubeDecel((value - domain[0]) / (domain[1] - domain[0]));
    } else {
        let final = range[0] + (range[1] - range[0]) * (value - domain[0]) / (domain[1] - domain[0]);
        final = final < range[0] ? range[0] : final > range[1] ? range[1] : final;
        return final;
    }
}

function interCubeDecel(x){
    let v0 = -2;
    let v1 = 0;
    let v2 = 1;
    let v3 = 0;

    let P = (v3 - v2) - (v0 - v1);
    let Q = (v0 - v1) - P;
    let R = v2 - v0;
    let S = v1;

    return P*x*x*x + Q*x*x + R*x + S;
}

function mapColor(value,domain,rgb1,rgb2){
    let r = Math.floor(map(value, domain, [rgb1[0], rgb2[0]]));
    let g = Math.floor(map(value, domain, [rgb1[1], rgb2[1]]));
    let b = Math.floor(map(value, domain, [rgb1[2], rgb2[2]]));
    let a = Math.floor(map(value, domain, [rgb1[3], rgb2[3]]));
    r = r < 0 ? 0 : r > 255 ? 255 : r;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    b = b < 0 ? 0 : b > 255 ? 255 : b;
    a = a < 0 ? 0 : a > 255 ? 255 : a;
    return [r,g,b,a];
}

function Mandelbrot(){
    this.ratio          = .5;
    this.canvas         = document.getElementById('canvas');
    this.canvas.width   = window.innerWidth  * this.ratio;
    this.canvas.height  = window.innerHeight * this.ratio;
    this.ctx            = this.canvas.getContext('2d');
    this.chunkSize      = Math.floor(this.canvas.width / 8);
    this.vcanvas        = document.createElement('canvas');
    this.vcanvas.width  = this.canvas.width;
    this.vcanvas.height = this.canvas.height;
    this.vctx           = this.vcanvas.getContext('2d');
    this.palette        = 4;

    this.zoom = 0.8;
    this.center = {x: -1, y: 0};
    this.maxIterations = 50;

    this.range = function() {return 1 / this.zoom};
    this.scale = function() {return this.canvas.height / (this.range() * 2)};
    this.bias  = function() {return {x:   this.canvas.width  / 2 - this.center.x * this.scale(),
                                     y: - this.canvas.height / 2 - this.center.y * this.scale()}};

    this.renderUnit = function(ctx, message){
        this.worker = new Worker(WORKER_PATH);
        this.worker.onmessage = function(event){
            ctx.putImageData(event.data.map,
                             event.data.origin.x,
                             event.data.origin.y);
            this.worker.terminate();
        }.bind(this);
        if (message){
            this.worker.postMessage(message);
        }
    };


    this.setColors = function(palette){
        this.palette = palette;
        this.refine(1);
    };
    this.refine = function(ratio,iterations){
        let currentRatio = this.ratio;
        if (ratio === 1){
            this.ratio = 0.5;
        } else if (ratio === 2){
            this.ratio = window.devicePixelRatio;
        } else if (ratio === 3){
            this.ratio = window.devicePixelRatio * 2;
        }

        if (iterations > 10 && iterations <= 3000){
            this.maxIterations = iterations;
        }

        if (currentRatio !== this.ratio){
            this.vcanvas.width  = this.canvas.width;
            this.vcanvas.height = this.canvas.height;
            this.vctx.drawImage(this.canvas, 0, 0);
            this.canvas.width  = window.innerWidth  * this.ratio;
            this.canvas.height = window.innerHeight * this.ratio;
            this.ctx.drawImage(this.vcanvas, 0, 0, this.canvas.width, this.canvas.height);
        }
        this.chunkSize = Math.floor(this.canvas.width / 8);
        this.render();
    };

    this.canvas.addEventListener('click', function(e){
        if (!e.shiftKey) {
            this.center = {x: ( e.clientX * this.ratio - this.bias().x) / this.scale(),
                           y: (-e.clientY * this.ratio - this.bias().y) / this.scale()};
            this.zoom *= 2;
            console.log(this.maxIterations, this.zoom);
        } else {
            this.zoom = this.zoom / 2;
            console.log(this.maxIterations, this.zoom);
        }
        this.refine(1);
    }.bind(this));

}

Mandelbrot.prototype.showMessage = function(progress){
    //this.ctx.clearRect(0,0,canvas.width,canvas.height);
    this.ctx.font = 20*this.ratio +'px Arial';
    this.ctx.fillText('Rendering ' + this.canvas.width + ' x ' + this.canvas.height + ' image ... ' + progress,
                      20 * this.ratio,
                      40 * this.ratio);
};

Mandelbrot.prototype.render = function(){
    for (let y = 0; y < this.canvas.height; y += this.chunkSize){
        for (let x = 0; x < this.canvas.width; x += this.chunkSize){
            new this.renderUnit(this.ctx, {map:           this.ctx.createImageData(this.chunkSize, this.chunkSize),
                                           bias:          this.bias(),
                                           scale:         this.scale(),
                                           maxIterations: this.maxIterations,
                                           origin:        {x:x, y:y},
                                           palette:       this.palette});
        }
    }
    this.showMessage('');
};

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}

var mandelbrot = new Mandelbrot();
mandelbrot.render();

document.getElementById('pure_mandelbrot').onclick    = function () { mandelbrot.setColors(1) };
document.getElementById('BW_recursive').onclick       = function () { mandelbrot.setColors(2) };
document.getElementById('sunshine').onclick           = function () { mandelbrot.setColors(3) };
document.getElementById('inferno_recursive').onclick  = function () { mandelbrot.setColors(4) };
document.getElementById('gothic_recursive').onclick   = function () { mandelbrot.setColors(5) };
document.getElementById('gothic').onclick             = function () { mandelbrot.setColors(6) };
document.getElementById('flame').onclick              = function () { mandelbrot.setColors(7) };
document.getElementById('l_in_d').onclick             = function () { mandelbrot.setColors(8) };
document.getElementById('inferno').onclick            = function () { mandelbrot.setColors(9) };
document.getElementById('acid').onclick               = function () { mandelbrot.setColors(10) };
document.getElementById('BW').onclick                 = function () { mandelbrot.setColors(11) };

document.getElementById('iteration_button').onmouseup = function () { mandelbrot.refine(1, Math.round(this.value)) };
document.getElementById('iteration_button').oninput   = function () {
    document.getElementById('iterations').innerHTML = Math.round(this.value) + ' итераций';
};

$('#places').on('click', '#star', function () {
    mandelbrot.zoom = 800;
    mandelbrot.center = {x: -.8115, y: .2015};
    mandelbrot.maxIterations = 180;
    mandelbrot.render();
});
$('#places').on('click', '#tornado', function () {
    mandelbrot.zoom = 600;
    mandelbrot.center = {x: -.7674, y: .108};
    mandelbrot.maxIterations = 360;
    mandelbrot.render();
});
$('#places').on('click', '#satellite', function () {
    mandelbrot.zoom = 200000;
    mandelbrot.center = {x: -.743643, y: .131826};
    mandelbrot.maxIterations = 1600;
    mandelbrot.render();
});
$('#places').on('click', '#valley1', function () {
    mandelbrot.zoom = 3000000;
    mandelbrot.center = {x: -.7667868, y: .10826};
    mandelbrot.maxIterations = 3000;
    mandelbrot.render();
});
$('#places').on('click', '#valley2', function () {
    mandelbrot.zoom = 20000000;
    mandelbrot.center = {x: -.74364386, y: .1318259};
    mandelbrot.maxIterations = 3000;
    mandelbrot.render();
});
$('#places').on('click', '#burning_ship', function () {
    WORKER_PATH = WORKER_BURNING_SHIP_JS;
    mandelbrot.zoom = 50;
    mandelbrot.center = {x: 1.624, y: 0.01};
    mandelbrot.maxIterations = 80;
    mandelbrot.setColors(7);
    mandelbrot.render();
    document.getElementById('places').innerHTML =
        '<div class=\'button-ctrl place\' id=\'mandelbrot\'>Back</div>';
});
$('#places').on('click', '#mandelbrot', function () {
    WORKER_PATH = WORKER_JS;
    mandelbrot.zoom = 0.8;
    mandelbrot.center = {x: -1, y: 0};
    mandelbrot.maxIterations = 50;
    mandelbrot.setColors(4);
    mandelbrot.render();
    document.getElementById('places').innerHTML =
        '<div class=\'button-ctrl place\' id=\'star\'>'         + str_star + '</div>\n' +
        '<div class=\'button-ctrl place\' id=\'tornado\'>'      + str_tornado + '</div>\n' +
        '<div class=\'button-ctrl place\' id=\'satellite\'>'    + str_satellite + '</div>\n' +
        '<div class=\'button-ctrl place\' id=\'valley1\'>'      + str_valley1 + '</div>\n' +
        '<div class=\'button-ctrl place\' id=\'valley2\'>'      + str_valley2 + '</div>\n' +
        '<br>\n' +
        '<div class=\'button-ctrl place\' id=\'burning_ship\'>' + str_burn_ship + '</div>';
});

document.getElementById('final').onclick = function () { mandelbrot.refine(3) };
document.getElementById('save').onclick = function () {
    if(document.getElementById('email') != null) {
        const AUTH_TOKEN = jQuery('meta[name=csrf-token]').attr('content');
        let dataURL = document.getElementById('canvas').toDataURL('image/png', 1.0);
        let blob = dataURItoBlob(dataURL);
        let formData = new FormData(document.forms[0]);
        formData.append('authenticity_token', AUTH_TOKEN);
        let file = new File([blob], 'canvasImage.png', {type: 'image/png'});
        formData.append('post[image]', file);
        let email = document.getElementById('email').innerText;
        email = email.substr(0, email.length);
        formData.append('post[author]', email);
        let request = new XMLHttpRequest();
        request.open("POST", "http://localhost:3000/posts#create");
        request.send(formData);
    } else{
        alert('Please login to post pictures');
    }
};