import Component from '@ember/component';
import EmberObject, { action } from "@ember/object";
import { gt, or } from "@ember/object/computed";
import { service } from "@ember/service";
import { observes } from "@ember-decorators/object";
import discourseComputed from "discourse-common/utils/decorators";
import I18n from "discourse-i18n";
import { tracked } from '@glimmer/tracking';
import { computed } from '@ember/object';
import DiscourseURL from 'discourse/lib/url';
import { ajax } from 'discourse/lib/ajax';

import DButton from "discourse/components/d-button";

export default class CreateElectionModal extends Component {
  @service siteSettings;
  @tracked statusBannerResultHours = this.siteSettings.elections_status_banner_default_result_hours;
  @tracked statusBanner = true;
  @tracked pollOpenAfter = true;
  @tracked pollOpenAfterHours = 48;
  @tracked pollOpenAfterNominations = 2;
  @tracked pollCloseAfter = true;
  @tracked pollCloseAfterHours = 48;
  @tracked pollCloseAfterVoters = 10;
  @tracked loading = false;

  @computed('position', 'pollTimesValid')
  get disabled() {
    const position = this.position;
    const pollTimesValid = this.pollTimesValid;
    return !position || position.length < 3 || !pollTimesValid;
  }

  @computed('pollOpenTime', 'pollCloseTime')
  get pollTimesValid() {
    const { pollOpenTime, pollCloseTime } = this;
    if (pollOpenTime && moment().isAfter(pollOpenTime)) return false;
    if (pollCloseTime && moment().isAfter(pollCloseTime)) return false;
    if (pollOpenTime && pollCloseTime && moment(pollCloseTime).isBefore(pollOpenTime)) return false;
    return true;
  }

  // actions = {
  @action
  async createElection() {
    let data = {
      category_id: this.model.categoryId,
      position: this.position,
      nomination_message: this.nominationMessage,
      poll_message: this.pollMessage,
      closed_poll_message: this.closedPollMessage,
      self_nomination_allowed: this.selfNominationAllowed,
      status_banner: this.statusBanner,
      status_banner_result_hours: this.statusBannerResultHours,
    };

    const pollOpen = this.pollOpen;
    data['poll_open'] = pollOpen;
    if (pollOpen) {
      const pollOpenAfter = this.pollOpenAfter;
      data['poll_open_after'] = pollOpenAfter;
      if (pollOpenAfter) {
        data['poll_open_after_hours'] = this.pollOpenAfterHours;
        data['poll_open_after_nominations'] = this.pollOpenAfterNominations;
      } else {
        data['poll_open_time'] = this.pollOpenTime;
      }
    }

    const pollClose = this.pollClose;
    data['poll_close'] = pollClose;
    if (pollClose) {
      const pollCloseAfter = this.pollCloseAfter;
      data['poll_close_after'] = pollCloseAfter;
      if (pollCloseAfter) {
        data['poll_close_after_hours'] = this.pollCloseAfterHours;
        data['poll_close_after_voters'] = this.pollCloseAfterVoters;
      } else {
        data['poll_close_time'] = this.pollCloseTime;
      }
    }

    if (this.sameMessage) {
      data['poll_message'] = data['nomination_message'];
      data['closed_poll_message'] = data['nomination_message'];
    }

    this.loading = true;
    try {
      const result = await ajax(`/election/create`, { type: 'POST', data });
      this.loading = false;

      if (result.url) {
        DiscourseURL.routeTo(result.url);
      }
    } catch (error) {
      this.loading = false;
      // Handle error as needed (e.g., show a message)
    }
  }
  //};
}
