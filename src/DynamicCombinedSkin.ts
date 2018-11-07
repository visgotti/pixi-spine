
namespace pixi_spine {

    /** generates new skin based on array of slots that the skin will manage the attachments */
    export class DynamicCombinedSkin extends core.Skin {
        name: string;
        skeleton: core.Skeleton;
        slotNameMap: Map<string, core.Slot>;
        attachmentNameSlotMap = new Map <string, core.Slot>();

        constructor(skeleton: core.Skeleton, slotWithAttachments: Map<string, any>) {
            super("Dynamic");
            this.skeleton = skeleton;
            this.slotNameMap = new Map<string, core.Slot>();
            this.attachmentNameSlotMap = new Map <string, core.Slot>();

            // initialize slot data this skin will manage
            for (let i = 0; i < this.skeleton.slots.length; i++) {
                let slot = this.skeleton.slots[i];

                // if the combined sprite contains a skin for attachment
                if(slotWithAttachments.hasOwnProperty(slot.data.name)) {
                    this.slotNameMap[slot.data.name] = slot;
                    for(let j = 0; j < slotWithAttachments[slot.data.name].length; j++){
                        var attachmentName = slotWithAttachments[slot.data.name][j];
                        this.attachmentNameSlotMap[attachmentName] = slot;
                    }
                }
            }
            this.skeleton.data.skins.push(this);
        }

        addToSkeletonWithSkins(skinNames) {
            this.changeSkins(skinNames);
            this.skeleton.skin = this;
        }

        addToSkeleton(){
            this.skeleton.skin = this;
        }

        setAllSlotsToDefaultBesides(keepSlotNames) {
            this.slotNameMap.forEach((value, key, map) => {
                if(keepSlotNames.indexOf(key) < 0) {
                    this.setSlotToDefault(key);
                }
            })
        }

        setSlotsToDefault(slotNames) {
            for(var i = 0; i < slotNames.length; i++) {
                this.setSlotToDefault(slotNames[i]);
            }
        }

        setSlotToDefault(slotName) {
            let slot = this.slotNameMap[slotName];
            if(slot) {
                slot.setAttachment(null);
                delete this.attachments[slot.data.index];
            }
        }

        changeSkin(skinName) {
            let skin = this.skeleton.data.findSkin(skinName);

            if(!(skin)) {
                console.warn("tried changing skin to: " + skinName + " which didn't exist")
                return;
            }

            for(let i = 0; i < skin.attachments.length; i++) {
                let attachmentMap = skin.attachments[i];
                for(let attachment in attachmentMap) {
                    if(this.attachmentNameSlotMap[attachment]){
                        let slot = this.attachmentNameSlotMap[attachment];
                        this.addAttachment(slot.data.index, attachment, attachmentMap[attachment]);
                        if(slot.data.attachmentName) {
                            slot.setAttachment(attachmentMap[attachment]);
                        }
                    }
                }
            }
        }

        changeSkins(skinNames){
            for(var i = 0; i < skinNames.length; i++) {
                this.changeSkin(skinNames[i])
            }
        }
    }
}
