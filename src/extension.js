/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { DotspaceContainer } from './dotspaces.js';
import { DotspaceSettings } from './settings.js';

export default class DotspacesExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._dotspaceSettings = new DotspaceSettings(this._settings);
        this._currentBox = null;
        this._settingsSignalIds = [];

        // Handle visibility of activities
        this._settingsSignalIds.push(
            this._dotspaceSettings.onChangedKeepActivities(this._updateDotspaces.bind(this)),
            this._dotspaceSettings.onChangedPanelScroll(this._updateDotspaces.bind(this)),
            this._dotspaceSettings.onChangedPanelPosition(this._updateDotspaces.bind(this)),
            this._dotspaceSettings.onChangedPositionIndex(this._updateDotspaces.bind(this)),
        );

        // Modify panel
        this._updateDotspaces();
    }

    disable() {
        // Disconnect settings signals
        for (const id of this._settingsSignalIds)
            this._dotspaceSettings.disconnect(id);
        this._settingsSignalIds = [];

        if (this._dotspaces) {
            if (this._currentBox)
                this._currentBox.remove_child(this._dotspaces);
            this._dotspaces.destroy();
            this._dotspaces = null;
        }
        this._currentBox = null;
        ToggleActivities(true);
        this._dotspaceSettings = null;
        this._settings = null;
    }

    _getPanelBox(position) {
        switch (position) {
            case 'center': return Main.panel._centerBox;
            case 'right': return Main.panel._rightBox;
            default: return Main.panel._leftBox;
        }
    }

    _updateDotspaces() {
        if (this._dotspaces) {
            if (this._currentBox)
                this._currentBox.remove_child(this._dotspaces);
            this._dotspaces.destroy();
        }

        this._dotspaces = new DotspaceContainer(this.path, this._settings);

        const position = this._dotspaceSettings.panelPosition;
        let index = this._dotspaceSettings.positionIndex;
        const box = this._getPanelBox(position);
        this._currentBox = box;

        if (this._dotspaceSettings.keepActivities) {
            ToggleActivities(true);
            // Offset index when in the left box so dots appear after Activities
            if (position === 'left')
                index = Math.max(index, 1);
        } else {
            ToggleActivities(false);
        }

        // Clamp index to valid range
        const childCount = box.get_n_children();
        index = Math.min(index, childCount);

        box.insert_child_at_index(this._dotspaces, index);
    }
}

/**
 * Toggle the display of the activities button.
 *
 * @param {Boolean} display
 */
function ToggleActivities(display) {
    const activities_button = Main.panel.statusArea['activities'];
    if (activities_button) {
        if (display && !Main.sessionMode.isLocked) activities_button.container.show();
        else activities_button.container.hide();
    }
}
