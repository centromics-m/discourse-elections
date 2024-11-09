import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action, computed, observer } from "@ember/object";
import { inject as service } from "@ember/service";
import I18n from "discourse-i18n";

/*
  <ElectionTime
        @type="open"
        @after={{this.pollOpenAfter}}
        @hours={{this.pollOpenAfterHours}}
        @nominations={{this.pollOpenAfterNominations}}
        @time={{this.pollOpenTime}}
      />
*/
export default class ElectionTimeComponent extends Component {
  @tracked after = this.args.after || false;
  @tracked manual = this.args.manual || false;
  @tracked hours = this.args.hours || 0;
  @tracked nominations = this.args.nominations || 0;
  @tracked voters = 0;
  @tracked type = this.args.type;
  classNames = ["election-time"];

  hoursInitial = this.hours;
  nominationsInitial = this.nominations;

  get showNominations() {
    return this.type === "open";
  }

  get showVoters() {
    return this.type === "close";
  }

  @computed("after")
  get toggleManual() {
    if (this.after) {
      this.manual = false;
    }
  }

  @computed("manual")
  get toggleAfter() {
    if (this.manual) {
      this.after = false;
    }
  }

  @computed("type")
  get timeId() {
    return `${this.type}-time-picker`;
  }

  @computed("type")
  get dateId() {
    return `${this.type}-date-picker`;
  }

  @computed("type")
  get afterTitle() {
    return `election.poll.${this.type}_after`;
  }

  @computed("type")
  get manualTitle() {
    return `election.poll.${this.type}_manual`;
  }

  @computed("type")
  get criteria() {
    const list = I18n.t(`election.poll.${this.type}_criteria`).split("-");
    return list.filter((c) => c.length > 3);
  }

  @action
  setTime(time) {
    this.time = time;
  }
}
