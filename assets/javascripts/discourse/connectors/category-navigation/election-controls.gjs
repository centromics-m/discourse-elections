import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import i18n from "discourse-common/helpers/i18n";

import DButton from 'discourse/components/d-button';
import ElectionList from '../../components/election-list';
import CreateElectionModal from '../../components/modal/create-election';

export default class ElectionControlsComponent extends Component {
  @service currentUser;
  @service modal;

  @action
  createElection(categoryId) {
    this.modal.show(CreateElectionModal, {
      model: { categoryId },
    });
  }

  get isElectionsAdmin() {
    return this.currentUser?.is_elections_admin;
  }

  <template>
    {{#if this.args.category.for_elections}}
      {{#if this.isElectionsAdmin}}
        <DButton icon="plus" class="btn-default" @label={{i18n 'election.create.label'}}
            @action={{this.createElection}} @actionParam={{this.args.category.id}} />
      {{/if}}
      {{#if this.args.siteSettings.elections_nav_category_list}}
        <ElectionList @category={{this.args.category}} />
      {{/if}}
    {{/if}}
  </template>
}
