import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import { action, computed, observer } from '@ember/object';
import { observes, on } from "@ember-decorators/object";

export default class SetElectionTimeComponent extends Component {
  classNames = ['set-election-time'];
  @tracked ready = false;
  @tracked date = '';
  @tracked time = '';

  @on('init')
  setup() {
    const dateTime = this.dateTime;
    if (dateTime) {
      const local = moment(dateTime).local();
      this.date = local.format('YYYY-MM-DD');
      this.time = local.format('HH:mm');
    }

    this.initializeTimePicker();
    this.ready = true;
  }

  initializeTimePicker() {
    const timeElementId = this.timeElementId;
    const $timePicker = $(`#${timeElementId}`);

    $timePicker.timepicker({ timeFormat: 'H:i' });
    if (this.time) {
      $timePicker.timepicker('setTime', this.time);
    }

    $timePicker.change(() => {
      this.time = $timePicker.val();
    });
  }

  @action
  sendTime() {
    if (this.ready) {
      const date = this.date;
      const time = this.time;
      const offset = -new Date().getTimezoneOffset() / 60;
      const dateTime = this.dateTime;
      const newDateTime = moment(`${date}T${time}`).utcOffset(offset).utc().format();

      if (!moment(dateTime).isSame(newDateTime, 'minute')) {
        this.setTime(newDateTime);
      }
    }
  }

  mouseDown(e) {
    const disabled = this.disabled;
    if (disabled) return e.stopPropagation();
    return true;
  }
}
