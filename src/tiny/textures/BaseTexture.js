
Tiny.BaseTextureCache = {};

Tiny.BaseTextureCacheIdGenerator = 0;

Tiny.BaseTexture = function(source, scaleMode)
{
    this.resolution = 1;

    this.width = 100;

    this.height = 100;

    this.scaleMode = scaleMode || Tiny.scaleModes.DEFAULT;

    this.hasLoaded = false;

    this.source = source;

    this._UID = Tiny._UID++;

    this.premultipliedAlpha = true;

    this._glTextures = [];

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
        /*
        var scope = this;
        this.source.onload = function() {
            scope.hasLoaded = true;
            scope.width = scope.source.naturalWidth || scope.source.width;
            scope.height = scope.source.naturalHeight || scope.source.height;
            scope.dirty();
            // add it to somewhere...
            scope.dispatchEvent( { type: 'loaded', content: scope } );
        };
        this.source.onerror = function() {
            scope.dispatchEvent( { type: 'error', content: scope } );
        };
        */
    }

    this.imageUrl = null;

    this._powerOf2 = false;

};

Tiny.BaseTexture.prototype.constructor = Tiny.BaseTexture;

Tiny.BaseTexture.prototype.destroy = function()
{
    if(this.imageUrl)
    {
        delete Tiny.BaseTextureCache[this.imageUrl];
        delete Tiny.TextureCache[this.imageUrl];
        this.imageUrl = null;
        if (!navigator.isCocoonJS) this.source.src = '';
    }
    else if (this.source && this.source._pixiId)
    {
        delete Tiny.BaseTextureCache[this.source._pixiId];
    }
    this.source = null;

    this.unloadFromGPU();
};

Tiny.BaseTexture.prototype.updateSourceImage = function(newSrc)
{
    this.hasLoaded = false;
    this.source.src = null;
    this.source.src = newSrc;
};

Tiny.BaseTexture.prototype.dirty = function()
{
    for (var i = 0; i < this._glTextures.length; i++)
    {
        this._dirty[i] = true;
    }
};

Tiny.BaseTexture.prototype.unloadFromGPU = function()
{
    this.dirty();

    // delete the webGL textures if any.
    for (var i = this._glTextures.length - 1; i >= 0; i--)
    {
        var glTexture = this._glTextures[i];
        var gl = Tiny.glContexts[i];

        if(gl && glTexture)
        {
            gl.deleteTexture(glTexture);
        }
        
    }

    this._glTextures.length = 0;

    this.dirty();
};

Tiny.BaseTexture.fromImage = function(imageUrl, crossorigin, scaleMode)
{
    var baseTexture = Tiny.BaseTextureCache[imageUrl];

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
        baseTexture = new Tiny.BaseTexture(image, scaleMode);
        baseTexture.imageUrl = imageUrl;
        Tiny.BaseTextureCache[imageUrl] = baseTexture;

        // if there is an @2x at the end of the url we are going to assume its a highres image
        if( imageUrl.indexOf(Tiny.RETINA_PREFIX + '.') !== -1)
        {
            baseTexture.resolution = 2;
        }
    }

    return baseTexture;
};

Tiny.BaseTexture.fromCanvas = function(canvas, scaleMode)
{
    if(!canvas._pixiId)
    {
        canvas._pixiId = 'canvas_' + Tiny.TextureCacheIdGenerator++;
    }

    var baseTexture = Tiny.BaseTextureCache[canvas._pixiId];

    if(!baseTexture)
    {
        baseTexture = new Tiny.BaseTexture(canvas, scaleMode);
        Tiny.BaseTextureCache[canvas._pixiId] = baseTexture;
    }

    return baseTexture;
};