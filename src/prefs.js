import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { DotspaceSettings } from './settings.js';

export default class DotspacesPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const dotspaceSettings = this.getSettings();
        const builder = new Gtk.Builder();

        // Add the ui file
        builder.add_from_file(`${this.path}/ui/main.xml`);

        // Add the general settings
        window.add(builder.get_object('general'));

        // Bind settings to switches
        const positionValues = ['left', 'center', 'right'];

        DotspaceSettings.getKeys().forEach(key => {
            const widget = builder.get_object(key.replaceAll('-', '_'));
            switch (key) {
                case DotspaceSettings.WS_INDICATOR_PADDING:
                    widget.set_value(dotspaceSettings.get_int(key));
                    widget.connect('value-changed', (w) => {
                        dotspaceSettings.set_int(key, w.get_value());
                    });
                    break;
                case DotspaceSettings.POSITION_INDEX:
                    widget.set_value(dotspaceSettings.get_int(key));
                    widget.connect('value-changed', (w) => {
                        dotspaceSettings.set_int(key, w.get_value());
                    });
                    break;
                case DotspaceSettings.DOT_SIZE:
                    widget.set_value(dotspaceSettings.get_int(key));
                    widget.connect('value-changed', (w) => {
                        dotspaceSettings.set_int(key, w.get_value());
                    });
                    break;
                case DotspaceSettings.ACTIVE_COLOR:
                    widget.set_text(dotspaceSettings.get_string(key));
                    widget.connect('changed', (w) => {
                        dotspaceSettings.set_string(key, w.get_text());
                    });
                    break;
                case DotspaceSettings.PANEL_POSITION:
                    widget.set_selected(positionValues.indexOf(dotspaceSettings.get_string(key)));
                    widget.connect('notify::selected', (w) => {
                        dotspaceSettings.set_string(key, positionValues[w.selected]);
                    });
                    break;
                default:
                    dotspaceSettings.bind(key, widget, 'active', Gio.SettingsBindFlags.DEFAULT);
                    break;
            }
        });
    }
}
