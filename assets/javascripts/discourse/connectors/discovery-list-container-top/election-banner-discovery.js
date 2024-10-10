import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
//import SiteSettings from 'discourse/lib/site-settings';
import { service } from "@ember/service";

export default class ElectionBannerDiscoveryComponent extends Component {
  @tracked electionListEnabled;
  @service siteSettings;

  constructor() {
    super(...arguments);
    this.electionListEnabled = this.siteSettings.elections_status_banner_discovery;
  }
}

// export default {
//   setupComponent(attrs, component) {
//     component.set('electionListEnabled', Discourse.SiteSettings.elections_status_banner_discovery);
//   }
// };
