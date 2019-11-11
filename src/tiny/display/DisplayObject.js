/**
 * @author Mat Groves http://matgroves.com/ @Doormat23
 */

/**
 * The base class for all objects that are rendered on the screen.
 * This is an abstract class and should not be used on its own rather it should be extended.
 *
 * @class DisplayObject
 * @constructor
 */

Tiny.DisplayObject = function()
{
    this.position = new Tiny.Point(0, 0);
    this.scale = new Tiny.Point(1, 1);
    this.transformCallback = null;
    this.transformCallbackContext = null;
    this.pivot = new Tiny.Point(0, 0);
    this.rotation = 0;
    this.alpha = 1;
    this.visible = true;
    this.hitArea = null;
    this.renderable = false;
    this.parent = null;
    this.stage = null;
    this.worldAlpha = 1;
    this.worldTransform = new Tiny.Matrix();
    this._sr = 0;
    this._cr = 1;
    this.filterArea = null;
    this._bounds = new Tiny.Rectangle(0, 0, 1, 1);
    this._currentBounds = null;
    this._mask = null;
    this._cacheAsBitmap = false;
    this._cacheIsDirty = false;

};

Tiny.DisplayObject.prototype.constructor = Tiny.DisplayObject;


Tiny.DisplayObject.prototype.destroy = function()
{
    if (this.children)
    {
        var i = this.children.length;

        while (i--)
        {
            this.children[i].destroy();
        }

        this.children = [];
    }

    this.transformCallback = null;
    this.transformCallbackContext = null;
    this.hitArea = null;
    this.parent = null;
    this.stage = null;
    this.worldTransform = null;
    this.filterArea = null;
    this._bounds = null;
    this._currentBounds = null;
    this._mask = null;

    this.renderable = false;

    this._destroyCachedSprite();
};

Object.defineProperty(Tiny.DisplayObject.prototype, 'worldVisible', {

    get: function() {

        var item = this;

        do
        {
            if (!item.visible) return false;
            item = item.parent;
        }
        while(item);

        return true;
    }

});

Object.defineProperty(Tiny.DisplayObject.prototype, 'mask', {

    get: function() {
        return this._mask;
    },

    set: function(value) {

        if (this._mask) this._mask.isMask = false;

        this._mask = value;

        if (this._mask) this._mask.isMask = true;
    }

});

Object.defineProperty(Tiny.DisplayObject.prototype, 'filters', {

    get: function() {
        return this._filters;
    },

    set: function(value) {

        if (value)
        {
            // now put all the passes in one place..
            var passes = [];

            for (var i = 0; i < value.length; i++)
            {
                var filterPasses = value[i].passes;

                for (var j = 0; j < filterPasses.length; j++)
                {
                    passes.push(filterPasses[j]);
                }
            }

            // TODO change this as it is legacy
            this._filterBlock = { target: this, filterPasses: passes };
        }

        this._filters = value;
    }
});

Object.defineProperty(Tiny.DisplayObject.prototype, 'cacheAsBitmap', {

    get: function() {
        return  this._cacheAsBitmap;
    },

    set: function(value) {

        if (this._cacheAsBitmap === value) return;

        if (value)
        {
            this._generateCachedSprite();
        }
        else
        {
            this._destroyCachedSprite();
        }

        this._cacheAsBitmap = value;
    }
});

Tiny.DisplayObject.prototype.updateTransform = function()
{
    if (!this.parent)
    {
        return;
    }

    // create some matrix refs for easy access
    var pt = this.parent.worldTransform;
    var wt = this.worldTransform;

    // temporary matrix variables
    var a, b, c, d, tx, ty;

    // so if rotation is between 0 then we can simplify the multiplication process..
    if (this.rotation % Tiny.PI_2)
    {
        // check to see if the rotation is the same as the previous render. This means we only need to use sin and cos when rotation actually changes
        if (this.rotation !== this.rotationCache)
        {
            this.rotationCache = this.rotation;
            this._sr = Math.sin(this.rotation);
            this._cr = Math.cos(this.rotation);
        }

        // get the matrix values of the displayobject based on its transform properties..
        a  =  this._cr * this.scale.x;
        b  =  this._sr * this.scale.x;
        c  = -this._sr * this.scale.y;
        d  =  this._cr * this.scale.y;
        tx =  this.position.x;
        ty =  this.position.y;
        
        // check for pivot.. not often used so geared towards that fact!
        if (this.pivot.x || this.pivot.y)
        {
            tx -= this.pivot.x * a + this.pivot.y * c;
            ty -= this.pivot.x * b + this.pivot.y * d;
        }

        // concat the parent matrix with the objects transform.
        wt.a  = a  * pt.a + b  * pt.c;
        wt.b  = a  * pt.b + b  * pt.d;
        wt.c  = c  * pt.a + d  * pt.c;
        wt.d  = c  * pt.b + d  * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;
    }
    else
    {
        // lets do the fast version as we know there is no rotation..
        a  = this.scale.x;
        d  = this.scale.y;

        tx = this.position.x - this.pivot.x * a;
        ty = this.position.y - this.pivot.y * d;

        wt.a  = a  * pt.a;
        wt.b  = a  * pt.b;
        wt.c  = d  * pt.c;
        wt.d  = d  * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;
    }

    // multiply the alphas..
    this.worldAlpha = this.alpha * this.parent.worldAlpha;

    //  Custom callback?
    if (this.transformCallback)
    {
        this.transformCallback.call(this.transformCallbackContext, wt, pt);
    }

};

