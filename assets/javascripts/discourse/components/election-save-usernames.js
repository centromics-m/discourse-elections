import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { next } from "@ember/runloop";
import { ajax } from "discourse/lib/ajax";
import ElectionSave from "./election-save";

export default class ElectionSaveUsernamesComponent extends ElectionSave {
  @tracked usernamesString = "";
  @tracked showSelector = false;
  layoutName = "components/election-save";

  @action
  save() {
    const data = this.prepareData();
    if (!data) {
      return;
    }

    const handleFail = () => {
      const existing = this.topic.election_nominations_usernames;
      this.usernamesString = existing.join(",");

      // this is hack to get around stack overflow issues with user-selector's canReceiveUpdates property
      this.showSelector = false;

      //Ember.run.scheduleOnce('afterRender', () => this.showSelector = true);
      next(this, () => {
        this.showSelector = true;
      });
    };

    ajax("/election/nomination/set-by-username", { type: "POST", data })
      .then((result) => {
        this.resolve(result, "usernames");

        if (result.failed) {
          handleFail();
        } else {
          this.topic.election_nominations = result.user_ids;
          this.topic.election_nominations_usernames = result.usernames;
          this.topic.election_is_nominee =
            result.user_ids.indexOf(this.currentUser.id) > -1;
        }
      })
      .catch((e) => {
        if (e.jqXHR && e.jqXHR.responseText) {
          this.resolveStandardError(e.jqXHR.responseText, "usernames");
          handleFail();

          alert(e.jqXHR.responseText);
        }
      })
      .finally(() => this.resolve({}, "usernames"));
  }
}
