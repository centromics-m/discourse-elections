import Component from '@ember/component';
import { tracked } from '@glimmer/tracking';
import { get, set, action, computed } from '@ember/object';
import { ajax } from 'discourse/lib/ajax';
import { dasherize } from "@ember/string";
import { next } from '@ember/runloop';

import DButton from "discourse/components/d-button";

/*
<ElectionSave @property={{this.position}}
                    @name="position"
                    @invalid={{this.positionInvalid}}
                    @topic={{this.topic}}
                    @error="error"
                    @saved="saved" />
*/

export default class ElectionSaveComponent extends Component {
  @tracked saving = false;
  @tracked icon = null;

  init() {
    super.init(...arguments);
    this.setup();
    // console.log('this', this);
    // console.log('this.args', this.args); // --> undefined
    // console.log('property', this.property);
    // console.log('name', this.get('name'));
    // console.log('topic', this.get('topic'));
    // console.log('saved', this.saved);
  }

  setup() {
    if(this.topic) {
      next(this, () => {
        set(this, 'property', this.topic[`election_${this.name}`]); // property = this.topic[`election_${this.name}`];
      });
    }
  }

  get disabled() {
    return this.unchanged || this.saving || this.invalid;
  }

  @computed('property', 'name')
  get unchanged() {
    let current = this.property;
    let original = undefined;
    if(this.topic) {
      original = this.topic[`election_${this.name}`];
    }

    return current === original;
  }

  set unchanged(unchanged) {
    console.log('set unchanged', unchanged);
  }

  prepareData() {
    if (this.disabled) {
      return false;
    }

    this.saving = true;
    $('#modal-alert').hide();

    const data = {
      topic_id: this.topic.id,
      [this.name]: this.property
    };

    console.log('data', data);

    return data;
  }

  resolve(result) {
    const name = this.name;
    const original = this.topic[`election_${name}`];

    if (result.success) {
      //next(() => {
        this.icon = 'check';
        this.topic[`election_${name}`] = this.property;
      //});
    } else if (result.failed) {
      //next(() => {
        this.icon = 'times';
        if (original) {
          this.property = original;
        }
        //this.sendAction('error', result.message);
        this.handleError(result);
      //});
    }

    //next(() => {
      //this.sendAction('saved');
			//this.saved();
      this.saving = false;
    //});
  }

  resolveStandardError(responseText) {
    const message = responseText.substring(responseText.indexOf('>') + 1, responseText.indexOf('plugins'));
    this.resolve({ failed: true, message });
  }

  @action
  save() {
    next(this, () => {
      this.saving = true;
    });

    const data = this.prepareData();
    // const data = {
		// 	topic_id: this.topic.id,
		// 	[this.name]: this.property,
		// };

    //const name = this.name;
    // console.log('data', data);
    // console.log('name', name);

    if (!data['topic_id']) return;

    //console.log('name2', name);

    ajax(`/election/set-${dasherize(this.name)}`, { type: 'PUT', data })
      .then((result) => this.handleSuccess(result))
      .catch((e) => this.handleError(e))
      .finally(() => {
        next(this, () => {
          this.saving = false;
        });
      });

      // .then((result) => {
      //   this.resolve(result);
      // })
      // .catch((e) => {
      //   if (e.jqXHR && e.jqXHR.responseText) {
      //     this.resolveStandardError(e.jqXHR.responseText);
      //   }
      // })
      // .finally(() => this.resolve({}));
  }

  handleSuccess(result) {
    if (result.success) {
      next(this, () => {
        this.icon = 'check';
        this.topic[`election_${this.name}`] = this.property;
      });
    } else {
      next(this, () => {
        this.icon = 'times';
      });
    }
  }

  handleError(e) {
    console.error('Error during save:', e);
    if (e.jqXHR && e.jqXHR.responseText) {
      this.resolveStandardError(e.jqXHR.responseText);
      alert(e.jqXHR.responseText);
    }
  }

  setPropertyValue(value) {
    next(this, () => {
      this.property = value;
    });
  }

}

