bbb.extend(bbb, {
    canvas: {
        rgba: function(r, g, b, a) { return 'rgba(' + [r ^ 0, g ^ 0, b ^ 0, a === undefined ? 1.0 : a / 255.0].join(',') + ')'; },
        rgb: function(r, g, b) { return 'rgb(' + [r ^ 0, g ^ 0, b ^ 0].join(',') + ')'; },
        hsva: function(hue, saturation, value, a) {
            hue *= 360.0;
            var max = value * 255;
            var min = max - ((saturation) * max);
            var r, g, b;
            if (hue < 60) {
                r = max;
                g = (hue / 60) * (max - min) + min;
                b = min;
            }
            else if (hue < 120) {
                r = ((120 - hue) / 60) * (max - min) + min;
                g = max;
                b = min;
            } 
            else if (hue < 180) {
                r = min;
                g = max;
                b = ((hue - 120) / 60) * (max - min) + min;
            } 
            else if (hue < 240) {
                r = min;
                g = ((240 - hue) / 60) * (max - min) + min;
                b = max;
            }
            else if (hue < 300) {
                r = ((hue - 240) / 60) * (max - min) + min;
                g = min;
                b = max;
            } 
            else {
                r = max;
                g = min;
                b = ((360 - hue) / 60) * (max - min) + min;
            }
            return 'rgba(' + [r ^ 0, g ^ 0, b ^ 0, a === undefined ? 1.0 : a / 255.0].join(',') + ')';
        },
    }
});

