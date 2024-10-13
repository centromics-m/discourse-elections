import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
//import i18n from "discourse-common/helpers/i18n";

export default class TestComponent extends Component {
  @tracked showStatus;

  constructor() {
    super(...arguments);
  }

  get model() {
    return this.args.model; // Access model from the args
  }

  <template>
    category-navigation
  </template>
}
