import Component from "@glimmer/component";

export default class ElectionStatusComponent extends Component {
  get showStatus() {
    //console.log("this.model.subtype", this.model.subtype);
    return this.model.subtype === "election";
  }

  get model() {
    return this.args.outletArgs.model; // Access model from the args
  }
}
