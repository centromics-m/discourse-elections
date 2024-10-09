import { createWidget } from 'discourse/widgets/widget';
import { getOwner } from 'discourse-common/lib/get-owner';
import showModal from 'discourse/lib/show-modal';
import { ElectionStatuses } from '../lib/election';
import { ajax } from 'discourse/lib/ajax';
import { h } from 'virtual-dom';

export default createWidget('election-controls', {
  tagName: 'div.election-controls',

  // Default state for the widget
  defaultState() {
    return {
      startingPoll: false
    };
  },

  // Action to toggle nomination modal
  toggleNomination() {
    showModal('confirm-nomination', {
      model: {
        topic: this.attrs.topic,
        rerender: () => this.scheduleRerender()
      }
    });
  },

  // Action to create a nomination statement
  makeStatement() {
    const controller = getOwner(this).lookup('controller:composer');
    const topic = this.attrs.topic;

    controller.open({
      action: 'reply',
      draftKey: 'reply',
      draftSequence: 0,
      topic
    });

    controller.set('model.electionNominationStatement', true);
  },

  // Action to manage election settings
  manage() {
    showModal('manage-election', {
      model: {
        topic: this.attrs.topic,
        rerender: () => this.scheduleRerender()
      }
    });
  },

  // Action to start the poll
  startPoll() {
    const topicId = this.attrs.topic.id;

    this.set('state.startingPoll', true);
    this.scheduleRerender();

    ajax('/election/start-poll', { type: 'PUT', data: { topic_id: topicId } })
      .then((result) => {
        if (result.failed) {
          bootbox.alert(result.message);
        } else {
          this.attrs.topic.set('election_status', ElectionStatuses.poll);
          bootbox.alert('Poll started successfully!'); // User feedback
        }
      })
      .catch((e) => {
        if (e.jqXHR && e.jqXHR.responseText) {
          const responseText = e.jqXHR.responseText;
          const message = responseText.substring(responseText.indexOf('>') + 1, responseText.indexOf('plugins'));
          bootbox.alert(message);
        }
      })
      .finally(() => {
        this.set('state.startingPoll', false);
        this.scheduleRerender();
      });
  },

  // Method to render the widget's HTML
  html(attrs, state) {
    const { topic } = attrs;
    const user = this.currentUser;
    const contents = [];

    if (topic.election_status === ElectionStatuses.nomination && topic.election_self_nomination_allowed && topic.election_can_self_nominate) {
      contents.push(this.attach('button', {
        action: 'toggleNomination',
        label: `election.nomination.${topic.election_is_nominee ? 'remove.label' : 'add.label'}`,
        className: 'btn-primary toggle-nomination'
      }));
    }

    if (topic.election_is_nominee && !topic.election_made_statement) {
      contents.push(this.attach('button', {
        action: 'makeStatement',
        label: 'election.nomination.statement.add',
        className: 'btn-primary add-statement'
      }));
    }

    if (user?.is_elections_admin) {
      contents.push(this.attach('button', {
        action: 'manage',
        label: 'election.manage.label',
        className: 'btn-primary manage-election'
      }));
    }

    if (user?.is_elections_admin && topic.election_status === ElectionStatuses.nomination) {
      contents.push(this.attach('button', {
        action: 'startPoll',
        label: 'election.start',
        className: 'btn-primary start-poll'
      }));

      if (state.startingPoll) {
        contents.push(h('div.spinner-container', h('div.spinner.small')));
      }
    }

    return contents;
  }
});


// import { createWidget } from 'discourse/widgets/widget';
// import { getOwner } from 'discourse-common/lib/get-owner';
// import showModal from 'discourse/lib/show-modal';
// import { ElectionStatuses } from '../lib/election';
// import { ajax } from 'discourse/lib/ajax';
// import { h } from 'virtual-dom';

// export default createWidget('election-controls', {
//   tagName: 'div.election-controls',
//   buildKey: () => `election-controls`,

//   defaultState() {
//     return {
//       startingPoll: false
//     };
//   },

//   toggleNomination() {
//     showModal('confirm-nomination', {
//       model: {
//         topic: this.attrs.topic,
//         rerender: () => this.scheduleRerender()
//       }
//     });
//   },

//   makeStatement() {
//     const controller = getOwner(this).lookup('controller:composer');
//     const topic = this.attrs.topic;

//     controller.open({
//       action: 'reply',
//       draftKey: 'reply',
//       draftSequence: 0,
//       topic
//     });

//     controller.set('model.electionNominationStatement', true);
//   },

//   manage() {
//     showModal('manage-election', {
//       model: {
//         topic: this.attrs.topic,
//         rerender: () => this.scheduleRerender()
//       }
//     });
//   },

//   startPoll() {
//     const topicId = this.attrs.topic.id;

//     ajax('/election/start-poll', {type: 'PUT', data: { topic_id: topicId }}).then((result) => {
//       if (result.failed) {
//         bootbox.alert(result.message);
//       } else {
//         this.attrs.topic.set('election_status', ElectionStatuses['poll']);
//       }

//       if (this.state) this.state.startingPoll = false;
//       this.scheduleRerender();
//     }).catch((e) => {
//       if (e.jqXHR && e.jqXHR.responseText) {
//         const responseText = e.jqXHR.responseText;
//         const message = responseText.substring(responseText.indexOf('>') + 1, responseText.indexOf('plugins'));
//         bootbox.alert(message);
//       }
//     }).finally(() => {
//       if (this.state) this.state.startingPoll = false;
//       this.scheduleRerender();
//     });

//     if (this.state) this.state.startingPoll = true;
//     this.scheduleRerender();
//   },

//   html(attrs, state) {
//     const topic = attrs.topic;
//     const user = this.currentUser;
//     let contents = [];

//     if (topic.election_status === ElectionStatuses['nomination'] && topic.election_self_nomination_allowed
//         && topic.election_can_self_nominate) {
//       contents.push(this.attach('button', {
//         action: `toggleNomination`,
//         label: `election.nomination.${topic.election_is_nominee ? 'remove.label' : 'add.label'}`,
//         className: 'btn-primary toggle-nomination'
//       }));
//     }

//     if (topic.election_is_nominee && !topic.election_made_statement) {
//       contents.push(this.attach('button', {
//         action: 'makeStatement',
//         label: `election.nomination.statement.add`,
//         className: 'btn-primary add-statement'
//       }));
//     }

//     if (user && user.is_elections_admin) {
//       contents.push(this.attach('button', {
//         action: 'manage',
//         label: 'election.manage.label',
//         className: 'btn-primary manage-election'
//       }));
//     }

//     if (user && user.is_elections_admin && topic.election_status === ElectionStatuses['nomination']) {
//       contents.push(this.attach('button', {
//         action: 'startPoll',
//         label: 'election.start',
//         className: 'btn-primary start-poll'
//       }));

//       if (state && state.startingPoll) {
//         contents.push(h('div.spinner-container', h('div.spinner.small')));
//       }
//     }

//     return contents;
//   }
// });
