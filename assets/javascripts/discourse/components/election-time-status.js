import Component from '@ember/component';
import { tracked } from '@glimmer/tracking';
//import { computed } from 'ember-decorators/object';
import { computed } from "@ember/object";
import { action } from '@ember/object';

export default class ElectionTimeStatusComponent extends Component {
  classNames = ['election-status-label'];

  @tracked nominating = this.topic.election_status === 1;
  @tracked polling = this.topic.election_status === 2;

  @computed('topic.election_poll_open_after_hours')
  get pollOpenTime() {
    const hours = this.topic.election_poll_open_after_hours;
    if (hours > 0) {
      return ` ${I18n.t('dates.medium.x_hours', { count: hours })}`;
    }
    return '';
  }

  @computed('topic.election_poll_close_after_hours')
  get pollCloseTime() {
    const hours = this.topic.election_poll_close_after_hours;
    if (hours > 0) {
      return ` ${I18n.t('dates.medium.x_hours', { count: hours })}`;
    }
    return '';
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
