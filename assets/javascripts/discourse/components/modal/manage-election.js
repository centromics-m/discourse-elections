import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action, computed, observer } from "@ember/object";
import { inject as service } from "@ember/service";
import DButton from "discourse/components/d-button";
import { ElectionStatuses } from "../../lib/election";
import ElectionSaveTime from "../election-save-time";
import ElectionSaveUsernames from "../election-save-usernames";
import ElectionTime from "../election-time";

export default class ManageElectionModal extends Component {
  @service flashMessages; // To display error messages
  @tracked topic; // = this.args.model.topic;
  @tracked usernamesString; // = this.topic.election_nominations_usernames.join(",");
  @tracked position; // = this.topic.election_position;
  @tracked status; // = this.topic.election_status;

  @tracked showSelector = false;
  @tracked pollOpenAfter = true;
  @tracked pollCloseAfter = true;
  //@tracked usernamesString = '';
  @tracked selfNomination = false;
  //@tracked position = '';
  @tracked statusBanner = false;
  //@tracked topic = null;
  @tracked statusBannerResultHours = 0;
  //@tracked status = '';
  @tracked nominationMessage = "";
  @tracked pollMessage = "";
  @tracked closedPollMessage = "";
  @tracked sameMessage = false;
  @tracked pollOpen = false;
  @tracked pollOpenAfterHours = 0;
  @tracked pollOpenAfterNominations = 0;
  @tracked pollOpenTime = "";
  @tracked pollClose = false;
  @tracked pollCloseAfterHours = 0;
  @tracked pollCloseAfterVoters = 0;
  @tracked pollCloseTime = "";
  @tracked winner = "";
  nominationParam = { type: "nomination" };
  pollParam = { type: "poll" };

  constructor() {
    super(...arguments);
    this.setup();
  }

  setup() {
    const model = this.args.model;

    // console.log("ManageElectionModal this.outargs", this.outletArgs);
    // console.log("ManageElectionModal this.args", this.args);
    // console.log("ManageElectionModal model", model);
    // console.log("ManageElectionModal model.topic", this.args.model.model.topic);

    if (model) {
      const topic = model.model.topic;

      this.showSelector = true;
      this.topic = topic;
      this.position = topic.election_position;
      this.usernamesString = ""; //topic.election_nominations_usernames.join(',');
      this.selfNomination = topic.election_self_nomination_allowed;
      this.statusBanner = topic.election_status_banner;
      this.statusBannerResultHours = topic.election_status_banner_result_hours;
      this.status = topic.election_status;
      this.nominationMessage = topic.election_nomination_message;
      this.pollMessage = topic.election_poll_message;
      this.closedPollMessage = topic.election_closed_poll_message;
      this.sameMessage = topic.same_message;
      this.pollOpen = topic.election_poll_open;
      this.pollOpenAfter = topic.election_poll_open_after;
      this.pollOpenAfterHours = topic.election_poll_open_after_hours;
      this.pollOpenAfterNominations =
        topic.election_poll_open_after_nominations;
      this.pollOpenTime = topic.election_poll_open_time;
      this.pollClose = topic.election_poll_close;
      this.pollCloseAfter = topic.election_poll_close_after;
      this.pollCloseAfterHours = topic.election_poll_close_after_hours;
      this.pollCloseAfterVoters = topic.election_poll_close_after_voters;
      this.pollCloseTime = topic.election_poll_close_time;
      this.winner = topic.election_winner;
    }
  }

  @computed
  get electionStatuses() {
    return Object.keys(ElectionStatuses).map((k) => ({
      name: k,
      id: ElectionStatuses[k],
    }));
  }

  @computed("usernamesString")
  get usernames() {
    return this.usernamesString.split(",");
  }

  set usernames(value) {
    // setter 로직: 필요 시 구현
    //console.warn("usernames was set:", value);
    if (!value) {
      //console.warn("usernames was set2:", value);
      this.usernamesString = "";
    } else {
      //console.warn("usernames was set1:", value);
      this.usernamesString = value.join(",");
    }
    return value;
  }

  @computed("usernames", "topic.election_nominations_usernames")
  get usernamesUnchanged() {
    const newUsernames = this.usernames.filter(Boolean);
    const currentUsernames =
      this.topic?.election_nominations_usernames.filter(Boolean) || [];

    if (newUsernames.length !== currentUsernames.length) {
      return false;
    }

    return newUsernames.every((username) =>
      currentUsernames.includes(username)
    );
  }

  set usernamesUnchanged(value) {
    // setter 로직: 필요 시 구현
    //console.warn("usernamesUnchanged was set:", value);
    return value;
  }

  @computed("status", "topic.election_status")
  get statusUnchanged() {
    return Number(this.status) === Number(this.topic.election_status);
  }

  @computed("position")
  get positionInvalid() {
    //console.log("positionInvalid", this.position);
    return !this.position || this.position.length < 3;
  }

  //@observer
  // get isPositionInvalid() {
  //   console.log('positionInvalid2', this.position)
  //   return !this.position
  // }

  @action
  close() {
    //this.send('closeModal');
    this.args.closeModal();
  }

  @action
  error(message) {
    this.flash(message, "error");
  }

  @action
  saved() {
    this.model.rerender();
  }

  get model() {
    return this.args.model;
  }

  // @action
  // onUseranamesInput(event) {
  //   console.log('onUseranamesInput', event);
  //   //this.usernamesString = event.target.value.join(',');
  // }

  @action
  onUsernamesInput(usernames) {
    //console.log('onUsernamesInput:', usernames);

    // Join the usernames into a string if needed.
    this.usernamesString = (usernames || []).filter(Boolean).join(", ");

    //console.log("onUsernamesInput:", this.usernamesString);
  }

  @action
  onUsernameSelect(username) {
    console.log("onUsernameSelect:", username);

    if (username.trim() === "") {
      alert("Please enter a username.");
      return;
    }

    if (this.usernames.includes(username)) {
      alert("Username already selected.");
      return;
    }

    this.usernames.push(username);
  }

  @action
  setElectionTime_PollOpen(data) {
    console.log("setElectionTime_PollOpen", data);

    // @tracked pollOpen = false;
    // @tracked pollOpenAfterHours = 0;
    // @tracked pollOpenAfterNominations = 0;
    // @tracked pollOpenTime = "";
    this.pollOpenAfter = data.after;
    this.pollOpenAfterHours = Number(data.hours);
    this.pollOpenAfterNominations = Number(data.nominations);
    this.pollOpenTime = data.time;

    //console.log(this, this.pollOpenTime);
  }

  @action
  setElectionTime_PollClose(data) {
    //console.log("setElectionTime_PollClose", data);

    // @tracked pollClose = false;
    // @tracked pollCloseAfterHours = 0;
    // @tracked pollCloseAfterVoters = 0;
    // @tracked pollCloseTime = "";
    this.pollCloseAfter = data.after;
    this.pollCloseAfterHours = Number(data.hours);
    this.pollCloseAfterVoters = Number(data.voters);
    this.pollCloseTime = data.time;
  }
}
