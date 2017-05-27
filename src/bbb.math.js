bbb.math = {
    lerp: function(from, to, t) { return from * (1.0 - t) + to * t; },
    clamp: function(v, from, to) { return Math.max(from, Math.min(to, v)); },
};