import Component from "@glimmer/component";

export default class ElectionStatusComponent extends Component {
  get showStatus() {
    console.log("ElectionStatusComponent: stages", this.model);
    return this.model.subtype === "election";
    // && this.model.election_poll_current_stage == 'finding_winner';
  }

  get currentStage() {
    return this.model.election_poll_current_stage;
  }

  get currentStage_FindingWinner() {
    return this.currentStage == "finding_winner";
  }

  get model() {
    return this.args.outletArgs.model; // Access model from the args
  }
}
