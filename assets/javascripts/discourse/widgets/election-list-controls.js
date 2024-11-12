// import showModal from "discourse/lib/show-modal";
// import { createWidget } from "discourse/widgets/widget";

// export default createWidget("election-list-controls", {
//   tagName: "div.election-list-controls",

//   html() {
//     const user = this.currentUser;
//     const links = [];

//     if (user?.is_elections_admin) {
//       links.push(
//         this.attach("link", {
//           icon: "plus",
//           label: "election.create.label",
//           action: "createElection",
//         })
//       );
//     }

//     return links;
//   },

//   createElection() {
//     showModal("create-election", {
//       model: {
//         categoryId: this.attrs.category.id,
//       },
//     });
//   },
// });
