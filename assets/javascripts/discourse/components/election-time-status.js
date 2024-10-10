import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { computed } from '@ember/object';
import I18n from "discourse-i18n";

export default class ElectionTimeStatusComponent extends Component {
  @tracked nominating;
  @tracked polling;

  constructor() {
    super(...arguments);
    this.setup();
  }

  setup() {
    const topic = this.args.topic || {}; // Access topic via arguments
    if (topic) {
      this.nominating = topic.election_status === 1;
      this.polling = topic.election_status === 2;
    }
  }

  @computed('args.topic.election_poll_open_after_hours')
  get pollOpenTime() {
    const hours = this.args.topic?.election_poll_open_after_hours;
    return hours > 0 ? ` ${I18n.t('dates.medium.x_hours', { count: hours })}` : '';
  }

  @computed('args.topic.election_poll_close_after_hours')
  get pollCloseTime() {
    const hours = this.args.topic?.election_poll_close_after_hours;
    return hours > 0 ? ` ${I18n.t('dates.medium.x_hours', { count: hours })}` : '';
  }
}


// import computed from 'ember-addons/ember-computed-decorators';

// export default Ember.Component.extend({
//   classNames: 'election-status-label',
//   nominating: Ember.computed.equal('topic.election_status', 1),
//   polling: Ember.computed.equal('topic.election_status', 2),

//   @computed('topic.election_poll_open_after_hours')
//   pollOpenTime(hours) {
//     if (hours > 0) {
//       return ` ${I18n.t('dates.medium.x_hours', { count: hours })}`;
//     } else {
//       return '';
//     }
//   },

//   @computed('topic.election_poll_close_after_hours')
//   pollCloseTime(hours) {
//     if (hours > 0) {
//       return ` ${I18n.t('dates.medium.x_hours', { count: hours })}`;
//     } else {
//       return '';
//     }
//   }
// });
