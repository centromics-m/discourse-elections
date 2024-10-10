import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import i18n from "discourse-common/helpers/i18n";

export default class ElectionStatusComponent extends Component {
  @tracked showStatus;

  constructor() {
    super(...arguments);
    //console.log('ElectionStatusComponent this.args', this.args.keys);
    console.log('ElectionStatusComponent arguments', arguments);
    console.log('ElectionStatusComponent model', this.args.model);
    console.log('ElectionStatusComponent topic', this.args.model?.topic);

    //console.log('this.args.model?.subtype', this.args.model?.subtype);
    this.showStatus = this.args.model?.subtype === 'election';
  }

  get model() {
    return this.args.model; // Access model from the args
  }

  <template>
    {{#if this.showStatus}}
      <div class="election-status-label">
        <span>{{i18n (concat 'election.status.' this.model.electionStatusName)}}</span>
      </div>
      <election-time-status topic={{this.model}} />
    {{/if}}
  </template>
}
