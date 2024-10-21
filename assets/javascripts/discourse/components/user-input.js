import EmberObject, { computed } from "@ember/object";
import { mapBy } from "@ember/object/computed";
import Category from "discourse/models/category";
import { makeArray } from "discourse-common/lib/helpers";
import CategoryRow from "select-kit/components/category-row";
import MultiSelectComponent from "select-kit/components/multi-select";

import User from "discourse/models/user";
import { ajax } from 'discourse/lib/ajax';

/*
  <UserSelector @usernames={{this.usernames}} @onChange={{this.handleUserChange}} />

  <UserSelector
    @usernames={{this.usernames}}
    @onChange={{this.onInput}}
    @options={{hash allowUncategorized=false maximum=this.max}}
  />
*/
export default MultiSelectComponent.extend({
  pluginApiIdentifiers: ["user-selector"],
  classNames: ["user-selector"],
  users: null,
  usernames: null, // paramenter
  selectedUsernames: [],
  blockedUsers: null,
  //searchResultCache: null,

  selectKitOptions: {
    filterable: true,
    allowAny: false,
    // allowUncategorized: true,
    // displayCategoryDescription: false,
    selectedChoiceComponent: "selected-choice-category",
  },

  init() {
    this._super(...arguments);

    if (!this.blockedUsers) {
      this.set("blockedUsers", []);
    }

    if (!this.users) {
      this.set("users", []);
    }
  },

  // 사용자를 필터링한 결과를 content에 매핑
  content: computed("users.[]", "blockedUsers.[]", function () {
    // return (this.users || []).filter(
    //   (user) => !this.blockedUsers.includes(user)
    // );
    return this.users;
  }),

  usernamesArray: computed("usernames", function () {
    return this.usernames?.split(',').map((name) => name.trim()) || [];
  }),

  value: mapBy("users", "id"),

  modifyComponentForRow() {
    return UserRow;
  },

  // 검색 메서드 수정: userSearch 사용
  async search(filter) {
    filter = filter?.trim().replace(/^@/, "") || "";

    if (!filter) return []; // 필터가 없으면 검색 중단

    try {
      const result = await userSearch({ term: filter }); // 사용자 검색

      const users = Array.isArray(result) ? result : result.users || [];

      // {:users=>
      //   [{:id=>1, :username=>"damulkan", :name=>nil, :avatar_template=>"/user_avatar/localhost/damulkan/{size}/19_2.png"},
      //    {:id=>2, :username=>"damulhan", :name=>"etna", :avatar_template=>"/user_avatar/localhost/damulhan/{size}/11_2.png"}]}

      // 차단된 사용자와 이미 선택된 사용자 필터링
      // return users.filter(
      //   (user) => !this.blockedUsers.includes(user) && !(this.users || []).includes(user.username)
      // );

      //this.searchResultCache = users;

      return users;

    } catch (error) {
      console.error("User search failed:", error);
      return [];
    }
  },

  async select(value, item) {
    console.log('select', value, item);
    //this._super(value, item); // 부모 메서드 호출로 선택 동작 유지
  },

  actions: {
    onChange(values) {
      console.log("Selected Values:", values);

      // Ensure values are mapped correctly to users.
      const selectedUsers = values.map(async (id) => {
        //this.users.find((user) => String(user.id) === String(id))
        //this.searchResultCache((user) => String(user.id) === String(id))
        //await userSearch({ term: filter }); // 사용자 검색
        //User.findByIds('id', values)
        let user = null;
        if(id) {
          user = await ajax(`/admin/users/${id}.json`).then((response) => {
            //console.log("Fetched User via API:", response.user);
            return response.user;
          });
        }
        return user;
      }).filter(Boolean);  // Filter out any null results.
      //const selectedUsers = User.findByIds('id', values);

      console.log("Selected Users:", selectedUsers);

      // Update component state.
      this.set('users', selectedUsers);
      this.set('usernames', selectedUsers.map((user) => user.username).join(', '));

      console.log("Usernames String:", this.usernames);
      console.log('this.onChange:', this.onChange);

      // Call parent onChange action if provided.
      if (typeof this.onChange === 'function') {
        this.onChange(selectedUsers.map((user) => user.username));
      } else {
        console.error('onChange is not a function');
      }

      return true;
    },
  },

});
