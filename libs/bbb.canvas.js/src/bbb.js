function bbb() {};

(function polyfill() {
    // polyfill bind
    if(!Function.prototype.bind) {
        Function.prototype.bind = function (that) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5
                // internal IsCallable function
                throw new TypeError("Function.prototype.bind -  what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1), 
                f = this, 
                fNOP = function () {},
                fBound = function () {
                    return f.apply(this instanceof fNOP && that
                        ? this
                        : that,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }
})();

bbb.extend = function(dst, src) {
    for(var key in src) if(src.hasOwnProperty(key)) dst[key] = src[key];
    return dst;
};
