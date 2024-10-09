import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { computed } from '@ember/object';
import ModalFunctionality from 'discourse/mixins/modal-functionality';
import { ElectionStatuses } from '../lib/election';

export default class ManageElectionController extends Controller.extend(ModalFunctionality) {
  @tracked showSelector = false;
  nominationParam = { type: 'nomination' };
  pollParam = { type: 'poll' };
  @tracked pollOpenAfter = true;
  @tracked pollCloseAfter = true;
  @tracked topic = null;
  @tracked position = '';
  @tracked usernamesString = '';
  @tracked selfNomination = false;
  @tracked statusBanner = false;
  @tracked statusBannerResultHours = 0;
  @tracked status = '';
  @tracked nominationMessage = '';
  @tracked pollMessage = '';
  @tracked closedPollMessage = '';
  @tracked sameMessage = false;
  @tracked pollOpen = false;
  @tracked pollOpenAfterHours = 0;
  @tracked pollOpenAfterNominations = 0;
  @tracked pollOpenTime = '';
  @tracked pollClose = false;
  @tracked pollCloseAfterHours = 0;
  @tracked pollCloseAfterVoters = 0;
  @tracked pollCloseTime = '';
  @tracked winner = '';

  constructor() {
    super(...arguments);
    this.setup();
  }

  setup() {
    const model = this.model;
    if (model) {
      const topic = model.topic;

      this.showSelector = true;
      this.topic = topic;
      this.position = topic.election_position;
      this.usernamesString = topic.election_nominations_usernames.join(',');
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
      this.pollOpenAfterNominations = topic.election_poll_open_after_nominations;
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

  @computed('usernamesString')
  get usernames() {
    return this.usernamesString.split(',');
  }

  @computed('usernames', 'topic.election_nominations_usernames')
  get usernamesUnchanged() {
    const newUsernames = this.usernames.filter(Boolean);
    const currentUsernames = this.topic?.election_nominations_usernames.filter(Boolean) || [];

    if (newUsernames.length !== currentUsernames.length) {
      return false;
    }

    return newUsernames.every((username) => currentUsernames.includes(username));
  }

  @computed('status', 'topic.election_status')
  get statusUnchanged() {
    return Number(this.status) === Number(this.topic.election_status);
  }

  @computed('position')
  get positionInvalid() {
    return !this.position || this.position.length < 3;
  }

  @action
  close() {
    this.send('closeModal');
  }

  @action
  error(message) {
    this.flash(message, 'error');
  }

  @action
  saved() {
    this.model.rerender();
  }
}


// import ModalFunctionality from 'discourse/mixins/modal-functionality';
// import { ElectionStatuses } from '../lib/election';
// import { observes, default as computed } from 'ember-addons/ember-computed-decorators';

// export default Ember.Controller.extend(ModalFunctionality, {
//   showSelector: false,
//   nominationParam: { type: 'nomination' },
//   pollParam: { type: 'poll' },
//   pollOpenAfter: true,
//   pollCloseAfter: true,

//   @observes('model')
//   setup() {
//     const model = this.get('model');
//     if (model) {
//       const topic = model.topic;

//       this.setProperties({
//         showSelector: true,
//         topic: model.topic,
//         position: topic.election_position,
//         usernamesString: topic.election_nominations_usernames.join(','),
//         selfNomination: topic.election_self_nomination_allowed,
//         statusBanner: topic.election_status_banner,
//         statusBannerResultHours: topic.election_status_banner_result_hours,
//         status: topic.election_status,
//         nominationMessage: topic.election_nomination_message,
//         pollMessage: topic.election_poll_message,
//         closedPollMessage: topic.election_closed_poll_message,
//         sameMessage: topic.same_message,
//         pollOpen: topic.election_poll_open,
//         pollOpenAfter: topic.election_poll_open_after,
//         pollOpenAfterHours: topic.election_poll_open_after_hours,
//         pollOpenAfterNominations: topic.election_poll_open_after_nominations,
//         pollOpenTime: topic.election_poll_open_time,
//         pollClose: topic.election_poll_close,
//         pollCloseAfter: topic.election_poll_close_after,
//         pollCloseAfterHours: topic.election_poll_close_after_hours,
//         pollCloseAfterVoters: topic.election_poll_close_after_voters,
//         pollCloseTime: topic.election_poll_close_time,
//         winner: topic.election_winner
//       });
//     }
//   },

//   @computed()
//   electionStatuses() {
//     return Object.keys(ElectionStatuses).map(function(k){
//       return {
//         name: k,
//         id: ElectionStatuses[k]
//       };
//     });
//   },

//   @computed('usernamesString')
//   usernames(usernamesString) {
//     return usernamesString.split(',');
//   },

//   @computed('usernames', 'topic.election_nominations_usernames')
//   usernamesUnchanged(newUsernames, currentUsernames) {
//     let unchanged = true;

//     if (newUsernames) {
//       // ensure there are no empty strings
//       newUsernames = newUsernames.filter(Boolean);
//       currentUsernames = currentUsernames.filter(Boolean);

//       if (newUsernames.length !== currentUsernames.length) {
//         unchanged = false;
//       }

//       for (let i = 0; i < newUsernames.length; i++) {
//         if (currentUsernames.indexOf(newUsernames[i]) === -1) {
//           unchanged = false;
//         }
//       }
//     }

//     return unchanged;
//   },

//   @computed('status', 'topic.election_status')
//   statusUnchanged(current, original) {
//     return Number(current) === Number(original);
//   },

//   @computed('position')
//   positionInvalid(position) {
//     return !position || position.length < 3;
//   },

//   actions: {
//     close() {
//       this.send('closeModal');
//     },

//     error(message) {
//       this.flash(message, 'error');
//     },

//     saved() {
//       this.get('model.rerender')();
//     }
//   }
// });
