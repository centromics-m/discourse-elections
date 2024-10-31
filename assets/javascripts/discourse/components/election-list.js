import MountWidget from 'discourse/components/mount-widget';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ElectionList extends MountWidget {
  // 클래스 이름을 직접 정의
  classNames = ['election-list-container'];

  // category를 추적할 수 있도록 설정
  @tracked category;

  buildArgs() {
    return {
      category: this.category
    };
  }
}
