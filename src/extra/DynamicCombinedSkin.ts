import Skin = pixi_spine.core.Skin;
import Attachment = pixi_spine.core.Attachment;
import Skeleton = pixi_spine.core.Skeleton;
import Slot = pixi_spine.core.Slot;


namespace pixi_spine.extra {
    name: string;
    skeleton: Skeleton;
    slotNameMap: new Map<Slot>();

    /** generates new skin based on array of slots that the skin will manage the attachments */
    export class DynamicCombinedSkin extends Skin {
        constructor(skeleton: Skeleton, slotNames: Array<String>) {
            super("Dynamic");
            this.skeleton = skeleton;
            this.initializeAttachmentMap(slotNames)
        }

        initializeSlotData(slotNames){
            for (let i = 0; i < this.skeleton.data.slots.length; i++) {
                let slot = this.skeleton.data.slots[i];

                // if the combined sprite contains a skin for attachment
                if(slotNames.indexOf(slot.name) > -1) {
                    this.slotNameMap[slot.name] = slot;
                } else {
                    throw new Error("The slot name", slot.name, "does not exist on current skeleton")
                }
            }
            this.skeleton.data.skins.push(this);
        }

        setSlotsToDefault(slotNames) {
            for(var i = 0; i < slotNames.length; i++) {
                this.setSlotsToDefault(slotNames[i]);
            }
        }

        setSlotToDefault(slotName) {
            if(this.slotNameMap[slotName]) {
                this.slotNameMap[slot].setToSetupPose();
            }
        }

        addSkin(skinName) {
            let skin = this.skeleton.data.findSkin(skinName);
            for(let i = 0; i < skin.attachments.length; i++) {
                let attachment = skin.attachments[i];
                for(let slotName in attachment) {
                    if(this.slotMap[slotName]){
                        let slot = this.slotMap[slotName];
                        this.addAttachment(slot.data.index, slotName, attachment[slotName]);
                        slot.setAttachment(attachment);
                    }
                }
            }
        }

        addSkins(skinNames){
            for(var i = 0; i < skinNames.length; i++) {
                this.addSkin(skinNames[i])
            }
        }
    }
}
