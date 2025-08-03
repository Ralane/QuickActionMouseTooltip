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

    /**
     * Plugin setting to enable/disable inventory tooltips.
     */
    constructor() {
        super();

        this.settings.hideWalkHere = {
            text: 'Hide Walk Here',
            type: SettingsTypes.checkbox,
            value: true,
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

        if(this.settings.hideWalkHere.value && this.quickActionText.children[0].textContent === 'Walk Here') {
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
