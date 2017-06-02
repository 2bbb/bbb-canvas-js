bbb.math = {
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