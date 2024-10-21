import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class UserSelectorComponent extends Component {
  @tracked selectedUsernames = [];

  get usernamesArray() {
    return this.args.usernames?.split(',').map((name) => name.trim()) || [];
  }
}
