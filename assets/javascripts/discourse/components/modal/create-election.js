import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { fn } from "@ember/helper";
import { on } from "@ember/modifier";
import { action, computed, observer } from "@ember/object";
import { service } from "@ember/service";
import DButton from "discourse/components/d-button";
//import PollUiBuilder from "discourse/components/modal/poll-ui-builder";
import { ajax } from "discourse/lib/ajax";
import DiscourseURL from "discourse/lib/url";
import PollUiBuilderModal from "discourse/plugins/poll/discourse/components/modal/poll-ui-builder";

export default class CreateElectionModal extends Component {
  @service siteSettings;
  @service modal;

  @tracked
  statusBannerResultHours = this.siteSettings.elections_status_banner_default_result_hours;
  @tracked statusBanner = true;
  @tracked pollOpenAfter = true;
  @tracked pollOpenAfterHours = 48;
  @tracked pollOpenAfterNominations = 2;
  @tracked pollCloseAfter = true;
  @tracked pollCloseAfterHours = 48;
  @tracked pollCloseAfterVoters = 10;
  @tracked loading = false;
  //@tracked model = null;
  @tracked pollOpen = false;
  @tracked pollClose = false;

  constructor() {
    super(...arguments);
    this.setup();
  }

  setup() {
    const model = this.args.model;

    if (model) {
      this.showSelector = true;
      this.categoryId = model.categoryId;
      this.position = model.position;
      this.pollOpenTime = model.pollOpenTime;
      this.pollCloseTime = model.pollCloseTime;
    }
  }

  get model() {
    return this.args.model;
  }

  @action
  close() {
    //this.send('closeModal');
    this.args.closeModal();
  }

  @computed("position", "pollTimesValid")
  get disabled() {
    const position = this.position;
    const pollTimesValid = this.pollTimesValid;
    return !position || position.length < 3 || !pollTimesValid;
  }

  @computed("pollOpenTime", "pollCloseTime")
  get pollTimesValid() {
    const { pollOpenTime, pollCloseTime } = this;
    if (pollOpenTime && moment().isAfter(pollOpenTime)) {
      return false;
    }
    if (pollCloseTime && moment().isAfter(pollCloseTime)) {
      return false;
    }
    if (
      pollOpenTime &&
      pollCloseTime &&
      moment(pollCloseTime).isBefore(pollOpenTime)
    ) {
      return false;
    }
    return true;
  }

  @action
  async createElection() {
    //console.log("createElection this.model", this.model);

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
    data["poll_open"] = pollOpen;
    if (pollOpen) {
      const pollOpenAfter = this.pollOpenAfter;
      data["poll_open_after"] = pollOpenAfter;
      if (pollOpenAfter) {
        data["poll_open_after_hours"] = this.pollOpenAfterHours;
        data["poll_open_after_nominations"] = this.pollOpenAfterNominations;
      } else {
        // manual
        data["poll_open_time"] = this.pollOpenTime;
      }
    }

    const pollClose = this.pollClose;
    data["poll_close"] = pollClose;
    if (pollClose) {
      const pollCloseAfter = this.pollCloseAfter;
      data["poll_close_after"] = pollCloseAfter;
      if (pollCloseAfter) {
        data["poll_close_after_hours"] = this.pollCloseAfterHours;
        data["poll_close_after_voters"] = this.pollCloseAfterVoters;
      } else {
        // manual
        data["poll_close_time"] = this.pollCloseTime;
      }
    }

    if (this.sameMessage) {
      data["poll_message"] = data["nomination_message"];
      data["closed_poll_message"] = data["nomination_message"];
    }

    this.loading = true;
    try {
      const result = await ajax(`/election/create`, {
        type: "POST",
        data,
      });
      this.loading = false;

      if (result.url) {
        DiscourseURL.routeTo(result.url);
      }
    } catch (error) {
      this.loading = false;
      // Handle error as needed (e.g., show a message)
    }
  }

  // @action
  // openPollUiBuilderModal() {
  //   this.modal.show(CreateElectionModal, {
  //     model: {
  //       toolbarEvent: null,
  //       onInsertPoll: this.onInsertPoll,          // onInsertPoll(outputAsJson) (for standalone mode; used by external plugin)
  //     },
  //   });

  //   // this.modal.show("create-election", {
  //   //   model: {
  //   //     categoryId: this.args.category.id,
  //   //   },
  //   // });
  // }

  // @action
  // onInsertPoll(outputAsJson) {
  //   console.log(outputAsJson);
  // }
}
