import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action, computed, observer } from "@ember/object";
import { inject as service } from "@ember/service";
import { observes, on } from "@ember-decorators/object";

/*
example:
    <SetElectionTime
      @dateTime={{this.time}}
      @timeElementId={{this.timeId}}
      @dateElementId={{this.dateId}}
      @disabled={{this.after}}
      @setTime={{this.setTime}}
    />
*/

export default class SetElectionTimeComponent extends Component {
  @tracked ready = false;
  @tracked date = "";
  @tracked time = "";
  classNames = ["set-election-time"];
  setTime = this.args.setTime;

  dateInitial = this.date;
  timeInitial = this.time;

  //@on("init")
  @action
  setup() {
    console.log("setElectionTime setup");
    const dateTime = this.dateTime;
    if (dateTime) {
      const local = moment(dateTime).local();
      this.date = local.format("YYYY-MM-DD");
      this.time = local.format("HH:mm");
    }

    this.initializeTimePicker();
    this.ready = true;
  }

  initializeTimePicker() {
    //console.log("initializeTimePicker: this.timeElementId", this.timeElementId);
    const timeElementId = this.args.timeElementId;
    const $timePicker = $(`#${timeElementId}`);

    $timePicker.timepicker({ timeFormat: "H:i" });
    if (this.time) {
      $timePicker.timepicker("setTime", this.time);
    }

    //console.log("timeElementId", timeElementId);
    $timePicker.change(() => {
      this.time = $timePicker.val();
      //console.log("time", this.time);
      this.setTime(this.time);
    });
  }

  @action
  sendTime() {
    if (this.ready) {
      const date = this.date;
      const time = this.time;
      const offset = -new Date().getTimezoneOffset() / 60;
      const dateTime = this.dateTime;
      const newDateTime = moment(`${date}T${time}`)
        .utcOffset(offset)
        .utc()
        .format();

      if (!moment(dateTime).isSame(newDateTime, "minute")) {
        this.setTime(newDateTime);
      }
    }
  }

  mouseDown(e) {
    const disabled = this.disabled;
    if (disabled) {
      return e.stopPropagation();
    }
    return true;
  }
}
