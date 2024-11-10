import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import MountWidget from "discourse/components/mount-widget";

export default class ElectionList extends MountWidget {
  // category를 추적할 수 있도록 설정
  @tracked category;
  // 클래스 이름을 직접 정의
  classNames = ["election-list-container"];

  buildArgs() {
    return {
      category: this.category,
    };
  }
}
