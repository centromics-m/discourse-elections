import ElectionSave from './election-save';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
//import { computed } from '@ember-decorators/computed';
import { computed } from "@ember/object";
import $ from 'jquery';

export default class ElectionSaveTimeComponent extends ElectionSave {
  name = 'poll_time';
  layoutName = 'components/election-save';

  @tracked type;
  @tracked enabled;
  @tracked after;
  @tracked hours;
  @tracked nominations;
  @tracked voters;
  @tracked time;
  @tracked icon = null;
  @tracked saving = false;

  @computed('type', 'enabled', 'after', 'hours', 'nominations', 'voters', 'time', 'topicUpdated')
  get unchanged() {
    const originalEnabled = this.topic[`election_poll_${this.type}`];
    const originalAfter = this.topic[`election_poll_${this.type}_after`];
    const originalHours = this.topic[`election_poll_${this.type}_after_hours`];
    const originalNominations = this.topic.election_poll_open_after_nominations;
    const originalVoters = this.topic.election_poll_close_after_voters;
    const originalTime = this.topic[`election_poll_${this.type}_time`];

    return (
      this.enabled === originalEnabled &&
      this.after === originalAfter &&
      this.hours === originalHours &&
      (this.type === 'open' ? this.nominations === originalNominations : true) &&
      (this.type === 'close' ? this.voters === originalVoters : true) &&
      this.time === originalTime
    );
  }

  prepareData() {
    if (this.disabled) return false;

    this.icon = null;
    this.saving = true;

    $('#modal-alert').hide();

    const after = this.after;
    const type = this.type;

    let data = {
      topic_id: this.topic.id,
      type,
      enabled: this.enabled,
      after
    };

    if (after) {
      data.hours = this.hours;
      if (type === 'open') {
        data.nominations = this.nominations;
      }
      if (type === 'close') {
        data.voters = this.voters;
      }
    } else {
      data.time = this.time;
    }

    return data;
  }

  @action
  resolve(result) {
    const type = this.type;

    if (result.success) {
      this.icon = 'check';
      this.topic[`election_poll_${type}`] = this.enabled;
      this.topic[`election_poll_${type}_after`] = this.after;
      this.topic[`election_poll_${type}_after_hours`] = this.hours;
      this.topic[`election_poll_${type}_time`] = this.time;
      if (type === 'open') {
        this.topic.election_poll_open_after_nominations = this.nominations;
      }
      if (type === 'close') {
        this.topic.election_poll_close_after_voters = this.voters;
      }
      this.toggleProperty('topicUpdated');
    } else if (result.failed) {
      this.icon = 'times';
      this.enabled = this.topic[`election_poll_${type}`];
      this.after = this.topic[`election_poll_${type}_after`];
      this.hours = this.topic[`election_poll_${type}_after_hours`];
      this.time = this.topic[`election_poll_${type}_time`];

      if (type === 'open') {
        this.nominations = this.topic.election_poll_open_after_nominations;
      }
      if (type === 'close') {
        this.voters = this.topic.election_poll_close_after_voters;
      }
      this.sendAction('error', result.message);
    }

    this.sendAction('saved');
    this.saving = false;
  }
}


// import ElectionSave from './election-save';
// import computed from 'ember-addons/ember-computed-decorators';

// export default ElectionSave.extend({
//   name: 'poll_time',
//   layoutName: 'components/election-save',

//   @computed('type', 'enabled', 'after', 'hours', 'nominations', 'voters', 'time', 'topicUpdated')
//   unchanged(type, enabled, after, hours, nominations, voters, time) {
//     const originalEnabled = this.get(`topic.election_poll_${type}`);
//     const originalAfter = this.get(`topic.election_poll_${type}_after`);
//     const originalHours = this.get(`topic.election_poll_${type}_after_hours`);
//     const originalNominations = this.get('topic.election_poll_open_after_nominations');
//     const originalVoters = this.get('topic.election_poll_close_after_voters');
//     const originalTime = this.get(`topic.election_poll_${type}_time`);
//     return enabled === originalEnabled &&
//            after === originalAfter &&
//            hours === originalHours &&
//            (type === 'open' ? nominations === originalNominations : true) &&
//            (type === 'close' ? voters === originalVoters : true) &&
//            time === originalTime;
//   },

//   prepareData() {
//     if (this.get(`disabled`)) return false;

//     this.setProperties({
//       icon: null,
//       saving: true
//     });

//     $('#modal-alert').hide();

//     const after = this.get('after');
//     const type = this.get('type');

//     let data = {
//       topic_id: this.get('topic.id'),
//       type,
//       enabled: this.get('enabled'),
//       after
//     };

//     if (after) {
//       data['hours'] = this.get('hours');
//       if (type === 'open') {
//         data['nominations'] = this.get('nominations');
//       }
//       if (type === 'close') {
//         data['voters'] = this.get('voters');
//       }
//     } else {
//       data['time'] = this.get('time');
//     }

//     return data;
//   },

//   resolve(result) {
//     const type = this.get('type');
//     const enabled = this.get('enabled');
//     const after = this.get('after');
//     const hours = this.get('hours');
//     const nominations = this.get('nominations');
//     const voters = this.get('voters');
//     const time = this.get('time');

//     if (result.success) {
//       this.set('icon', 'check');
//       this.set(`topic.election_poll_${type}`, enabled);
//       this.set(`topic.election_poll_${type}_after`, after);
//       this.set(`topic.election_poll_${type}_after_hours`, hours);
//       this.set(`topic.election_poll_${type}_time`, time);
//       if (type === 'open') {
//         this.set('topic.election_poll_open_after_nominations', nominations);
//       }
//       if (type === 'close') {
//         this.set('topic.election_poll_close_after_voters', voters);
//       }
//       this.toggleProperty('topicUpdated');
//     } else if (result.failed) {
//       this.setProperties({
//         icon: 'times',
//         enabled: this.get(`topic.election_poll_${type}`),
//         after: this.get(`topic.election_poll_${type}_after`),
//         hours: this.get(`topic.election_poll_${type}_after_hours`),
//         time: this.get(`topic.election_poll_${type}_time`),
//       });
//       if (type === 'open') {
//         this.set('nominations', this.get('topic.election_poll_open_after_nominations'));
//       }
//       if (type === 'close') {
//         this.set('voters', this.get('topic.election_poll_close_after_voters'));
//       }
//       this.sendAction('error', result.message);
//     }

//     this.sendAction('saved');
//     this.set('saving', false);
//   },
// });
