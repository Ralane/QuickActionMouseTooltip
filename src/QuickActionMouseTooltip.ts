import {Plugin, SettingsTypes, UIManager, UIManagerScope} from "@highlite/plugin-api";
import TooltipCss from "../resources/css/base.css";

export default class QuickActionMouseTooltip extends Plugin {
     pluginName = 'Quick Action Mouse Tooltip';
    author = '0rangeYouGlad';
    private uiManager = new UIManager();
    tooltipUI: HTMLElement | null = null;
    tooltip: HTMLElement | null = null;
    tooltipStyle: HTMLStyleElement | null = null;

    /**
     * Handler for mousemove events to update tooltip position to follow the mouse.
     */
    private mouseMoveHandler: ((event: MouseEvent) => void) | null = null;

    private lastMousePos = [0, 0];
    private quickActionText: HTMLElement | null = null;
    private lastQuickActionText = "";

    /**
     * Plugin setting to enable/disable inventory tooltips.
     */
    constructor() {
        super();

        this.settings.hideWalkHere = {
            text: 'Hide on Walk Here',
            type: SettingsTypes.checkbox,
            value: true,
            callback: () => {},
        } as any;

        this.settings.hideInventory = {
            text: 'Hide on Inventory',
            type: SettingsTypes.checkbox,
            value: true,
            callback: () => {},
        } as any;

        
        this.settings.hideInventoryUseWith = {
            text: 'Hide on Use With',
            type: SettingsTypes.checkbox,
            value: false,
            callback: () => {},
        } as any;

        this.settings.hideBank = {
            text: 'Hide on Bank',
            type: SettingsTypes.checkbox,
            value: true,
            callback: () => {},
        } as any;

        this.settings.hideShops = {
            text: 'Hide on Shops',
            type: SettingsTypes.checkbox,
            value: true,
            callback: () => {},
        } as any;

        this.settings.hideCreate = {
            text: 'Hide on Creation UI',
            type: SettingsTypes.checkbox,
            value: true,
            callback: () => {},
        } as any;

        this.settings.hideTrades = {
            text: 'Hide on Trades',
            type: SettingsTypes.checkbox,
            value: true,
            callback: () => {},
        } as any;

        this.settings.hideSpells = {
            text: 'Hide on Spellbook',
            type: SettingsTypes.checkbox,
            value: true,
            callback: () => {},
        } as any;

        this.settings.hideUi = {
            text: 'Hide on Misc UI',
            type: SettingsTypes.checkbox,
            value: true,
            callback: () => {},
        } as any;
    }

    /**
     * Initializes the plugin (called once on load).
     */
    init(): void {
        this.log('QuickActionMouseTooltip initialised');
    }

    updateTooltipText = () => {
        if(!this.quickActionText?.textContent) {
            this.removeTooltip();
            return; 
        }

        let qaText = this.quickActionText.children[0].textContent;
        
        if(qaText === this.lastQuickActionText) {
            return;
        }
        
        this.lastQuickActionText = qaText || "";


        if(this.settings.hideWalkHere.value && qaText === 'Walk Here') {
            this.removeTooltip();
            return; 
        }

        if(this.settings.hideSpells.value && (
            qaText?.startsWith('Cast') ||
            qaText?.startsWith('Auto Cast') ||
            qaText?.startsWith('Stop Auto Casting')
        )) {
            this.removeTooltip();
            return; 
        }

        if(this.settings.hideTrades.value && (
            qaText?.startsWith('Offer') ||
            qaText?.startsWith('Revoke')
        )) {
            this.removeTooltip();
            return; 
        }

        if(this.settings.hideInventory.value && (
            (qaText?.startsWith("Use") && !qaText?.includes(" with")) ||
            qaText?.startsWith("Equip") ||
            qaText?.startsWith("Unequip") ||
            qaText?.startsWith("Eat") ||
            qaText?.startsWith("Drink") ||
            qaText?.startsWith("Dig")
        )) {
            this.removeTooltip();
            return; 
        }

        if(this.settings.hideInventoryUseWith.value && (
            (qaText?.startsWith("Use") && qaText?.includes(" with"))
        )) {
            this.removeTooltip();
            return; 
        }

        if(this.settings.hideBank.value && (
            qaText?.startsWith("Withdraw") ||
            qaText?.startsWith("Deposit")
        )) {
            this.removeTooltip();
            return; 
        }

        if(this.settings.hideCreate.value && (
            qaText?.startsWith("Create")
        )) {
            this.removeTooltip();
            return; 
        }

        if(this.settings.hideShops.value && (
            qaText?.startsWith("Buy") ||
            qaText?.startsWith("Check Price") ||
            qaText?.startsWith("Sell")
        )) {
            this.removeTooltip();
            return; 
        }

        if(this.settings.hideUi.value && (
            (qaText?.startsWith("Open") && qaText?.includes("Guide")) ||
            qaText?.startsWith("Toggle") ||
            qaText?.startsWith("Message") ||
            qaText?.startsWith("Remove") ||
            qaText?.startsWith("Show Blocked Users") ||
            qaText?.startsWith("Show Friends List") ||
            qaText?.startsWith("Unblock") ||
            qaText?.includes("is blocked") ||
            qaText?.includes("Logout") ||
            qaText?.includes("Add a Friend") ||
            qaText?.includes("Block a User") ||
            qaText?.includes("Current Time") ||
            qaText?.includes("Current Hitpoints") ||
            qaText?.includes("Current Magic Level") ||
            qaText?.includes("Current Range Level") ||
            (qaText?.startsWith("Current") && qaText?.includes("Bonus")) ||
            qaText?.includes("Reset Camera") ||
            qaText?.includes("players currently on") ||
            qaText?.startsWith("Chat Settings")
        )) {
            this.removeTooltip();
            return; 
        }

        this.showTooltip(this.quickActionText);
    }

