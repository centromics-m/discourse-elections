import Component from '@glimmer/component';
import { action } from '@ember/object';
import showModal from 'discourse/lib/show-modal';

export default class ElectionControlsComponent extends Component {
  @action
  createElection(categoryId) {
    showModal('create-election', { model: { categoryId } });
  }
}

// import showModal from 'discourse/lib/show-modal';

// export default {
//   actions: {
//     createElection(categoryId) {
//       showModal('create-election', { model: { categoryId }});
//     }
//   }
// };
