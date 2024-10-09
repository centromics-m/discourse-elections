import Component from '@ember/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { ajax } from 'discourse/lib/ajax';

export default class ElectionSaveComponent extends Component {
  @tracked icon = null;
  @tracked saving = false;

  get disabled() {
    return this.unchanged || this.saving || this.invalid;
  }

  get unchanged() {
    const current = this.property;
    const original = this.topic[`election_${this.name}`];
    return current === original;
  }

  prepareData() {
    if (this.disabled) return false;

    this.icon = null;
    this.saving = true;
    $('#modal-alert').hide();

    const data = {
      topic_id: this.topic.id,
      [this.name]: this.property
    };

    return data;
  }

  resolve(result) {
    const property = this.property;
    const name = this.name;
    const original = this.topic[`election_${name}`];

    if (result.success) {
      this.icon = 'check';
      this.topic[`election_${name}`] = property;
    } else if (result.failed) {
      this.icon = 'times';
      if (original) this.property = original;
      this.sendAction('error', result.message);
    }

    this.sendAction('saved');
    this.saving = false;
  }

  resolveStandardError(responseText) {
    const message = responseText.substring(responseText.indexOf('>') + 1, responseText.indexOf('plugins'));
    this.resolve({ failed: true, message });
  }

  @action
  save() {
    const data = this.prepareData();
    const name = this.name;
    if (!data) return;

    ajax(`/election/set-${name.dasherize()}`, { type: 'PUT', data })
      .then((result) => {
        this.resolve(result);
      })
      .catch((e) => {
        if (e.jqXHR && e.jqXHR.responseText) {
          this.resolveStandardError(e.jqXHR.responseText);
        }
      })
      .finally(() => this.resolve({}));
  }
}


// import computed from 'ember-addons/ember-computed-decorators';
// import { ajax } from 'discourse/lib/ajax';

// export default Ember.Component.extend({
//   disabled: Ember.computed.or('unchanged', 'saving', 'invalid'),

//   @computed('property', 'name')
//   unchanged(current, name) {
//     const original = this.get(`topic.election_${name}`);
//     return current === original;
//   },

//   prepareData() {
//     if (this.get(`disabled`)) return false;

//     this.setProperties({
//       icon: null,
//       saving: true
//     });
//     $('#modal-alert').hide();

//     const property = this.get('property');
//     const name = this.get('name');
//     const topicId = this.get('topic.id');
//     let data = { topic_id: topicId };

//     data[name] = property;

//     return data;
//   },

//   resolve(result) {
//     const property = this.get('property');
//     const name = this.get('name');
//     const original = this.get(`topic.election_${name}`);

//     if (result.success) {
//       this.set('icon', 'check');
//       this.set(`topic.election_${name}`, property);
//     } else if (result.failed) {
//       this.set('icon', 'times');
//       if (original) this.set('property', original);
//       this.sendAction('error', result.message);
//     }

//     this.sendAction('saved');
//     this.set('saving', false);
//   },

//   resolveStandardError(responseText) {
//     const message = responseText.substring(responseText.indexOf('>')+1 , responseText.indexOf('plugins'));
//     this.resolve({ failed: true, message });
//   },

//   actions: {
//     save() {
//       const data = this.prepareData();
//       const name = this.get('name');
//       if (!data) return;

//       ajax(`/election/set-${name.dasherize()}`, { type: 'PUT', data }).then((result) => {
//         this.resolve(result);
//       }).catch((e) => {
//         if (e.jqXHR && e.jqXHR.responseText) {
//           this.resolveStandardError(e.jqXHR.responseText);
//         }
//       }).finally(() => this.resolve({}));
//     }
//   }
// });
