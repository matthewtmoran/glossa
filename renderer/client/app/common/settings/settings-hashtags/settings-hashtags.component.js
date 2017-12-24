import templateUrl from './settings-hashtags.html';
import { SettingsHashtagsComponent } from './settings-hashtags.controller';

export const settingsHashtagsComponent = {
  bindings: {
    hashtags: '<',
    settings: '<',
    allConnections: '<',
    onlineConnections: '<',
    currentUser: '<',
    onUpdateTag: '&',
    onRemoveTag: '&'
  },
  templateUrl,
  controller: SettingsHashtagsComponent
};