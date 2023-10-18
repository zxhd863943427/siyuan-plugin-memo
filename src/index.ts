import {
    Plugin,
    showMessage,
    Dialog,
    getFrontend,
    getBackend
} from "siyuan";
import "@/index.scss";

import SettingPannel from "@/libs/setting-panel.svelte";
import { appendBlock, deleteBlock, setBlockAttrs } from "./api";

const STORAGE_NAME = "menu-config";
const zeroWhite = "​"

let addFloatLayer
export default class PluginMemo extends Plugin {

    private isMobile: boolean;

    async onload() {
        this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

        console.log("loading plugin-sample", this.i18n);
        addFloatLayer = this.addFloatLayer

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        console.log(this.i18n.helloPlugin);
        this.eventBus.on("loaded-protyle",this.memoMain)
        this.eventBus.on("open-menu-blockref",this.deleteMemo)
    }

    onLayoutReady() {
        this.loadData(STORAGE_NAME);
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
        showMessage("Goodbye SiYuan Plugin");
        console.log("onunload");
    }

    /**
     * A custom setting pannel provided by svelte
     */
    openDIYSetting(): void {
        let dialog = new Dialog({
            title: "SettingPannel",
            content: `<div id="SettingPanel"></div>`,
            width: "600px",
            destroyCallback: (options) => {
                console.log("destroyCallback", options);
                //You'd better destroy the component when the dialog is closed
                pannel.$destroy();
            }
        });
        let pannel = new SettingPannel({
            target: dialog.element.querySelector("#SettingPanel"),
        });
    }


    private memoMain({ detail }: any) {
        let protyle:IProtyle = detail
        console.log(protyle)
        addMemoItem(protyle)
    }
    private deleteMemo({ detail }: any){
        // console.log(detail)
        if(detail.element && detail.element.style.cssText.indexOf("memo")!=-1){
           detail.menu.addItem({
            icon: "iconTrashcan",
            label: "删除 Memo",
            click: () => {
                deleteBlock(detail.element.getAttribute("data-id"));
                detail.element.outerHTML = detail.element.innerText
            }
        });
        }
    }
}

function addMemoItem(protyle:IProtyle){
    if (protyle.toolbar.element.querySelector(`[data-type="memo"]`)){
        return
    }
    const memoElement  = document.createElement("button");
    memoElement.setAttribute("class","protyle-toolbar__item b3-tooltips b3-tooltips__n")
    memoElement.setAttribute("data-type","memo")
    memoElement.setAttribute("aria-label","备注块")
    memoElement.innerHTML = `<svg viewBox="0 0 16 16" style="width: 14px; height: 14px; display: block; flex-shrink: 0; backface-visibility: hidden;"><path d="M4.32 15.424c.39 0 .677-.192 1.149-.609l2.344-2.064h4.116c2.057 0 3.213-1.19 3.213-3.22V4.22c0-2.03-1.156-3.22-3.213-3.22H3.213C1.163 1 0 2.19 0 4.22V9.53c0 2.037 1.196 3.22 3.165 3.22h.28v1.675c0 .608.322.998.875.998zm.342-1.531v-1.949c0-.403-.178-.56-.56-.56H3.26c-1.285 0-1.9-.65-1.9-1.894V4.26c0-1.243.615-1.893 1.9-1.893h8.627c1.278 0 1.893.65 1.893 1.894v5.23c0 1.243-.615 1.893-1.893 1.893h-4.15c-.417 0-.622.068-.909.369l-2.167 2.14z"></path></svg>`;
    (protyle.toolbar.element as HTMLElement).append(memoElement);
    memoElement.addEventListener("click",()=>{addMemoBlock(protyle)})
}

async function addMemoBlock(protyle:IProtyle){
    const DocumentId = protyle.block.id
    let pureContent = protyle.toolbar.range.toString()
    let back = await appendBlock("markdown",`{{{row
> ${pureContent}

${zeroWhite}

}}}`,DocumentId)
    let newBlockId = back[0].doOperations[0].id
    setBlockAttrs(newBlockId,{"custom-plugin-memo-date":getTime()})
    
    const {x,y} = protyle.toolbar.range.getClientRects()[0]
    protyle.toolbar.setInlineMark(protyle, "clear", "toolbar");
    protyle.toolbar.setInlineMark(protyle, "block-ref", "range", {
        type: "id",
        color:`${newBlockId+zeroWhite+"s"+zeroWhite+pureContent}`
    });
    let memoELement = protyle.element.querySelector(`[data-id="${newBlockId}"]`)
    memoELement.setAttribute("style","--memo: 1;color: var(--b3-theme-on-background);border-bottom: 2px solid var(--b3-card-info-color);")
    protyle.toolbar.element.classList.add("fn__none")
    saveViaTransaction(memoELement)
    addFloatLayer({
        ids: [newBlockId],
        defIds: [],
        x: x,
        y: y-70
    });
}

export function saveViaTransaction(protyleElem) {
    let protyle:HTMLElement
    if (protyleElem!=null){
        protyle = protyleElem
    }
    if (protyle === null)
        protyle = document.querySelector(".card__block.fn__flex-1.protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr")
    if (protyle === null)
        protyle = document.querySelector('.fn__flex-1.protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr') //需要获取到当前正在编辑的 protyle
    let e = document.createEvent('HTMLEvents')
    e.initEvent('input', true, false)
    protyle.dispatchEvent(e)
  }

function getTime() {
    const date = new Date();

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const formatted = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return formatted
}