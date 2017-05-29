function bbb() {};

bbb.extend = function(dst, src) {
    for(var key in src) if(src.hasOwnProperty(key)) dst[key] = src[key];
    return dst;
};
