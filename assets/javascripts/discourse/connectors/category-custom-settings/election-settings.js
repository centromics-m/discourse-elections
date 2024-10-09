import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ElectionSettingsComponent extends Component {
  constructor() {
    super(...arguments);
    this.setupComponent(this.args);
  }

  setupComponent(attrs) {
    if (!attrs.category.custom_fields) {
      attrs.category.custom_fields = {};
    }
  }
}

// export default {
//   setupComponent(attrs) {
//     if (!attrs.category.custom_fields) {
//       attrs.category.custom_fields = {};
//     }
//   }
// };

