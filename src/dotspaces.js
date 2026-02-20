import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { DotspaceSettings, MutterSettings } from './settings.js';

class DotIndicator extends St.Bin {
    static {
        GObject.registerClass(this);
    }

    _init(index, extensionPath, dotspaceSettings, mutterSettings) {
        super._init({
            visible: true,
            reactive: true,
            can_focus: false,
            track_hover: true
        });
        this._index = index;
        this._extensionPath = extensionPath;

        // Set the settings
        this._dotspaceSettings = dotspaceSettings;
        this._mutterSettings = mutterSettings;

        // Get the workspace to watch
        this._workspace = global.workspace_manager.get_workspace_by_index(index);

        // Set the icon
        this._icon = null;

        // State tracking for animation
        this._initialized = false;
        this._wasActive = this._workspace.active;
        this._pendingTimeoutId = null;

        // Cache icons
        this._iconCache = {
            'active': Gio.Icon.new_for_string(`${this._extensionPath}/icons/active-symbolic.svg`),
            'inactive-occupied': Gio.Icon.new_for_string(`${this._extensionPath}/icons/inactive-occupied-symbolic.svg`),
            'inactive-unoccupied': Gio.Icon.new_for_string(`${this._extensionPath}/icons/inactive-unoccupied-symbolic.svg`),
            'dynamic': Gio.Icon.new_for_string(`${this._extensionPath}/icons/dynamic-symbolic.svg`),
        };

        // Add styles
        this.add_style_class_name("panel-button");
        this.add_style_class_name("dotspaces-indicator");
        this.set_style(`padding-left: ${this._dotspaceSettings.wsIndicatorPadding}px;`
            + `padding-right: ${this._dotspaceSettings.wsIndicatorPadding}px;`);

        // Signals
        this.connect('destroy', () => {
            if (this._notifyActiveSignal) this._workspace.disconnect(this._notifyActiveSignal);
            if (this._notifyNWindowsSignal) this._workspace.disconnect(this._notifyNWindowsSignal);
            if (this._pendingTimeoutId) {
                GLib.source_remove(this._pendingTimeoutId);
                this._pendingTimeoutId = null;
            }
        });
        this._notifyNWindowsSignal = this._workspace.connect_after('notify::n-windows', () => {
            if (this._pendingTimeoutId)
                GLib.source_remove(this._pendingTimeoutId);
            this._pendingTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1, () => {
                this._pendingTimeoutId = null;
                this.update();
                return GLib.SOURCE_REMOVE;
            });
        });
        this._notifyActiveSignal = this._workspace.connect_after('notify::active', this.update.bind(this));

        // Update icons
        this.update();
        this._initialized = true;
    }

    _animateIconSwap(gicon, giconSize) {
        this._icon.ease({
            opacity: 0,
            duration: 150,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                this._icon.set_gicon(gicon);
                this._icon.icon_size = giconSize;
                this._icon.ease({
                    opacity: 255,
                    duration: 150,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            },
        });
    }

    update() {
        if (this._buttonSignal) this.disconnect(this._buttonSignal);

        // Check if this workspace is occupied
        const invalidWindowCount = this._workspace.list_windows().filter(w => w.is_on_all_workspaces() || w.is_skip_taskbar()).length;
        const isOccupied = !this._dotspaceSettings.ignoreInactiveOccupiedWorkspaces && this._workspace.n_windows - invalidWindowCount > 0;

        // Add style classes
        if (isOccupied) this.add_style_class_name("occupied");
        else this.remove_style_class_name("occupied");

        // Default gicon settings
        let giconName = "inactive-unoccupied";
        const dotSize = this._dotspaceSettings.dotSize;
        let giconSize = dotSize;

        // Handle active workspace
        if (this._workspace.active) {
            giconName = "active";
            this.add_style_pseudo_class("active");
            this._buttonSignal = this.connect('button-release-event', () => {
                if (Main.overview.visible) Main.overview.hide();
                else Main.overview.show();
            });
        } else {
            if (isOccupied) giconName = "inactive-occupied";
            this.remove_style_pseudo_class("active");
            this._buttonSignal = this.connect('button-release-event', () => this._workspace.activate(global.get_current_time()));
        }

        // Handle dynamic (last if dynamic) workspace
        if (this._mutterSettings.dynamicWorkspaces && this._index === global.workspace_manager.get_n_workspaces() - 1) {
            this.add_style_class_name("dynamic");
            giconName = "dynamic";
            giconSize = Math.round(dotSize * 0.85);
        } else this.remove_style_class_name("dynamic");

        // Detect active state change for animation
        const isActive = this._workspace.active;
        const activeStateChanged = this._wasActive !== isActive;
        this._wasActive = isActive;

        // Create or set the icon
        const gicon = this._iconCache[giconName];
        const activeColor = this._dotspaceSettings.activeColor;
        if (this._icon == null) {
            this._icon = new St.Icon({ gicon: gicon, icon_size: giconSize });
            if (isActive && activeColor)
                this._icon.set_style(`color: ${activeColor};`);
            this.set_child(this._icon);
        } else if (this._initialized && activeStateChanged) {
            this._animateIconSwap(gicon, giconSize);
            if (isActive && activeColor)
                this._icon.set_style(`color: ${activeColor};`);
            else
                this._icon.set_style(null);
        } else {
            this._icon.set_gicon(gicon);
            if (isActive && activeColor)
                this._icon.set_style(`color: ${activeColor};`);
            else
                this._icon.set_style(null);
        }
    }
}

