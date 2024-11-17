// moved to components/election-list.js

// import { h } from "virtual-dom";
// import { ajax } from "discourse/lib/ajax";
// import { createWidget } from "discourse/widgets/widget";

// export default createWidget("election-list", {
//   tagName: "div.election-list",
//   buildKey: () => "election-list",

//   defaultState() {
//     return {
//       elections: [],
//       loading: true,
//     };
//   },

//   getElections() {
//     const { category } = this.attrs;

//     if (!category) {
//       this.setState({ loading: false });
//       return;
//     }

//     ajax(`/election/category-list`, { data: { category_id: category.id } })
//       .then((elections) => {
//         this.setState({ elections, loading: false });
//       })
//       .catch(() => {
//         // Handle error if necessary
//         this.setState({ loading: false });
//       });
//   },

//   html(attrs, state) {
//     const { elections, loading } = state;
//     const contents = [h("span", `${I18n.t("election.list.label")}: `)];

//     if (loading) {
//       this.getElections();
//     } else if (elections.length > 0) {
//       contents.push(
//         h(
//           "ul",
//           elections.map((e, i) => {
//             const item = [];

//             if (i > 0) {
//               item.push(h("span", ", "));
//             }

//             item.push(h("a", { href: e.relative_url }, h("span", e.position)));

//             return h("li", item);
//           })
//         )
//       );
//     }

//     return contents;
//   },
// });
