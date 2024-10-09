import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import SiteSettings from 'discourse/lib/site-settings';

export default class ElectionBannerDiscoveryComponent extends Component {
  @tracked electionListEnabled;

  constructor() {
    super(...arguments);
    this.electionListEnabled = SiteSettings.elections_status_banner_discovery;
  }
}

// export default {
//   setupComponent(attrs, component) {
//     component.set('electionListEnabled', Discourse.SiteSettings.elections_status_banner_discovery);
//   }
// };