export class DotspaceContainer extends St.BoxLayout {
    static {
        GObject.registerClass(this);
    }

    _init(extensionPath, settings) {
        super._init({
            track_hover: true,
            reactive: true
        });

        this._extensionPath = extensionPath;
        this._dots = [];

        // Get settings
        this._dotspaceSettings = new DotspaceSettings(settings);
        this._mutterSettings = new MutterSettings();

        // Create the box to hold the dots
        this.add_style_class_name("panel-button");
        this.add_style_class_name("dotspaces-container");

        // Handle scroll event
        const scrollEventSource = this._dotspaceSettings.panelScroll ? Main.panel : this;
        this._scrollEventId = scrollEventSource.connect("scroll-event", this._OnScroll.bind(this));

        // Handle setting events
        this._settingsSignalIds = [
            this._dotspaceSettings.onChangedIgnoreInactiveOccupiedWorkspaces(this._RebuildDots.bind(this)),
            this._dotspaceSettings.onChangedHideDotsOnSingle(this._RebuildDots.bind(this)),
            this._dotspaceSettings.onChangedWsIndicatorPadding(this._RebuildDots.bind(this)),
            this._dotspaceSettings.onChangedDotSize(this._RebuildDots.bind(this)),
            this._dotspaceSettings.onChangedActiveColor(this._RebuildDots.bind(this)),
        ];
        this._mutterSignalIds = [
            this._mutterSettings.onChangedDynamicWorkspaces(this._RebuildDots.bind(this)),
        ];

        // Handle workspace events
        this._notifyNWorkspacesId = global.workspace_manager.connect_after("notify::n-workspaces", this._RebuildDots.bind(this));

        // Handle destroy event
        this.connect("destroy", () => {
            for (const id of this._settingsSignalIds)
                this._dotspaceSettings.disconnect(id);
            for (const id of this._mutterSignalIds)
                this._mutterSettings.disconnect(id);
            if (this._notifyNWorkspacesId) global.workspace_manager.disconnect(this._notifyNWorkspacesId);
            if (this._scrollEventId) scrollEventSource.disconnect(this._scrollEventId);
        });

        // Rebuild dots
        this._RebuildDots();
    }

    /**
     * Handle the scroll event.
     *
     * @param {*} _
     * @param {Clutter.Event} event
     */
    _OnScroll(_, event) {
        // Increment or decrement the index
        let index = global.workspace_manager.get_active_workspace_index();
        switch (event.get_scroll_direction()) {
            case Clutter.ScrollDirection.UP: index--; break;
            case Clutter.ScrollDirection.DOWN: index++; break;
        }

        // Modulo division to wrap the workspace index
        const workspaceCount = global.workspace_manager.get_n_workspaces();
        if (this._dotspaceSettings.wrapWorkspaces) {
            index %= workspaceCount;
            if (index < 0) index += workspaceCount;
        } else index = Math.min(Math.max(index, 0), workspaceCount);

        // Change the workspace
        if (index >= 0 && index < workspaceCount) global.workspace_manager.get_workspace_by_index(index).activate(global.get_current_time());
    }

    /*
     * Rebuild the dot indicators.
     */
    _RebuildDots() {
        // Destroy all dots
        this.destroy_all_children();
        this._dots = []

        // Get settings
        const dynamicWorkspacesEnabled = this._mutterSettings.dynamicWorkspaces;

        // Update workspace information
        const workspaceCount = global.workspace_manager.get_n_workspaces();

        // Create dots
        for (let i = 0; i < workspaceCount; i++) {
            const dot = new DotIndicator(i, this._extensionPath, this._dotspaceSettings, this._mutterSettings);
            this.add_child(dot);
            this._dots.push(dot);
        }

        // Toggle visibility
        this.visible = !this._dotspaceSettings.hideDotsOnSingle || (!dynamicWorkspacesEnabled && workspaceCount > 1) || (dynamicWorkspacesEnabled && workspaceCount > 2);
    }
}