// performance increase to avoid using call.. (10x faster)
Tiny.DisplayObject.prototype.displayObjectUpdateTransform = Tiny.DisplayObject.prototype.updateTransform;

Tiny.DisplayObject.prototype.getBounds = function(matrix)
{
    matrix = matrix;//just to get passed js hinting (and preserve inheritance)
    return Tiny.EmptyRectangle;
};

Tiny.DisplayObject.prototype.getLocalBounds = function()
{
    return this.getBounds(Tiny.identityMatrix);///PIXI.EmptyRectangle();
};

Tiny.DisplayObject.prototype.setStageReference = function(stage)
{
    this.stage = stage;
};

Tiny.DisplayObject.prototype.preUpdate = function()
{
};

Tiny.DisplayObject.prototype.generateTexture = function(resolution, scaleMode, renderer)
{
    var bounds = this.getLocalBounds();

    var renderTexture = new PIXI.RenderTexture(bounds.width | 0, bounds.height | 0, renderer, scaleMode, resolution);
    
    Tiny.DisplayObject._tempMatrix.tx = -bounds.x;
    Tiny.DisplayObject._tempMatrix.ty = -bounds.y;
    
    renderTexture.render(this, Tiny.DisplayObject._tempMatrix);

    return renderTexture;
};

Tiny.DisplayObject.prototype.updateCache = function()
{
    this._generateCachedSprite();
};

Tiny.DisplayObject.prototype.toGlobal = function(position)
{
    // don't need to u[date the lot
    this.displayObjectUpdateTransform();
    return this.worldTransform.apply(position);
};

Tiny.DisplayObject.prototype.toLocal = function(position, from)
{
    if (from)
    {
        position = from.toGlobal(position);
    }

    // don't need to u[date the lot
    this.displayObjectUpdateTransform();

    return this.worldTransform.applyInverse(position);
};

Tiny.DisplayObject.prototype._renderCachedSprite = function(renderSession)
{
    this._cachedSprite.worldAlpha = this.worldAlpha;

    PIXI.Sprite.prototype._renderCanvas.call(this._cachedSprite, renderSession);

};

Tiny.DisplayObject.prototype._generateCachedSprite = function()
{
    this._cacheAsBitmap = false;

    var bounds = this.getLocalBounds();

    if (!this._cachedSprite)
    {
        var renderTexture = new PIXI.RenderTexture(bounds.width | 0, bounds.height | 0);//, renderSession.renderer);

        this._cachedSprite = new PIXI.Sprite(renderTexture);
        this._cachedSprite.worldTransform = this.worldTransform;
    }
    else
    {
        this._cachedSprite.texture.resize(bounds.width | 0, bounds.height | 0);
    }

    var tempFilters = this._filters;
    this._filters = null;

    this._cachedSprite.filters = tempFilters;

    Tiny.DisplayObject._tempMatrix.tx = -bounds.x;
    Tiny.DisplayObject._tempMatrix.ty = -bounds.y;
    
    this._cachedSprite.texture.render(this, Tiny.DisplayObject._tempMatrix, true);

    this._cachedSprite.anchor.x = -( bounds.x / bounds.width );
    this._cachedSprite.anchor.y = -( bounds.y / bounds.height );

    this._filters = tempFilters;

    this._cacheAsBitmap = true;
};

Tiny.DisplayObject.prototype._destroyCachedSprite = function()
{
    if (!this._cachedSprite) return;

    this._cachedSprite.texture.destroy(true);

    this._cachedSprite = null;
};

Tiny.DisplayObject.prototype._renderCanvas = function(renderSession)
{

    renderSession = renderSession;
};

Object.defineProperty(Tiny.DisplayObject.prototype, 'x', {

    get: function() {
        return  this.position.x;
    },

    set: function(value) {
        this.position.x = value;
    }

});

Object.defineProperty(Tiny.DisplayObject.prototype, 'y', {

    get: function() {
        return  this.position.y;
    },

    set: function(value) {
        this.position.y = value;
    }

});