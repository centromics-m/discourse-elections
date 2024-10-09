import Component from '@ember/component';
//import { computed } from '@ember-decorators/object';
import { computed } from "@ember/object";

export default class StatementComposerLabelComponent extends Component {
  @computed('model.isNominationStatement')
  get isNominationStatement() {
    return this.model.isNominationStatement;
  }
}
