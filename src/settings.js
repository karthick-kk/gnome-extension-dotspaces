import Gio from 'gi://Gio';

export class Settings {
    constructor(schema) {
        this._schema = schema;
    }

    get schema() {
        return this._schema;
    }

    onChanged(key, func) {
        return this._schema.connect(`changed::${key}`, func);
    }

    disconnect(id) {
        this._schema.disconnect(id);
    }

    getBoolean(key) {
        return this._schema.get_boolean(key);
    }

    setBoolean(key, value) {
        this._schema.set_boolean(key, value);
    }

    getInt(key) {
        return this._schema.get_int(key);
    }

    setInt(key, value) {
        this._schema.set_int(key, value);
    }

    getString(key) {
        return this._schema.get_string(key);
    }

    setString(key, value) {
        this._schema.set_string(key, value);
    }
}

/**
 * Handles settings for this extension.
 */
export class DotspaceSettings extends Settings {
    static IGNORE_INACTIVE_OCCUPIED_WORKSPACES = "ignore-inactive-occupied-workspaces";
    static KEEP_ACTIVITIES = "keep-activities";
    static PANEL_SCROLL = "panel-scroll";
    static WRAP_WORKSPACES = "wrap-workspaces";
    static HIDE_DOTS_ON_SINGLE = "hide-dots-on-single";
    static WS_INDICATOR_PADDING = "ws-indicator-padding";
    static PANEL_POSITION = "panel-position";
    static POSITION_INDEX = "position-index";
    static DOT_SIZE = "dot-size";
    static ACTIVE_COLOR = "active-color";

    static getKeys() {
        return [
            this.IGNORE_INACTIVE_OCCUPIED_WORKSPACES,
            this.KEEP_ACTIVITIES,
            this.PANEL_SCROLL,
            this.WRAP_WORKSPACES,
            this.HIDE_DOTS_ON_SINGLE,
            this.WS_INDICATOR_PADDING,
            this.PANEL_POSITION,
            this.POSITION_INDEX,
            this.DOT_SIZE,
            this.ACTIVE_COLOR,
        ];
    }

    constructor(schema) {
        super(schema);
    }

    get ignoreInactiveOccupiedWorkspaces() {
        return this.getBoolean(DotspaceSettings.IGNORE_INACTIVE_OCCUPIED_WORKSPACES);
    }

    get keepActivities() {
        return this.getBoolean(DotspaceSettings.KEEP_ACTIVITIES);
    }

    get panelScroll() {
        return this.getBoolean(DotspaceSettings.PANEL_SCROLL);
    }

    get wrapWorkspaces() {
        return this.getBoolean(DotspaceSettings.WRAP_WORKSPACES);
    }

    get hideDotsOnSingle() {
        return this.getBoolean(DotspaceSettings.HIDE_DOTS_ON_SINGLE);
    }

    get wsIndicatorPadding() {
        return this.getInt(DotspaceSettings.WS_INDICATOR_PADDING);
    }

    onChangedIgnoreInactiveOccupiedWorkspaces(func) {
        return this.onChanged(DotspaceSettings.IGNORE_INACTIVE_OCCUPIED_WORKSPACES, func);
    }

    onChangedKeepActivities(func) {
        return this.onChanged(DotspaceSettings.KEEP_ACTIVITIES, func);
    }

    onChangedPanelScroll(func) {
        return this.onChanged(DotspaceSettings.PANEL_SCROLL, func);
    }

    onChangedHideDotsOnSingle(func) {
        return this.onChanged(DotspaceSettings.HIDE_DOTS_ON_SINGLE, func);
    }

    onChangedWsIndicatorPadding(func) {
        return this.onChanged(DotspaceSettings.WS_INDICATOR_PADDING, func);
    }

    get panelPosition() {
        return this.getString(DotspaceSettings.PANEL_POSITION);
    }

    get positionIndex() {
        return this.getInt(DotspaceSettings.POSITION_INDEX);
    }

    onChangedPanelPosition(func) {
        return this.onChanged(DotspaceSettings.PANEL_POSITION, func);
    }

    onChangedPositionIndex(func) {
        return this.onChanged(DotspaceSettings.POSITION_INDEX, func);
    }

    get dotSize() {
        return this.getInt(DotspaceSettings.DOT_SIZE);
    }

    get activeColor() {
        return this.getString(DotspaceSettings.ACTIVE_COLOR);
    }

    onChangedDotSize(func) {
        return this.onChanged(DotspaceSettings.DOT_SIZE, func);
    }

    onChangedActiveColor(func) {
        return this.onChanged(DotspaceSettings.ACTIVE_COLOR, func);
    }
}

/**
 * Handles settings for Mutter.
 */
export class MutterSettings extends Settings {
    static DYNAMIC_WORKSPACES = "dynamic-workspaces";

    constructor() {
        super(new Gio.Settings({ schema: 'org.gnome.mutter' }));
    }

    get dynamicWorkspaces() {
        return this.getBoolean(MutterSettings.DYNAMIC_WORKSPACES);
    }

    onChangedDynamicWorkspaces(func) {
        return this.onChanged(MutterSettings.DYNAMIC_WORKSPACES, func);
    }
}
