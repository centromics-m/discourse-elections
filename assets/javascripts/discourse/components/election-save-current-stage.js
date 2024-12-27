import { tracked } from "@glimmer/tracking";
import Component from "@ember/component";
import { action, computed, get, set } from "@ember/object";
import { next } from "@ember/runloop";
import { dasherize } from "@ember/string";
import DButton from "discourse/components/d-button";
import { ajax } from "discourse/lib/ajax";
import ElectionSave from "./election-save";

/*
  <ElectionSaveCurrentStage
    @property={{this.pollCurrentStage}}
    @name="poll_current_stage"
    @topic={{this.topic}} @error="error" @saved="saved" />
*/

export default class ElectionSaveCurrentStageComponent extends ElectionSave {
  layoutName = "components/election-save";

  @action
  save() {
    let original = undefined;
    if (this.topic) {
      original = this.topic[`election_${this.name}`];
      if (this.property === 'finding_answer' && original === 'finding_winner') {
        if (!confirm('finding_winner에서 finding_answer로 모드를 바꾸면 ' +
          '기존에 생성된 election_poll의 투표결과가 초기화됩니다. 계속하겠습니까?')) {
          return;
        }
      }
    }

    super.save();
  }
}
