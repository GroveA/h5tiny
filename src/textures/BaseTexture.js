
Tiny.BaseTextureCache = {};

Tiny.BaseTextureCacheIdGenerator = 0;

Tiny.BaseTexture = function(source)
{
    this.resolution = 1;

    this.width = 100;

    this.height = 100;

    this.hasLoaded = false;

    this.source = source;

    this._UID = Tiny._UID++;

    this.premultipliedAlpha = true;

    this.mipmap = false;

    this._dirty = [true, true, true, true];

    if(!source)return;

    if((this.source.complete || this.source.getContext) && this.source.width && this.source.height)
    {
        this.hasLoaded = true;
        this.width = this.source.naturalWidth || this.source.width;
        this.height = this.source.naturalHeight || this.source.height;
        this.dirty();
    }
    else
    {
        var scope = this;
        this.source.onload = function() {
            scope.hasLoaded = true;
            scope.width = scope.source.naturalWidth || scope.source.width;
            scope.height = scope.source.naturalHeight || scope.source.height;
        };
    }

    this.imageUrl = null;

    this._powerOf2 = false;

};

Tiny.BaseTexture.prototype.constructor = Tiny.BaseTexture;

Tiny.BaseTexture.prototype.destroy = function()
{
    if(this.imageUrl)
    {
        delete Tiny.BaseTextureCache[this.key];
        delete Tiny.TextureCache[this.key];
        this.imageUrl = null;
        if (!navigator.isCocoonJS) this.source.src = '';
    }
    else if (this.source && this.source._pixiId)
    {
        delete Tiny.BaseTextureCache[this.source._pixiId];
    }
    this.source = null;
};

Tiny.BaseTexture.prototype.updateSourceImage = function(newSrc)
{
    this.hasLoaded = false;
    this.source.src = null;
    this.source.src = newSrc;
};

Tiny.BaseTexture.prototype.dirty = function()
{

};

Tiny.BaseTexture.fromImage = function(key, imageUrl, crossorigin)
{
    var baseTexture = Tiny.BaseTextureCache[key];

    if(crossorigin === undefined && imageUrl.indexOf('data:') === -1) crossorigin = true;

    if(!baseTexture)
    {
        // new Image() breaks tex loading in some versions of Chrome.
        // See https://code.google.com/p/chromium/issues/detail?id=238071
        var image = new Image();//document.createElement('img');

        if (crossorigin)
        {
            image.crossOrigin = '';
        }

        image.src = imageUrl;
        baseTexture = new Tiny.BaseTexture(image);
        baseTexture.imageUrl = imageUrl;
        baseTexture.key = key
        Tiny.BaseTextureCache[key] = baseTexture;
    }

    return baseTexture;
};

Tiny.BaseTexture.fromCanvas = function(canvas)
{
    if(!canvas._pixiId)
    {
        canvas._pixiId = 'canvas_' + Tiny.TextureCacheIdGenerator++;
    }

    var baseTexture = Tiny.BaseTextureCache[canvas._pixiId];

    if(!baseTexture)
    {
        baseTexture = new Tiny.BaseTexture(canvas);
        Tiny.BaseTextureCache[canvas._pixiId] = baseTexture;
    }

    return baseTexture;
};