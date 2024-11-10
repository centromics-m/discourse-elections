import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
//import SiteSettings from 'discourse/lib/site-settings';
import { service } from "@ember/service";

/*
    <PluginOutlet
      @name="topic-above-post-stream"
      @connectorTagName="div"
      @outletArgs={{hash
        model=this.model
        editFirstPost=(action "editFirstPost")
      }}
    />
*/

export default class ElectionBannerTopicComponent extends Component {
  //@service siteSettings;

  get model() {
    return this.args.outletArgs.model;
  }

  get editFirstPost() {
    return this.args.outletArgs.editFirstPost;
  }
}
