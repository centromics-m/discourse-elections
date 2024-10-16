// import Component from '@glimmer/component';
// import { tracked } from '@glimmer/tracking';
// import { action } from '@ember/object';

// export default class ElectionSettingsComponent extends Component {
//   @tracked forElection = false;

//   // 라이프사이클 훅을 사용해 인자를 초기화
//   willRender() {
//     this.setupComponent(this.args);
//   }

//   setupComponent(attrs) {
//     if (attrs.category && !attrs.category.custom_fields) {
//       attrs.category.custom_fields = {};
//     }
//     // 기존 값이 있으면 상태 초기화
//     this.forElection = attrs.category.custom_fields.for_election || false;
//   }

//   @action
//   toggleForElection(event) {
//     this.forElection = event.target.checked;
//     this.args.category.custom_fields.for_election = this.forElection;
//   }
// }

export default {
  setupComponent(attrs) {
    if (!attrs.category.custom_fields) {
      attrs.category.custom_fields = {
        for_election: false
      };
    }
  }
};

