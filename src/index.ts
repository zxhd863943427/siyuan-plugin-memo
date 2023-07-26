import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    IModel,
    Setting,
    fetchPost,
    Protyle,
    IProtyleOption
} from "siyuan";
import "@/index.scss";

import HelloExample from "@/hello.svelte";
import SettingPannel from "@/libs/setting-panel.svelte";
import { appendBlock, setBlockAttrs } from "./api";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";
const zeroWhite = "​"

let addFloatLayer
export default class PluginMemo extends Plugin {

    private customTab: () => IModel;
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

    private eventBusLog({ detail }: any) {
        console.log(detail);
    }

    private memoMain({ detail }: any) {
        let protyle:IProtyle = detail
        window.protyle = protyle
        console.log(protyle)
        addMemoItem(protyle)
    }
}

function addMemoItem(protyle:IProtyle){
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
    let back = await appendBlock("markdown",">",DocumentId)
    let newBlockId = back[0].doOperations[0].id
    let pureContent = protyle.toolbar.range.toString()
    const {x,y} = protyle.toolbar.range.getClientRects()[0]
    protyle.toolbar.setInlineMark(protyle, "block-ref", "range", {
        type: "id",
        color:`${newBlockId+zeroWhite+"s"+zeroWhite+pureContent}`
    });
    let memoELement = protyle.element.querySelector(`[data-id="${newBlockId}"]`)
    memoELement.setAttribute("style","--memo: 1;color: var(--b3-theme-on-background);border-bottom: 2px solid var(--b3-card-info-color);")
    protyle.toolbar.element.classList.add("fn__none")
    saveViaTransaction()
    addFloatLayer({
        ids: [newBlockId],
        defIds: [],
        x: x,
        y: y-70
    });
}

export function saveViaTransaction() {
    let protyle = document.querySelector(".card__block.fn__flex-1.protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr")
    if (protyle === null)
        protyle = document.querySelector('.fn__flex-1.protyle:not(.fn__none) .protyle-wysiwyg.protyle-wysiwyg--attr') //需要获取到当前正在编辑的 protyle
    let e = document.createEvent('HTMLEvents')
    e.initEvent('input', true, false)
    protyle.dispatchEvent(e)
  }