import { action, computed } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import UserChooser from "select-kit/components/user-chooser";

export default UserChooser.extend({
  // 새 기능을 위한 속성 추가
  //@tracked
  additionalProperty: "Custom Value",

  // 기존 메서드 오버라이드 예시: content 속성을 재정의
  content: computed("value.[]", function () {
    const originalContent = this._super(...arguments); // 부모 메서드 호출
    return originalContent.map((item) => ({
      ...item,
      label: `${item.username} (enhanced)`,
    }));
  }),

  // 새로운 메서드 추가
  //@action
  customAction() {
    console.log("Executing custom action with:", this.additionalProperty);
  },

  // 기존 메서드 오버라이드: search 기능 수정
  search(filter = "") {
    console.log("Custom search invoked with:", filter);
    // 부모 컴포넌트의 search 메서드 호출
    return this._super(...arguments).then((results) => {
      // 결과를 수정하거나 필터링
      if(filter === "")
        return results;
      else
        return results.filter((user) => !user.username.startsWith(filter));
    });
  },
});