bbb.canvas.renderer = (function() {
    function renderer(canvas, app, global) {
        var $canvas = $(canvas),
            $window = $(window),
            $document = $(document);
        
        var apps = {}, current_app = '';
        app = Array.isArray(app) ? app : [app];
        app.forEach(function(a) {
            for(var key in a.methods) if(a.methods.hasOwnProperty(key)) {
                a.methods[key] = a.methods[key].bind(this);
            }
            apps[a.name] = a;
        }.bind(this));
        current_app = app[0].name;

        bbb.extend(this, {
            canvas: canvas,
            $canvas: $canvas,
            $window: $window,
            $document: $document,
            context: canvas.getContext('2d'),

            apps: apps,
            current_app: current_app,

            frame: 0,
            scroll_pos: 1.0,
            scroll_height: $window.height() - $canvas.height(),
            size: { width: $canvas.width(), height: $canvas.height() },
            center: { x: $canvas.width() * 0.5, y: $canvas.height() * 0.5 },
            mouse: { x: 0, y: 0 },
            resize: function() {},
            is_paused: false,
        });
        
        bbb.extend(this, global.properties || {});
        global.setup  = global.setup  || function global_setup() {};
        global.update = global.update || function global_update() {};
        global.draw   = global.draw   || function global_draw() {};
        bbb.extend(this, global);
    };

    bbb.extend(renderer.prototype, {
        bind: function(f) { return f.bind(this); },
        internal: {
            resize: function() {
                this.$canvas.attr('width', this.$canvas.width());
                this.$canvas.attr('height', this.$canvas.height());
                this.size.width = this.$canvas.width();
                this.size.height = this.$canvas.height();
                this.center.x = this.$canvas.width() * 0.5;
                this.center.y = this.$canvas.height() * 0.5;
                this.scroll_height = (this.$document.height() == this.$window.height()) ? -1 : (this.$document.height() - this.$window.height());

                this.currentApp().resize(this.context, this.currentApp(), this);
            },
            mousemove: function(event) {
                this.mouse.x = event.pageX;
                this.mouse.y = event.pageY - this.$window.scrollTop();
            },
            setup: function() {
                this.setup(this.context, this.properties);
                for(var key in this.apps) this.bind(this.apps[key].setup)(this.context, this.apps[key]);
            },
            update: function() {
                this.scroll_pos = Math.min(1.0, Math.max(0.0, this.scroll_height < 0 ? 1.0 : (this.$window.scrollTop() / this.scroll_height)));
                this.update(this.context, this.properties);
                this.bind(this.currentApp().update)(this.context, this.currentApp(), this);
                this.frame++;
            },
            draw: function() {
                this.draw(this.context, this.properties);
                this.bind(this.currentApp().draw)(this.context, this.currentApp(), this);
            },
            init: function() {
                var that = this;
                this.$document.mousemove(this.bind(this.internal.mousemove));
                var resize = this.bind(this.internal.resize);
                this.$window.resize(resize);
                this.$document.change(resize).resize(resize);
                resize();

                this.bind(this.internal.setup)();

                return this;
            },
            render: function() {
                if(this.is_paused) return;
                this.bind(this.internal.update)();
                this.bind(this.internal.draw)();
                requestAnimationFrame(this.internal.render.bind(this));
            },
        },
        extend: function(src) { return bbb.extend(this, src); },
        addSharedProperty: function(key, value) {
            this[key] = value;
            return this;
        },
        addSharedProperties: function(properties) {
            bbb.extend(this, properties);
            return this;
        },
        currentApp: function() { return this.apps[this.current_app]; },
        selectApp: function(app_name) {
            this.bind(this.currentApp().willFinish)(this.context, this.currentApp(), this);
            this.current_app = app_name;
            this.bind(this.currentApp().resize)(this.context, this.currentApp(), this);
            this.bind(this.currentApp().willStart)(this.context, this.currentApp(), this);
        },
        start: function() {
            this.bind(this.internal.init)();
            this.bind(this.internal.render)();
            return this;
        },
        pause: function() { this.is_paused = true; return this; },
        resume: function() { this.is_paused = false; render(); return this; },

        // draw functions
        clear: function() { this.context.clearRect(0, 0, this.size.width, this.size.height); },
        beginPath: function() { this.context.beginPath(); },
        closePath: function() { this.context.closePath(); },
        setStrokeColor: function(r, g, b, a) {
            this.stroke_color = bbb.canvas.rgba(r, g, b, a);
            this.context.strokeStyle = this.stroke_color;
        },
        setStrokeColorHSV: function(h, s, v, a) {
            this.stroke_color = bbb.canvas.hsva(h, s, v, a);
            this.context.strokeStyle = this.stroke_color;
        },
        stroke: function() {
            this.context.stroke();
            return this;
        },
        setFillColor: function(r, g, b, a) {
            this.context.fillStyle = bbb.canvas.rgba(r, g, b, a);
            return this;
        },
        setFillColorHSV: function(h, s, v, a) {
            this.context.fillStyle = bbb.canvas.hsva(h, s, v, a);
            return this;
        },
        fill: function() {
            this.context.fill();
            return this;
        },
        moveTo: function(x, y) {
            this.context.moveTo(x, y);
            return this;
        },
        lineTo: function(x, y) {
            this.context.lineTo(x, y);
            return this;
        },
        line: function(sx, sy, ex, ey) { 
            this.context.moveTo(sx, sy);
            this.context.lineTo(ex, ey);
            return this;
        },
        lines: function(pos) {
            this.context.moveTo(pos[0][0], pos[0][1]);
            for(var i = 1; i < pos.length; i++) this.context.lineTo(pos[i][0], pos[i][1]);
            return this;
        },
        rect: function(x, y, w, h) {
            this.context.fillRect(x, y, w, h);
            return this;
        },
        strokeRect: function(x, y, w, h) {
            this.context.strokeRect(x, y, w, h);
            return this;
        },
        polygon: function(pos) {
            this.context.beginPath();
            this.context.moveTo(pos[0][0], pos[0][1]);
            for(var i = 1; i < pos.length; i++) this.context.lineTo(pos[i][0], pos[i][1]);
            this.context.closePath();
            return this;
        },
        point: function(x, y) {
            this.context.fillRect(x - 0.5, y - 0.5, 1, 1);
            return this;
        },
        points: function(pts) {
            for(var i = 0; i < pts.length; i++) this.context.fillRect(pts[i][0] - 0.5, pts[i][1] - 0.5, 1, 1);
            return this;
        },
        gradient: function(x, y, w, h) { return this.context.createLinearGradient(x, y, w, h); },
        setStrokeGradient: function(grad) {
            this.context.strokeStyle = grad;
            return this;
        },
        setFillGradient: function(grad) {
            this.context.fillStyle = grad;
            return this;
        },
    });

    return renderer;
})();

bbb.canvas.app = (function() {
    function app(name, opts) {
        opts = opts || {};
        bbb.extend(this, {
            name: name,
            setup:      opts.setup      || function setup(context, props) {},
            resize:     opts.resize     || function resize(context, props) {},
            willStart:  opts.willStart  || function willStart(context, props) {},
            update:     opts.update     || function update(context, props) {},
            draw:       opts.draw       || function draw(context, props) {},
            willFinish: opts.willFinish || function willFinish(context, props) {},
            properties: opts.properties || {},
            methods:    opts.methods    || {},
        });
    }

    bbb.extend(app.prototype, {
        addProperty: function(key, value) { this.properties[key] = value; return this; },
        addProperties: function(properties) { bbb.extend(this.properties, properties); return this; },
        addMethod: function(key, method) { this.methods[key] = method; return this; },
        addProperties: function(methods) { bbb.extend(this.methods, methods); return this; },
    });

    return app;
})();