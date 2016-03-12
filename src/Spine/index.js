var spine = require('../SpineRuntime');
var atlasParser = require('../loaders/atlasParser');

var core = PIXI;
var is3d = !!core.flip;
var ContainerClass = is3d ? core.flip.Container3d : core.Container;
;
var SpriteClass = is3d ? core.flip.Sprite3d : core.Sprite;
var MeshClass = is3d ? core.flip.Mesh3d : core.mesh.Mesh;
var updateTransformField = is3d ? "updateTransform3d" : "updateTransform";
/* Esoteric Software SPINE wrapper for pixi.js */
spine.Bone.yDown = true;

/**
 * A class that enables the you to import and run your spine animations in pixi.
 * The Spine animation data needs to be loaded using either the Loader or a SpineLoader before it can be used by this class
 * See example 12 (http://www.goodboydigital.com/pixijs/examples/12/) to see a working example and check out the source
 *
 * ```js
 * var spineAnimation = new PIXI.Spine(spineData);
 * ```
 *
 * @class
 * @extends Container
 * @memberof PIXI.spine
 * @param spineData {object} The spine data loaded from a spine atlas.
 */
function Spine(spineData) {
    ContainerClass.call(this);

    if (!spineData) {
        throw new Error('The spineData param is required.');
    }

    if ((typeof spineData) === "string") {
        throw new Error('spineData param cant be string. Please use PIXI.spine.Spine.fromAtlas("YOUR_RESOURCE_NAME") from now on.');
    }

    /**
     * The spineData object
     *
     * @member {object}
     */
    this.spineData = spineData;

    /**
     * A spine Skeleton object
     *
     * @member {object}
     */
    this.skeleton = new spine.Skeleton(spineData);
    this.skeleton.updateWorldTransform();

    /**
     * A spine AnimationStateData object created from the spine data passed in the constructor
     *
     * @member {object}
     */
    this.stateData = new spine.AnimationStateData(spineData);

    /**
     * A spine AnimationState object created from the spine AnimationStateData object
     *
     * @member {object}
     */
    this.state = new spine.AnimationState(this.stateData);

    /**
     * An array of containers
     *
     * @member {PIXI.flip.Container[]}
     */
    this.slotContainers = [];

    for (var i = 0, n = this.skeleton.slots.length; i < n; i++) {
        var slot = this.skeleton.slots[i];
        var attachment = slot.attachment;
        var slotContainer = new ContainerClass();
        this.slotContainers.push(slotContainer);
        this.addChild(slotContainer);

        if (attachment instanceof spine.RegionAttachment) {
            var spriteName = attachment.rendererObject.name;
            var sprite = this.createSprite(slot, attachment);
            slot.currentSprite = sprite;
            slot.currentSpriteName = spriteName;
            slotContainer.addChild(sprite);
        }
        else if (attachment instanceof spine.MeshAttachment) {
            var mesh = this.createMesh(slot, attachment);
            slot.currentMesh = mesh;
            slot.currentMeshName = attachment.name;
            slotContainer.addChild(mesh);
        }
        else {
            continue;
        }

    }

    this._bounds2 = new core.Rectangle();

    this.boundsAttachmentName = "bounds";
    this._boundsFound = false;
    this._boundsVertices = null;
    this.findBounds();

    /**
     * Should the Spine object update its transforms
     *
     * @member {boolean}
     */
    this.autoUpdate = true;
}

Spine.fromAtlas = function (resourceName) {
    var skeletonData = atlasParser.AnimCache[resourceName];

    if (!skeletonData) {
        throw new Error('Spine data "' + resourceName + '" does not exist in the animation cache');
    }

    return new Spine(skeletonData);
}

Spine.prototype = Object.create(ContainerClass.prototype);
Spine.prototype.constructor = Spine;
module.exports = Spine;

Spine.globalAutoUpdate = true;

Object.defineProperties(Spine.prototype, {
    /**
     * If this flag is set to true, the spine animation will be autoupdated every time
     * the object id drawn. The down side of this approach is that the delta time is
     * automatically calculated and you could miss out on cool effects like slow motion,
     * pause, skip ahead and the sorts. Most of these effects can be achieved even with
     * autoupdate enabled but are harder to achieve.
     *
     * @member {boolean}
     * @memberof Spine#
     * @default true
     */
    autoUpdate: {
        get: function () {
            return (this[updateTransformField] === Spine.prototype.autoUpdateTransform);
        },

        set: function (value) {
            this[updateTransformField] = value ? Spine.prototype.autoUpdateTransform : ContainerClass.prototype[updateTransformField];
        }
    }
});

/**
 * Update the spine skeleton and its animations by delta time (dt)
 *
 * @param dt {number} Delta time. Time by which the animation should be updated
 */
