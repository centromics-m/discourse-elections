import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action, computed } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import Category from "discourse/models/category";
import DButton from "discourse/components/d-button";

export default class ConfirmNorminationModal extends Component {
	@tracked loading = false;

	constructor() {
		super(...arguments);
		this.setup();
	}

	setup() {
		const model = this.args.model;

		if (model) {
			console.log('model', model);
		}
	}

	get model() {
		return this.args.model.model;
	}

	@computed("model.topic.election_is_nominee")
	get prefix() {
		const isNominee = this.model.topic.election_is_nominee;
		return `election.nomination.${isNominee ? "remove" : "add"}.`;
	}

	@computed("model.topic.category_id")
	get categoryName() {
		const categoryId = this.model.topic.category_id;
		return Category.findById(categoryId)?.name; // Optional chaining to prevent errors
	}

	@action
	toggleNomination() {
		//this.args.toggleNomination();
		this._toggleNomination();
	}

	async _toggleNomination() {
		const topicId = this.model.topic.id;
		const isNominee = this.model.topic.election_is_nominee;
		const type = isNominee ? "DELETE" : "POST";

		this.loading = true;

		try {
			const result = await ajax("/election/nomination", {
				type,
				data: { topic_id: topicId },
			});

			if (result.failed) {
				this.flash(result.message, "error");
			} else {
				const user = this.currentUser;
				let nominations = this.model.topic.election_nominations;
				let usernames = this.model.topic.election_nominations_usernames;

				if (isNominee) {
					usernames.splice(usernames.indexOf(user.username), 1);
					nominations.splice(nominations.indexOf(user.id), 1);
				} else {
					usernames.push(user.username);
					nominations.push(user.id);
				}

				this.set("model.topic.election_nominations_usernames", usernames);
				this.set("model.topic.election_nominations", nominations);
				this.set("model.topic.election_is_nominee", !isNominee);
				this.model.rerender();
				this.send("closeModal");
			}

		} catch (e) {
			if (e.jqXHR && e.jqXHR.responseText) {
				const responseText = e.jqXHR.responseText;
				// const message = responseText.substring(
				//   responseText.indexOf(">") + 1,
				//   responseText.indexOf("plugins")
				// );
				// bootbox.alert(message);
				alert(responseText);
			}
		} finally {
			this.loading = false;
		}
	}

}
