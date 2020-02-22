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
    v0 = -2;
    v1 = 0;
    v2 = 1;
    v3 = 0;

    P = (v3 - v2) - (v0 - v1);
    Q = (v0 - v1) - P;
    R = v2 - v0;
    S = v1;

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
    this.ratio          = .5;                                    //window.devicePixelRatio * 2;
    this.canvas         = document.getElementById('canvas');
    this.canvas.width   = window.innerWidth  * this.ratio;
    this.canvas.height  = window.innerHeight * this.ratio;
    this.ctx            = this.canvas.getContext('2d');
    this.chunkSize      = Math.floor(this.canvas.width / 8);
    this.vcanvas        = document.createElement('canvas');
    this.vcanvas.width  = this.canvas.width;
    this.vcanvas.height = this.canvas.height;
    this.vctx           = this.vcanvas.getContext('2d');
    this.palette        = 3;

    //this.zoom = 20000000;                           //Satellite valley (VERY SLOW)
    //this.center = {x: -.74364386, y: .1318259};
    //this.maxIterations = 3000;

    //this.zoom = 3000000;                            //Satellite valley 2 (VERY SLOW)
    //this.center = {x: -.7667868, y: .10826};
    //this.maxIterations = 3000;

    //this.zoom = 200000;                             //Satellite
    //this.center = {x: -.743643, y: .131826};
    //this.maxIterations = 1600;

    //this.zoom = 1000;                               //Star
    //this.center = {x: -.81045, y: .20175};
    //this.maxIterations = 180;

    //this.zoom = 600;                                //Wally
    //this.center = {x: -.7674, y: .108};
    //this.maxIterations = 360;

    this.zoom = 0.8;                                  //Initial
    this.center = {x: -1, y: 0};
    this.maxIterations = 50;

    //this.zoom = 150                                 //Burning ship (needs change in worker code)
    //this.center = {x: 1.624, y: 0.01};
    //this.maxIterations = 80;

    //this.maxIterations = function() {return Math.floor(map(this.zoom,[1,2000000],[50,3000]))};
    this.range = function() {return 1 / this.zoom};
    this.scale = function() {return this.canvas.height / (this.range() * 2)};
    this.bias  = function() {return {x:   this.canvas.width  / 2 - this.center.x * this.scale(),
                                     y: - this.canvas.height / 2 - this.center.y * this.scale()}};

    this.renderUnit = function(ctx,message){
        this.worker = new Worker('worker.js');
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
        if (e.clientX < 0.9 * this.canvas.width / this.ratio){
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

var mandelbrot = new Mandelbrot();
mandelbrot.render();