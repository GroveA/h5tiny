
Tiny.Timer = function(game, cb, delay, loop, n, oncomplete) {
    this.game = game;
    this._cb_ = cb || function() {}
    this.delay = delay || 1000
    this.loop = loop
    this._count = n || 0
    this._repeat = (this._count > 0)
    this.status = 0
    this._lastFrame = 0
    this._oncomplete = oncomplete || function() {}
}

Tiny.Timer.prototype = {
    start: function() {
        this.status = 1
    },
    pause: function() {
        this.status = 0
    },
    stop: function() {
        this.status = 0
        this._lastFrame = 0
    },
    update: function(deltaTime) {
        if (this.status) {
            this._lastFrame += deltaTime
            if (this._lastFrame >= this.delay) {
                this._cb_()
                this._lastFrame = 0
                if (this._repeat) {
                    this._count--;
                    if (this._count === 0) {
                        this.status = 0
                        this._oncomplete()
                    }
                } else if (!this.loop) {
                    this.status = 0
                }
            }
        }
    }
}

Tiny.TimerCreator = function (game)
{
    this.game = game;
    this.game.timers = []

    this.game.timers.remove = function(item) {
        this.splice(this.indexOf(item), 1)
    }
};

Tiny.TimerCreator.prototype = {
    removeAll: function() {
        this.game.timers.forEach(function(tm) {
            tm.stop()
        })
        this.game.timers = []
    },
    remove: function(tm) {
        tm.stop()
        this.game.timers.splice(this.game.timers.indexOf(tm), 1)
    },
    add: function(delay, cb) {
        var timer = new Tiny.Timer(this.game, cb, delay)
        this.game.timers.push(timer)
        return timer
    },
    loop: function(delay, cb) {
        var timer = new Tiny.Timer(this.game, cb, delay, true)
        this.game.timers.push(timer)
        return timer
    },
    repeat: function(delay, n, cb, complete) {
        var timer = new Tiny.Timer(this.game, cb, delay, false, n, complete)
        this.game.timers.push(timer)
        return timer
    }
};