import Component from '@glimmer/component';

export default class ElectionStatusComponent extends Component {
  get showStatus() {
    return this.model.subtype === 'election';
  }

  get model() {
    return this.args.outletArgs.model; // Access model from the args
  }
}
