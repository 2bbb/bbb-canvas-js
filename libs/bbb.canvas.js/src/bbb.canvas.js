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
            lastTimestamp: 0,
            frameDelta: 0.0,
            scroll_pos: 1.0,
            scroll_height: $window.height() - $canvas.height(),
            size: { width: $canvas.width(), height: $canvas.height() },
            center: bbb.math.vec2.create({ x: $canvas.width() * 0.5, y: $canvas.height() * 0.5 }),
            mouse: bbb.math.vec2.create({x: 0, y: 0}),
            resize: function() {},
            is_paused: false,

            fontStates: [],
            colorStates: [],
        });
        
        bbb.extend(this, global.properties || {});
        global.setup  = global.setup  || function global_setup() {};
        global.update = global.update || function global_update() {};
        global.drawBackground   = global.drawBackground   || function global_draw_background() {};
        global.drawForeground   = global.drawForeground   || function global_draw_foreground() {};
        bbb.extend(this, global);
    };

    // extend render system
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

                this.currentApp().resize.bind(this)(this.context, this.currentApp(), this);
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
                this.push();
                this.pushColorSetting();
                this.pushFontSetting();
                this.drawBackground(this.context, this.properties);
                this.popFontSetting();
                this.popColorSetting();
                this.pop();
                
                this.push();
                this.pushColorSetting();
                this.pushFontSetting();
                this.bind(this.currentApp().draw)(this.context, this.currentApp(), this);
                this.popFontSetting();
                this.popColorSetting();
                this.pop();

                this.push();
                this.pushColorSetting();
                this.pushFontSetting();
                this.drawForeground(this.context, this.properties);
                this.popFontSetting();
                this.popColorSetting();
                this.pop();
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
            render: function(timestamp) {
                this.frameDelta = (timestamp - this.lastTimestamp) * 0.001;
                this.lastTimestamp = timestamp;
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
    });

    // extend draw functions
    bbb.extend(renderer.prototype, {
        clear: function() { this.context.clearRect(0, 0, this.size.width, this.size.height); },
        beginPath: function() { this.context.beginPath(); },
        closePath: function() { this.context.closePath(); },

        setAlpha: function(a) {
            this.globalAlpha = a / 255.0;
        },
        setStrokeColor: function(r, g, b, a) {
            this.stroke_color = bbb.canvas.rgba(r, g, b, a);
            this.context.strokeStyle = this.stroke_color;
        },
        setStrokeColorHSV: function(h, s, v, a) {
            this.stroke_color = bbb.canvas.hsva(h, s, v, a);
            this.context.strokeStyle = this.stroke_color;
        },
        strokeColor: function() { return this.strokeStyle; },
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
        fillColor: function() { return this.fillStyle; },
        setLineWidth: function(lw) {
            this.context.lineWidth = lw;
            return this;
        },
        fill: function() {
            this.context.fill();
            return this;
        },

        moveTo: function(p) {
            this.context.moveTo(p.x, p.y);
            return this;
        },
        pushColorSetting: function() {
            this.colorStates.push({
                stroke: this.strokeColor(),
                fill: this.fillColor()
            });
            return this;
        },
        popColorSetting: function() {
            var state = this.colorStates.pop();
            this.setStrokeColor(state.stroke);
            this.setFillColor(state.fill);
            return this;
        },

        // points
        point: function(p) {
            this.context.fillRect(p.x - 0.5, p.y - 0.5, 1, 1);
            return this;
        },
        points: function(pts) {
            for(var i = 0; i < pts.length; i++) this.context.fillRect(pts[i].x - 0.5, pts[i].y - 0.5, 1, 1);
            return this;
        },
        circle: function(p, radius) {
            this.context.moveTo(p.x + radius, p.y);
            this.context.arc(p.x, p.y, radius, 0.0, 2.0 * Math.PI);
            return this;
        },

        // lines / curves
        line: function(s, e) { 
            this.context.moveTo(s.x, s.y);
            this.context.lineTo(e.x, e.y);
            return this;
        },
        lineTo: function(p) {
            this.context.lineTo(p.x, p.y);
            return this;
        },
        lines: function(ps) {
            this.context.moveTo(ps[0].x, pos[0].y);
            for(var i = 1; i < ps.length; i++) this.context.lineTo(ps[i].x, pos[i].y);
            return this;
        },
        curveTo: function(c, e) {
            this.context.quadraticCurveTo(c.x, c.y, e.x, e.y);
            return this;
        },
        curve: function(s, c, e) {
            this.context.moveTo(s.x, s.y);
            this.context.quadraticCurveTo(c.x, c.y, e.x, e.y);
            return this;
        },
        bezierTo: function(c1, c2, e) {
            this.context.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, e.x, e.y);
            return this;
        },
        bezier: function(s, c1, c2, e) {
            this.context.moveTo(s.x, s.y);
            this.context.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, e.x, e.y);
            return this;
        },
        arc: function(p, radius, startAngle, endAngle, anticlockwise) {
            this.context.arc(p.x, p.y, radius, startAngle, endAngle, anticlockwise);
            return this;
        },
        arcTo: function(s, e, radius) {
            this.context.arcTo(s.x, s.y, e.x, e.y, radius);
            return this;
        },

        // rectangle
        rect: function(p, w, h) {
            this.context.fillRect(p.x, p.y, w, h);
            return this;
        },
        strokeRect: function(p, w, h) {
            this.context.strokeRect(p.x, p.y, w, h);
            return this;
        },
        rectCenter: function(p, w, h) {
            this.context.fillRect(p.x - 0.5 * w, p.y - 0.5 * h, w, h);
            return this;
        },
        strokeRectCenter: function(p, w, h) {
            this.context.strokeRect(p.x - 0.5 * w, p.y - 0.5 * h, w, h);
            return this;
        },
        polygon: function(ps) {
            this.context.beginPath();
            this.context.moveTo(ps[0].x, ps[0].y);
            for(var i = 1; i < ps.length; i++) this.context.lineTo(ps[i].x, ps[i].y);
            this.context.closePath();
            return this;
        },
        gradient: function(p, w, h) { return this.context.createLinearGradient(p.x, p.y, w, h); },
        setStrokeGradient: function(grad) {
            this.context.strokeStyle = grad;
            return this;
        },
        setFillGradient: function(grad) {
            this.context.fillStyle = grad;
            return this;
        },

        // text
        text: function(str, pos) {
            this.context.fillText(str, pos.x, pos.y);
            return this;
        },
        strokeText: function(str, pos) {
            this.context.strokeText(str, pos.x, pos.y);
            return this;
        },
        setFont: function(setting) {
            setting.size = (typeof setting.size === 'number') ? (setting.size + 'px') : setting.size;
            this.context.font = setting.size + ' ' + (Array.isArray(setting.family) ? setting.family.join(', ') : setting.family);
            return this;
        },
        font: function() { return this.context.font; },
        setTextAlign: function(align) {
            this.context.textAlign = align;
            return this;
        },
        textAlign: function() { return this.context.textAlign; },
        pushFontSetting: function() {
            this.fontStates.push({
                font: this.font(),
                textAlign: this.textAlign()
            });
            return this;
        },
        popFontSetting: function() {
            var state = this.fontStates.pop();
            this.setFont(state.font);
            this.setTextAlign(state.textAlign);
            return this;
        },

        // transform
        push: function() {
            this.context.save();
            return this;
        },
        pop: function() {
            this.context.restore();
            return this;
        },
        setTransform: function(m11, m12, m21, m22, dx, dy) {
            this.context.setTransform(m11, m12, m21, m22, dx, dy);
            return this;
        },
        transform: function(m11, m12, m21, m22, dx, dy) {
            this.context.transform(m11, m12, m21, m22, dx, dy);
            return this;
        },
        translate: function(dp) {
            this.context.translate(dp.x, dp.y);
            return this;
        },
        rotate: function(rotation) {
            this.context.rotate(rotation);
            return this;
        },
        scale: function(sx, sy) {
            sy === undefined ? this.context.scale(sx, sx) : this.context.scale(sx, sy);
            return this;
        }
    });

    return renderer;
})();

bbb.canvas.app = (function() {
    function app(name, opts) {
        opts = opts || {};
        bbb.extend(this, {
            name: name,
            setup:      opts.setup      || function setup_isnt_given(context, app, renderer) {},
            resize:     opts.resize     || function resize_isnt_given(context, app, renderer) {},
            willStart:  opts.willStart  || function willStart_isnt_given(context, app, renderer) {},
            update:     opts.update     || function update_isnt_given(context, app, renderer) {},
            draw:       opts.draw       || function draw_isnt_given(context, app, renderer) {},
            willFinish: opts.willFinish || function willFinish_isnt_given(context, app, renderer) {},
            properties: opts.properties || {},
            methods:    opts.methods    || {},
        });
    }

    bbb.extend(app.prototype, {
        addProperty: function(key, value) { this.properties[key] = value; return this; },
        addProperties: function(properties) { bbb.extend(this.properties, properties); return this; },
        addMethod: function(key, method) { this.methods[key] = method; return this; },
        addProperties: function(methods) { bbb.extend(this.methods, methods); return this; },
        toString: function() {
            return [
                '// setup',
                this.setup.toString(),
                '// update', 
                this.update.toString(),
                '// draw',
                this.draw.toString()].join('\n\n');
        }
    });

    return app;
})();