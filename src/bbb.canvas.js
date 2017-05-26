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
    function renderer(canvas, extender) {
        var $canvas = $(canvas),
            $window = $(window),
            $document = $(document);
        
        bbb.extend(this, {
            canvas: canvas,
            $canvas: $canvas,
            $window: $window,
            $document: $document,
            context: canvas.getContext('2d'),
            
            frame: 0,
            scroll_pos: 0.0,
            scroll_height: $window.height() - $canvas.height(),
            size: { width: $canvas.width(), height: $canvas.height() },
            center: { x: $canvas.width() * 0.5, y: $canvas.height() * 0.5 },
            mouse: { x: 0, y: 0 },
            setup: function(context) {},
            update: function(context) {},
            draw: function(context) {},
            is_paused: false,

            // draw properties
            fill_color: bbb.canvas.rgba(255, 255, 255, 255),
            stroke_color: bbb.canvas.rgba(255, 255, 255, 255),
        });

        bbb.extend(this, extender.properties);
        delete extender.properties;
        bbb.extend(this, extender);
    };

    bbb.extend(renderer.prototype, {
        resize: function() {
            this.$canvas.attr('width', this.$canvas.width());
            this.$canvas.attr('height', this.$canvas.height());
            this.size.width = this.$canvas.width();
            this.size.height = this.$canvas.height();
            this.center.x = this.$canvas.width() * 0.5;
            this.center.y = this.$canvas.height() * 0.5;
            this.scroll_height = (this.$document.height() == this.$window.height()) ? -1 : (this.$document.height() - this.$window.height());
        },
        render: function() {
            if(this.is_paused) return;
            this.update_internal();
            this.update(this.context);
            this.draw(this.context);
            requestAnimationFrame(this.render.bind(this));
        },
        update_internal: function() {
            this.scroll_pos = this.scroll_height < 0 ? -1.0 : (this.$window.scrollTop() / this.scroll_height);
            this.frame++;
        },
        set_update: function(new_update) { this.update = new_update; },
        set_draw: function(new_draw, with_clear_context) {
            if(with_clear_context) {
                this.draw = (function(that, new_draw) {
                    return function() {
                        that.clear();
                        that.draw = new_draw;
                        that.draw(that.context);
                    };
                })(this, new_draw);
            } else {
                this.draw = new_draw;
            }
        },
        init: function() {
            var that = this;
            this.resize();
            this.$document.mousemove(function(event) {
                that.mouse.x = event.pageX;
                that.mouse.y = event.pageY - that.$window.scrollTop();
            });
            this.$window.resize(function() {
                that.resize();
            });
            this.setup();
            return this;
        },
        start: function() {
            this.init();
            this.render();
            return this;
        },
        pause: function() { this.is_paused = true; return this; },
        resume: function() { this.is_paused = false; return this; },
        extend: function(src) { return bbb.extend(this, src); },

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
            this.fill_color = bbb.canvas.rgba(r, g, b, a);
            this.context.fillStyle = this.fill_color;
        },
        setFillColorHSV: function(h, s, v, a) {
            this.fill_color = bbb.canvas.hsva(h, s, v, a);
            this.context.fillStyle = this.fill_color;
        },
        fill: function() {
            this.context.fill();
            return this;
        },
        moveTo: function(x, y) { this.context.moveTo(x, y); },
        lineTo: function(x, y) { this.context.lineTo(x, y); },
        line: function(sx, sy, ex, ey) { 
            this.context.moveTo(sx, sy);
            this.context.lineTo(ex, ey);
        },
        lines: function(pos) {
            this.context.moveTo(pos[0][0], pos[0][1]);
            for(var i = 1; i < pos.length; i++) this.context.lineTo(pos[i][0], pos[i][1]);
        },
        rect: function(x, y, w, h) { this.context.fillRect(x, y, w, h); },
        strokeRect: function(x, y, w, h) { this.context.strokeRect(x, y, w, h); },
        polygon: function(pos) {
            this.context.beginPath();
            this.context.moveTo(pos[0][0], pos[0][1]);
            for(var i = 1; i < pos.length; i++) this.context.lineTo(pos[i][0], pos[i][1]);
            this.context.closePath();
        },
        point: function(x, y) { this.context.fillRect(x - 0.5, y - 0.5, 1, 1); },
        points: function(pts) { for(var i = 0; i < pts.length; i++) this.context.fillRect(pts[i][0] - 0.5, pts[i][1] - 0.5, 1, 1); },
    });

    return renderer;
})();