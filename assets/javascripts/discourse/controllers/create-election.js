import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { computed } from '@ember/object';
import DiscourseURL from 'discourse/lib/url';
import { ajax } from 'discourse/lib/ajax';
//import SiteSettings from 'discourse/lib/site-settings';
//import moment from 'moment';
import { service } from '@ember/service';

export default class CreateElectionController extends Controller {
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

  actions = {
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
    },
  };
}


// import { default as computed } from 'ember-addons/ember-computed-decorators';
// import DiscourseURL from 'discourse/lib/url';
// import { ajax } from 'discourse/lib/ajax';

// export default Ember.Controller.extend({
//   statusBannerResultHours: Discourse.SiteSettings.elections_status_banner_default_result_hours,
//   statusBanner: true,
//   pollOpenAfter: true,
//   pollOpenAfterHours: 48,
//   pollOpenAfterNominations: 2,
//   pollCloseAfter: true,
//   pollCloseAfterHours: 48,
//   pollCloseAfterVoters: 10,

//   @computed('position', 'pollTimesValid')
//   disabled(position, pollTimesValid) {
//     return !position || position.length < 3 || !pollTimesValid;
//   },

//   @computed('pollOpenTime', 'pollCloseTime')
//   pollTimesValid(pollOpenTime, pollCloseTime) {
//     if (pollOpenTime && moment().isAfter(pollOpenTime)) return false;
//     if (pollCloseTime && moment().isAfter(pollCloseTime)) return false;
//     if (pollOpenTime && pollCloseTime && moment(pollCloseTime).isBefore(pollOpenTime)) return false;
//     return true;
//   },

//   actions: {
//     createElection() {
//       let data = {
//         category_id: this.get('model.categoryId'),
//         position: this.get('position'),
//         nomination_message: this.get('nominationMessage'),
//         poll_message: this.get('pollMessage'),
//         closed_poll_message: this.get('closedPollMessage'),
//         self_nomination_allowed: this.get('selfNominationAllowed'),
//         status_banner: this.get('statusBanner'),
//         status_banner_result_hours: this.get('statusBannerResultHours'),
//       };

//       const pollOpen = this.get('pollOpen');
//       data['poll_open'] = pollOpen;
//       if (pollOpen) {
//         const pollOpenAfter = this.get('pollOpenAfter');
//         data['poll_open_after'] = pollOpenAfter;
//         if (pollOpenAfter) {
//           data['poll_open_after_hours'] = this.get('pollOpenAfterHours');
//           data['poll_open_after_nominations'] = this.get('pollOpenAfterNominations');
//         } else {
//           data['poll_open_time'] = this.get('pollOpenTime');
//         }
//       }

//       const pollClose = this.get('pollClose');
//       data['poll_close'] = pollClose;
//       if (pollClose) {
//         const pollCloseAfter = this.get('pollCloseAfter');
//         data['poll_close_after'] = pollCloseAfter;
//         if (pollCloseAfter) {
//           data['poll_close_after_hours'] = this.get('pollCloseAfterHours');
//           data['poll_close_after_voters'] = this.get('pollCloseAfterVoters');
//         } else {
//           data['poll_close_time'] = this.get('pollCloseTime');
//         }
//       }

//       if (this.get('sameMessage')) {
//         data['poll_message'] = data['nomination_message'];
//         data['closed_poll_message'] = data['nomination_message'];
//       }

//       this.set('loading', true);
//       ajax(`/election/create`, {type: 'POST', data}).then((result) => {
//         this.set('loading', false);

//         if (result.url) {
//           DiscourseURL.routeTo(result.url);
//         }
//       });
//     }
//   }
// });