Spine.prototype.update = function (dt) {
    this.state.update(dt);
    this.state.apply(this.skeleton);
    this.skeleton.updateWorldTransform();

    var drawOrder = this.skeleton.drawOrder;
    var slots = this.skeleton.slots;

    for (var i = 0, n = drawOrder.length; i < n; i++) {
        this.children[i] = this.slotContainers[drawOrder[i]];
    }
    this.findBounds();
    for (i = 0, n = slots.length; i < n; i++) {
        var slot = slots[i];
        var attachment = slot.attachment;
        var slotContainer = this.slotContainers[i];

        if (!attachment) {
            slotContainer.visible = false;
            continue;
        }

        var type = attachment.type;
        if (type === spine.AttachmentType.region) {
            if (attachment.rendererObject) {
                if (!slot.currentSpriteName || slot.currentSpriteName !== attachment.rendererObject.name) {
                    var spriteName = attachment.rendererObject.name;
                    if (slot.currentSprite !== undefined) {
                        slot.currentSprite.visible = false;
                    }
                    slot.sprites = slot.sprites || {};
                    if (slot.sprites[spriteName] !== undefined) {
                        slot.sprites[spriteName].visible = true;
                    }
                    else {
                        var sprite = this.createSprite(slot, attachment);
                        slotContainer.addChild(sprite);
                    }
                    slot.currentSprite = slot.sprites[spriteName];
                    slot.currentSpriteName = spriteName;
                }
            }

            var bone = slot.bone;

            slotContainer.position.x = bone.worldX + attachment.x * bone.m00 + attachment.y * bone.m01;
            slotContainer.position.y = bone.worldY + attachment.x * bone.m10 + attachment.y * bone.m11;
            slotContainer.scale.x = bone.worldScaleX;
            slotContainer.scale.y = bone.worldScaleY;
            var rot = -(slot.bone.worldRotation * spine.degRad);
            if (bone.worldFlipX) {
                slotContainer.scale.x = -slotContainer.scale.x;
                slotContainer.rotation = -(slot.bone.worldRotation * spine.degRad);
                rot = -rot;
            }
            if (bone.worldFlipY == spine.Bone.yDown) {
                slotContainer.scale.y = -slotContainer.scale.y;
                rot = -rot;
            }
            slotContainer.rotation = rot;
            slot.currentSprite.blendMode = slot.blendMode;
            slot.currentSprite.tint = core.utils.rgb2hex([slot.r, slot.g, slot.b]);
        }
        else if (type === spine.AttachmentType.skinnedmesh || type === spine.AttachmentType.mesh) {
            if (!slot.currentMeshName || slot.currentMeshName !== attachment.name) {
                var meshName = attachment.name;
                if (slot.currentMesh !== undefined) {
                    slot.currentMesh.visible = false;
                }

                slot.meshes = slot.meshes || {};

                if (slot.meshes[meshName] !== undefined) {
                    slot.meshes[meshName].visible = true;
                }
                else {
                    var mesh = this.createMesh(slot, attachment);
                    slotContainer.addChild(mesh);
                }

                slot.currentMesh = slot.meshes[meshName];
                slot.currentMeshName = meshName;
            }

            attachment.computeWorldVertices(slot.bone.skeleton.x, slot.bone.skeleton.y, slot, slot.currentMesh.vertices);

        }
        else {
            slotContainer.visible = false;
            continue;
        }
        slotContainer.visible = true;

        slotContainer.alpha = slot.a;
    }
};

Spine.prototype.findBounds = function() {
    if (!this._boundsFound || !this._boundsFound.attachment || !this._boundsFound.attachment.name != this.boundsAttachmentName) {
        this._boundsFound = null;
        var slots = this.skeleton.slots;
        for (var i = 0, n = slots.length; i < n; i++) {
            var slot = slots[i];
            var attachment = slot.attachment;
            if (attachment && attachment.type == spine.AttachmentType.boundingbox && attachment.name == this.boundsAttachmentName) {
                this._boundsFound = slot;
                break;
            }
        }
    }
    if (this._boundsFound) {
        var slot = this._boundsFound;
        var attachment = slot.attachment;
        if (!this._boundsVertices)
            this._boundsVertices = new Float32Array(attachment.vertices.length);
        attachment.computeWorldVertices(0, 0, slot.bone, this._boundsVertices);
    }
};

/**
 * When autoupdate is set to yes this function is used as pixi's updateTransform function
 *
 * @private
 */
Spine.prototype.autoUpdateTransform = function () {
    if (Spine.globalAutoUpdate) {
        this.lastTime = this.lastTime || Date.now();
        var timeDelta = (Date.now() - this.lastTime) * 0.001;
        this.lastTime = Date.now();
        this.update(timeDelta);
    } else {
        this.lastTime = 0;
    }

    ContainerClass.prototype[updateTransformField].call(this);
};

