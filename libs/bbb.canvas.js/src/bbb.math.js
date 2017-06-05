var math = {
    lerp: function(from, to, t) { return from * (1.0 - t) + to * t; },
    clamp: function(v, from, to) { return Math.max(from, Math.min(to, v)); },
    length: function(x, y) { return Math.sqrt(x * x, y * y); },
    distance: function(x1, y1, x2, y2) {
        x1 -= x2;
        y1 -= y2;
        return Math.sqrt(x1 * x1 + y1 * y1);
    },
    // nmap: [imin, imax] -> [omin, omax]
    map: function(v, imin, imax, omin, omax) { return (v - imin) / (imax - imin) * (omax - omin) + omin; },
    // nmap: [0, 1] -> [omin, omax]
    nmap: function(v, omin, omax) { return v * (omax - omin) + omin; },
    // smap: [-1, 1] -> [omin, omax]
    smap: function(v, omin, omax) { return 0.5 * (v + 1.0) * (omax - omin) + omin; },
};

var vec2 = (function() {
    function vec2(v) {
        bbb.extend(this, {
            x: v.x,
            y: v.y,
        });
    };
    
    function is_vec2(v) { return v instanceof vec2; };

    bbb.extend(vec2, {
        isVec2: is_vec2,
        create: function(x, y) { return new vec2(is_vec2(x) ? x : {x: x, y: y}); },
        cast: function(x, y) { return is_vec2(x) ? x : {x: x, y: y}; },

        add: function(v, w) { return new vec2(v.x + w.x, v.y + w.y); },
        sub: function(v, w) { return new vec2(v.x - w.x, v.y - w.y); },
        mul: function(v, s) { return new vec2(v.x * s, v.y * s); },
        div: function(v, s) { return new vec2(v.x / s, v.y / s); },
        eq: function(v, w) { return v.x == w.x && v.y == w.y; },
        neq: function(v, w) { return v.x != w.x || v.y != w.y; },
        dot: function(v, w) { return v.x * w.x + v.y * w.y; },
        cross: function(v, w) { return v.x * w.y - v.y * w.x; },
        abs: function(v) { return v.x * v.x + v.y * v.y; },
        length: function(v) { return Math.sqrt(v.x * v.x + v.y * v.y); },
        lerp: function(v, w, t) { var s = 1.0 - t; return new vec2(s * v.x + t * w.x, s * v.y + t * w.y); },
        clamp: function(v, min, max) { return new vec2(math.clamp(v.x, min.x, max.v). math.clamp(v.y, min.y, max.y)); }, 
    });
    
    bbb.extend(vec2.prototype, {
        clone: function() { return new vec2(this); },
        eq: function(v) { return this.x == v.x && this.y == v.y; },
        translate: function(v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        },
        translated: function(v) { return this.clone().translate(this.x + v.x, this.y + v.y); },
        scale: function(sx, sy) {
            this.x *= sx;
            this.y *= sy === undefined ? sx : sy;
            return this;
        },
        scaled: function(sx, sy) { return this.clone().scale(sx, sy); },
        reflct: function() { return this.scale(-1.0); },
        reflected: function() { return this.scaled(-1.0); },
        rotate: function(rad) {
            var c = Math.cos(rad),
                s = Math.sin(rad),
                x = c * this.x + s * this.y,
                y = -s * this.y + c * this.x;
            this.x = x;
            this.y = y;
            return this;
        },
        rotated: function(rad) { return this.clone().rotate(rad); },
        rotateTo: function(rad) {
            var len = this.length();
            this.x = Math.cos(rad) * len;
            this.y = Math.sin(rad) * len;
            return this;
        },
        rotatedTo: function(rad) { this.clone().rotateTo(rad); },
        length: function() { return Math.sqrt(this.x * this.x + this.y + this.y); },
        interpolate: function(v, t) {
            var s = 1.0 - t;
            this.x = s * this.x + t * v.x;
            this.y = s * this.y + t * v.y;
            return this;
        },
        interpolated: function(v, t) { return this.clone().interpolated(v, t); },
        middle: function(v) { return this.interpolate(v, 0.5); },
        middled: function(v) { return this.clone().interpolate(v, 0.5); },
        normalize: function(v) {
            var l = 1.0 / this.length();
            this.x *= l;
            this.y *= l;
            return this;
        },
        normalized: function(v) { this.clone().normalize(v); },
        distance: function(v) { return v.reflected().translate(v).length(); },
        dot: function(v) { return this.x * v.x + this.y * v.y; },
        cross: function(v) { return this.x * v.y + this.y * v.x; },
        angle: function() { return Math.atan(this.y, this.x); },
        angleTo: function(v) { return v.reflected().translate(this).angle(); },
        toString: function() { return "(" + this.x + ", " + this.y + ")"; },
    });
    return vec2;
})();

bbb.extend(math, {
    vec2: vec2
});

bbb.extend(bbb, {
    math: math
})