    /**
     * Starts the plugin, adds styles and event listeners.
     */
    start() {
        this.log('QuickActionMouseTooltip started');

        // Mouse move handler to follow the mouse
        this.mouseMoveHandler = (moveEvent: MouseEvent) => {            
            this.updateTooltipPosition(moveEvent);
            this.updateTooltipText();
        };

        document.addEventListener('mousemove', this.mouseMoveHandler);
    }

    addPluginStyle() {
        // Create Scoped CSS
        let styleTag : HTMLStyleElement = document.createElement("style");
        styleTag.innerText = `${TooltipCss}`;
        this.tooltipUI?.appendChild(styleTag);
    }

    /**
     * Stops the plugin, removes event listeners and tooltip.
     */
    stop() {
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
        this.removeTooltip();
        this.quickActionText = null;
    }

    // Need to update on game loop as well in case entities wander into our mouse without the mouse moving
    GameLoop_update(): void {
        if(!this.quickActionText) {
            this.quickActionText = document.querySelector('#hs-quick-action-text') as HTMLElement
        }

        this.updateTooltipText();
    };

    /**
     * Creates and displays the tooltip for the quickActionText.
     * Tooltip follows the mouse and adapts position to stay on screen.
     * @param event MouseEvent
     * @param itemDef Item definition object
     */
    showTooltip(itemDef: HTMLElement) {
        this.removeTooltip();

        this.tooltipUI = this.uiManager.createElement(
            UIManagerScope.ClientInternal
        );
        this.addPluginStyle();

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'hlt-tooltip';
        this.tooltip.style.left = `${this.lastMousePos[0] + 10}px`;
        this.tooltip.style.top = `${this.lastMousePos[1] + 10}px`;
        this.tooltip.innerHTML = `
        <strong class="hlt-tooltip-title">${itemDef.children[0].innerHTML} ${itemDef.children[1].innerHTML}</strong>`;
        //document.body.appendChild(tooltip);
        this.tooltipUI?.appendChild(this.tooltip);
    }

    /**
     * Removes the tooltip and mousemove event listener.
     */
    removeTooltip() {
        if (this.tooltipUI) {
            this.tooltipUI.remove();
            this.tooltipUI = null;
        }
    }

    /**
     * Updates the tooltip position to follow the mouse and stay within the viewport.
     * @param event MouseEvent
     */
    private updateTooltipPosition(event: MouseEvent) {
        this.lastMousePos = [event.clientX, event.clientY];
        if (this.tooltip) {
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const padding = 5;
            let left = event.clientX + padding;
            let top = event.clientY + padding;

            // Get viewport dimensions
            const viewportWidth = window.innerWidth - 24;
            const viewportHeight = window.innerHeight - 20;

            // If tooltip would go off right edge, show to the left
            if (left + tooltipRect.width > viewportWidth) {
                left = event.clientX - tooltipRect.width - padding;
            }

            // If tooltip would go off bottom edge, show above
            if (top + tooltipRect.height > viewportHeight) {
                top = event.clientY - tooltipRect.height - padding;
            }

            // Prevent negative positions
            left = Math.max(left, padding);
            top = Math.max(top, padding);
            this.tooltip.style.left = `${left}px`;
            this.tooltip.style.top = `${top}px`;
        }
    }
}
