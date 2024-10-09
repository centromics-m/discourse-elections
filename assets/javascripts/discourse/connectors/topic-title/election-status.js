import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class ElectionStatusComponent extends Component {
  @tracked showStatus = this.args.model.subtype === 'election';
}

// export default {
//   setupComponent(args, component) {
//     component.set('showStatus', args.model.subtype === 'election');
//   }
// };
