### Dynamically Combined Skins

Spine only allows 1 skin enabled per skeleton at a time. Dynamically combined skin does just that, initialize
it with the slot names in which you want your dynamically combined skin to effect its attachments
and then change or default the skins with skin names anywhere in your code.

```js
    // create spine object first
    var character = new PIXI.spine.Spine(resources.character.spineData);

    // create the skin, supply it with the spine object's skeleton and provide a list of slots you want the skin to manage its attachment/skin
    var dynamicCombinedSkin = new PIXI.spine.DynamicCombinedSkin(character.skeleton, ["mask", "hair", "hat", "weapon"]);
  

    // code to determine what skins your spine object will be initialized with
    var weaponSkins = ["weapon-1", "weapon-2", null];
    var hatSkins = ["hat-1", "hat-2", null];
    var maskSkins = ["mask-1", "mask-2", null];
    var hairSkins = ["hair-1", "hair-2", null];
    
    var weaponSkin = weaponSkins.randomElement();
    var hatSkin = hatSkins.randomElement();
    var maskSkin = maskSkins.randomElement();
    var hairSkin = hairSkins.randomElement();
    
    var initialSkins = [];
   
    if(weaponSkin){
        initialSkins.push(weaponSkin);
    }
    if(hatSkin) {
        initialSkins.push(hatSkin);
    }
    if(maskSkin){
        initialSkins.push(maskSkin);
    }
    if(hairSkin){
        initialSkins.push(hairSkin)
    }
   
    // pass in the array of skins you want to combine and then it will add the skin to the skeleton
    dynamicCombinedSkin.addToSkeletonWithSkins(initialSkins);
    
    // change or remove skins 
    weaponSkin = weaponSkins.randomElement();
    hatSkin = hatSkins.randomElement();
    maskSkin = maskSkins.randomElement();
    hairSkin = hairSkins.randomElement();
       
    if(weaponSkin) {
       dynamicCombinedSkin.changeSkin(weaponSkin);
    } else {
       dynamicCombinedSkin.setSlotToDefault("weapon");
    }
    
    if(hatSkin) {
       dynamicCombinedSkin.changeSkin(hatSkin);
    } else {
       dynamicCombinedSkin.setSlotToDefault("hat");
    }
     
    if(maskSkin){
       dynamicCombinedSkin.changeSkin(maskSkin);
    } else {
       dynamicCombinedSkin.setSlotToDefault("mask");
    }
     
    if(hairSkin){
       dynamicCombinedSkin.changeSkin(hairSkin);
    } else {
       dynamicCombinedSkin.setSlotToDefault("hair");
    }
    
    // above functions also have a plural version with an array as the argument
    var skins = ["weapon-1", "hat-2", "mask-1", "hair-1"];
    dynamicCombinedSkin.changeSkins(skins);
    
    var slots = ["weapon", "hat", "mask", "hair"];
    dynamicCombinedSkin.setSlotsToDefault(slots);
    
    Array.prototype.randomElement = function () {
        return this[Math.floor(Math.random() * this.length)]
    }

```

There's still work to be done. Right now setting the slot to default will just set the attachment to null. So if you don't 
want the slot to become invisible.. you will need to use changeSkin() to manually set it to the default skin you want.