/**
 * Create a new sprite to be used with spine.RegionAttachment
 *
 * @param slot {spine.Slot} The slot to which the attachment is parented
 * @param attachment {spine.RegionAttachment} The attachment that the sprite will represent
 * @private
 */
Spine.prototype.createSprite = function (slot, attachment) {
    var descriptor = attachment.rendererObject;
    var baseTexture = descriptor.page.rendererObject;
    var spriteRect = new core.Rectangle(descriptor.x,
        descriptor.y,
        descriptor.rotate ? descriptor.height : descriptor.width,
        descriptor.rotate ? descriptor.width : descriptor.height);
    var spriteTexture = new core.Texture(baseTexture, spriteRect);
    var sprite = new SpriteClass(spriteTexture);

    var baseRotation = descriptor.rotate ? Math.PI * 0.5 : 0.0;
    sprite.scale.x = attachment.width / descriptor.originalWidth * attachment.scaleX;
    sprite.scale.y = attachment.height / descriptor.originalHeight * attachment.scaleY;
    sprite.rotation = baseRotation - (attachment.rotation * spine.degRad);
    sprite.anchor.x = (0.5 * descriptor.originalWidth - descriptor.offsetX) / descriptor.width;
    sprite.anchor.y = 1.0 - ((0.5 * descriptor.originalHeight - descriptor.offsetY) / descriptor.height);
    sprite.alpha = attachment.a;

    if (descriptor.rotate) {
        var x1 = sprite.scale.x;
        sprite.scale.x = sprite.scale.y;
        sprite.scale.y = x1;
    }

    slot.sprites = slot.sprites || {};
    slot.sprites[descriptor.name] = sprite;
    return sprite;
};

/**
 * Creates a Strip from the spine data
 * @param slot {spine.Slot} The slot to which the attachment is parented
 * @param attachment {spine.RegionAttachment} The attachment that the sprite will represent
 * @private
 */
Spine.prototype.createMesh = function (slot, attachment) {
    var descriptor = attachment.rendererObject;
    var baseTexture = descriptor.page.rendererObject;
    var texture = new core.Texture(baseTexture);

    var strip = new MeshClass(
        texture,
        new Float32Array(attachment.uvs.length),
        new Float32Array(attachment.uvs),
        new Uint16Array(attachment.triangles),
        core.mesh.Mesh.DRAW_MODES.TRIANGLES);

    strip.canvasPadding = 1.5;

    strip.alpha = attachment.a;

    slot.meshes = slot.meshes || {};
    slot.meshes[attachment.name] = strip;

    return strip;
};


Spine.prototype.getLocalBounds = function () {
    var matrixCache = this.worldTransform;
    this.worldTransform = core.Matrix.IDENTITY;
    if (is3d) {
        var matrixCache2 = this.worldTransform3d;
        this.worldTransform3d = core.flip.math3d.IDENTITY;
    }

    var r = null;
    if (this._boundsFound) {
         r = this.meshGetBounds();
    } else {
        for (var i = 0, j = this.children.length; i < j; ++i) {
            this.children[i].updateTransform3d();
        }
    }

    this.worldTransform = matrixCache;
    if (is3d) {
        this.worldTransform3d = matrixCache2;
    }
    this._currentBounds = null;
    return r || this.containerGetBounds(core.Matrix.IDENTITY);
};

Spine.prototype.spineGetLocalBounds = Spine.prototype.getLocalBounds;

Spine.prototype.meshGetBounds = core.mesh.Mesh.prototype.getBounds;


Spine.prototype.getBounds = function () {
    if (!this._currentBounds) {
        if (!is3d) {
            if (this._boundsFound) {
                this.vertices = this._boundsVertices;
                this._currentBounds = this.meshGetBounds();
                this.vertices = null;
            } else
                this._currentBounds = this.containerGetBounds();
        } else {
            if (this._boundsFound) {
                this._currentBounds = core.flip.math3d.makeRectBoundsMesh(this._bounds2, this.worldTransform3d, this.projectionMatrix, this._boundsVertices);
            } else {
                var localBounds = this.spineGetLocalBounds();
                if (localBounds === core.Rectangle.EMPTY) return this._currentBounds = localBounds;
                this._currentBounds = core.flip.math3d.makeRectBounds(this._bounds2, this.worldTransform3d, this.projectionMatrix, localBounds.x, localBounds.y, localBounds.width, localBounds.height);
            }
        }
    }
    return this._currentBounds;
};

Spine.prototype.spineGetBounds = Spine.prototype.getBounds;
