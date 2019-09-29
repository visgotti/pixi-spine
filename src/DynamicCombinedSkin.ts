
namespace pixi_spine {

    /** generates new skin based on array of slots that the skin will manage the attachments */
    export class DynamicCombinedSkin extends core.Skin {
        name: string;
        skeleton: core.Skeleton;
        slotNameMap: Map<string, core.Slot>;

        constructor(skeleton: core.Skeleton, slotNames: Array<String>) {
            if(skeleton.skin.name === "Dynamic") {
                throw new Error("Skeleton can only contain one dynamic skin.")
            }

            super("Dynamic");
            this.skeleton = skeleton;
            this.slotNameMap = new Map<string, core.Slot>();

            // initialize slot data this skin will manage
            for (let i = 0; i < this.skeleton.slots.length; i++) {
                let slot = this.skeleton.slots[i];

                // if the combined sprite contains a skin for attachment
                if(slotNames.indexOf(slot.data.name) > -1) {
                    this.slotNameMap[slot.data.name] = slot;
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

        setSlotsToDefault(slotNames) {
            for(var i = 0; i < slotNames.length; i++) {
                this.setSlotsToDefault(slotNames[i]);
            }
        }

        setSlotToDefault(slotName) {
            if(this.slotNameMap[slotName]) {
                this.slotNameMap[slotName].attachment = null;
            }
        }

        changeSkin(skinName) {
            let skin = this.skeleton.data.findSkin(skinName);
            for(let i = 0; i < skin.attachments.length; i++) {
                let attachmentMap = skin.attachments[i];
                for(let slotName in attachmentMap) {
                    if(this.slotNameMap[slotName]){
                        let slot = this.slotNameMap[slotName];
                        this.setAttachment(slot.data.index, slotName, attachmentMap[slotName]);
                        slot.setAttachment(attachmentMap[slotName]);
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
