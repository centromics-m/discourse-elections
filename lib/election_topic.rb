require_dependency "topic"
class ::Topic
  attr_accessor :election_status_changed, :election_status, :election_post
  after_save :handle_election_status_change, if: :election_status_changed

  attr_accessor :election_poll_current_stage_changed
  after_save :handle_election_poll_current_stage_change, if: :election_poll_current_stage_changed
  
  def election
    Topic.election_statuses.has_value? election_status
  end

  def election_post
    posts.find_by(post_number: 1)
  end

  def election_poll_enabled_stages
    self.custom_fields["election_poll_enabled_stages"]
  end 

  def election_poll_current_stage
    self.custom_fields["election_poll_current_stage"]
  end

  def election_status
    self.custom_fields["election_status"].to_i
  end

  def election_position
    self.custom_fields["election_position"]
  end

  def election_status_banner
    self.custom_fields["election_status_banner"]
  end

  def election_status_banner_result_hours
    self.custom_fields["election_status_banner_result_hours"].to_i
  end

  def election_poll_open
    self.custom_fields["election_poll_open"]
  end

  def election_poll_open_after
    self.custom_fields["election_poll_open_after"]
  end

  def election_poll_open_after_hours
    self.custom_fields["election_poll_open_after_hours"].to_i
  end

  def election_poll_open_after_nominations
    self.custom_fields["election_poll_open_after_nominations"].to_i
  end

  def election_poll_open_time
    self.custom_fields["election_poll_open_time"]
  end

  def election_poll_open_scheduled
    self.custom_fields["election_poll_open_scheduled"]
  end

  def election_poll_close
    self.custom_fields["election_poll_close"]
  end

  def election_poll_close_after
    self.custom_fields["election_poll_close_after"]
  end

  def election_poll_close_after_hours
    self.custom_fields["election_poll_close_after_hours"].to_i
  end

  def election_poll_close_after_voters
    self.custom_fields["election_poll_close_after_voters"].to_i
  end

  def election_poll_close_time
    self.custom_fields["election_poll_close_time"]
  end

  def election_poll_close_scheduled
    self.custom_fields["election_poll_close_scheduled"]
  end

  def election_poll_voters
    if polls = election_post.custom_fields["polls"]
      polls["poll"]["voters"].to_i
    else
      0
    end
  end

  def election_winner
    self.custom_fields["election_winner"]
  end

  def handle_election_status_change
    return unless SiteSetting.elections_enabled

    if election_status === Topic.election_statuses[:nomination]
      DiscourseElections::ElectionCategory.update_election_list(
        self.category_id,
        self.id,
        status: election_status
      )
      DiscourseElections::ElectionTime.cancel_scheduled_poll_close(self)
    end

    if election_status === Topic.election_statuses[:poll]
      DiscourseElections::ElectionPost.update_poll_status(self)
      DiscourseElections::ElectionCategory.update_election_list(self.category_id, self.id, status: election_status)
      DiscourseElections::Nomination.notify_nominees(self.id, "poll")
      DiscourseElections::ElectionTopic.notify_moderators(self.id, "poll")
      DiscourseElections::ElectionTime.set_poll_open_now(self)
      DiscourseElections::ElectionTime.cancel_scheduled_poll_open(self)
    end

    if election_status === Topic.election_statuses[:closed_poll]
      DiscourseElections::ElectionPost.update_poll_status(self)
      DiscourseElections::ElectionCategory.update_election_list(self.category_id, self.id, status: election_status)
      DiscourseElections::Nomination.notify_nominees(self.id, "closed_poll")
      DiscourseElections::ElectionTopic.notify_moderators(self.id, "closed_poll")
      DiscourseElections::ElectionTime.cancel_scheduled_poll_close(self)
    end

    DiscourseEvent.trigger(:election_status_changed, self, election_status)

    election_status_changed = false
  end

  def handle_election_poll_current_stage_change
    # TODO - implement
  end

  def election_nominations
    if custom_fields["election_nominations"]
      [*custom_fields["election_nominations"]]
    else
      []
    end
  end

  def election_nominations_usernames
    if custom_fields["election_nominations_usernames"]
      [*custom_fields["election_nominations_usernames"]]
    else      
      _election_nominations_usernames_from_users
    end
  end

  # users table에서 user_id를 통해 읽어와서 배열로 변환
  def _election_nominations_usernames_from_users
    if election_nominations.any?
      usernames = []
      election_nominations.each do |user_id|
        usernames.push([user_id, User.find(user_id).username]) if user_id.present? && user_id != 0
      end
      usernames.map do |user_id, username| 
        { user_id:, username:,  desscription: "" }
      end
    else
      []
    end
  end

  def election_self_nomination_allowed
    self.custom_fields["election_self_nomination_allowed"]
  end

  def election_nomination_statements
    if custom_fields["election_nomination_statements"]
      JSON.parse(custom_fields["election_nomination_statements"])
    else
      []
    end
  end

  def self.election_statuses
    @types ||= Enum.new(nomination: 1, poll: 2, closed_poll: 3)
  end
end

class DiscourseElections::ElectionTopic
  AVAILABLE_STAGES = %w(finding_answer finding_winner)

  def self.create(user, opts)
    title = opts[:title] || I18n.t("election.title", position: opts[:position].capitalize)
    topic = Topic.new(title: title, user: user, category_id: opts[:category_id])
    topic.subtype = "election"
    topic.skip_callbacks = true
    poll_open = ActiveModel::Type::Boolean.new.cast(opts[:poll_open])
    poll_close = ActiveModel::Type::Boolean.new.cast(opts[:poll_close])

    # etna
    opts[:poll_enabled_stages].split(',').map(&:strip).delete_if(&:blank?).each do |stage|
      unless AVAILABLE_STAGES.include?(stage)
        raise StandardError.new I18n.t("election.errors.invalid_poll_stage")
      end
    end
    opts[:poll_enabled_stages] = 'finding_answer' if opts[:poll_enabled_stages] == ''
    opts[:poll_current_stage] = opts[:poll_enabled_stages].split(',').map(&:strip).first if opts[:poll_current_stage].blank?

    custom_fields = {
      election_poll_enabled_stages: opts[:poll_enabled_stages],
      election_poll_current_stage: opts[:poll_current_stage],
      election_status: Topic.election_statuses[:nomination],
      election_position: opts[:position],
      election_self_nomination_allowed: ActiveModel::Type::Boolean.new.cast(opts[:self_nomination_allowed]),
      election_status_banner: ActiveModel::Type::Boolean.new.cast(opts[:status_banner]),
      election_poll_open: poll_open,
      election_poll_close: poll_close,
      election_nomination_message: opts[:nomination_message] || "",
      election_poll_message: opts[:poll_message] || "",
      election_closed_poll_message: opts[:closed_poll_message] || ""
    }

    
    pp '----------------------'
    pp opts 
    pp custom_fields
    pp '----------------------'
    

    topic.custom_fields = custom_fields

    if opts[:status_banner]
      topic.custom_fields["election_status_banner_result_hours"] = opts[
        :status_banner_result_hours
      ].to_i
    end

    if poll_open
      if topic.custom_fields["election_poll_open_after"] = ActiveModel::Type::Boolean.new.cast(opts[:poll_open_after])
        topic.custom_fields["election_poll_open_after_hours"] = opts[:poll_open_after_hours].to_i
        topic.custom_fields["election_poll_open_after_nominations"] = opts[:poll_open_after_nominations].to_i
      else
        topic.custom_fields["election_poll_open_time"] = opts[:poll_open_time]
      end
    end

    if poll_close
      if topic.custom_fields["election_poll_close_after"] = ActiveModel::Type::Boolean.new.cast(opts[:poll_close_after])
        topic.custom_fields["election_poll_close_after_hours"] = opts[:poll_close_after_hours].to_i
        topic.custom_fields["election_poll_close_after_voters"] = opts[:poll_close_after_voters].to_i
      else
        topic.custom_fields["election_poll_close_time"] = opts[:poll_close_time]
      end
    end

    pp '--------------------------------------------------------------------'
    topic.save!(validate: false)

    # NOTE:
    # 생성시에는 poll 은 저장하지 않음.

    if topic.election_poll_open && !topic.election_poll_open_after && topic.election_poll_open_time
      DiscourseElections::ElectionTime.schedule_poll_open(topic)
    end

    # 초기 메시지 "이 선거는 현재 후보 지명을 받고 있습니다." 를 출력하지 않음
    # 주석처리 -->
    raw = opts[:nomination_message]
    #raw = I18n.t("election.nomination.default_message") if raw.blank?

    manager = NewPostManager.new(Discourse.system_user, raw: raw, topic_id: topic.id, skip_validations: true)
    result = manager.perform

    DiscourseElections::ElectionCategory.update_election_list(topic.category_id, topic.id,
      status: topic.election_status
    )

    if result.success?
      { url: topic.relative_url }
    else
      { error_message: I18n.t("election.errors.create_failed") }
    end
  end

  def self.update(topic, opts)
    title = opts[:title] || I18n.t("election.title", position: opts[:position].capitalize)
    #topic = Topic.new(title: title, user: user, category_id: opts[:category_id])

    topic.subtype = "election"
    topic.skip_callbacks = true
    poll_open = ActiveModel::Type::Boolean.new.cast(opts[:poll_open])
    poll_close = ActiveModel::Type::Boolean.new.cast(opts[:poll_close])
    custom_fields = {
      election_status: Topic.election_statuses[:nomination],
      election_position: opts[:position],
      election_self_nomination_allowed: ActiveModel::Type::Boolean.new.cast(opts[:self_nomination_allowed]),
      election_status_banner: ActiveModel::Type::Boolean.new.cast(opts[:status_banner]),
      election_poll_open: poll_open,
      election_poll_close: poll_close,
      election_nomination_message: opts[:nomination_message] || "",
      election_poll_message: opts[:poll_message] || "",
      election_closed_poll_message: opts[:closed_poll_message] || ""
    }

    pp "################# custom_fields #{custom_fields}"

    topic.custom_fields = custom_fields

    if opts[:status_banner]
      topic.custom_fields["election_status_banner_result_hours"] = opts[:status_banner_result_hours].to_i
    end

    if poll_open
      if topic.custom_fields["election_poll_open_after"] = ActiveModel::Type::Boolean.new.cast(opts[:poll_open_after])
        topic.custom_fields["election_poll_open_after_hours"] = opts[:poll_open_after_hours].to_i
        topic.custom_fields["election_poll_open_after_nominations"] = opts[:poll_open_after_nominations].to_i
      else
        topic.custom_fields["election_poll_open_time"] = opts[:poll_open_time]
      end
    end

    if poll_close
      if topic.custom_fields["election_poll_close_after"] = ActiveModel::Type::Boolean.new.cast(opts[:poll_close_after])
        topic.custom_fields["election_poll_close_after_hours"] = opts[:poll_close_after_hours].to_i
        topic.custom_fields["election_poll_close_after_voters"] = opts[:poll_close_after_voters].to_i
      else
        topic.custom_fields["election_poll_close_time"] = opts[:poll_close_time]
      end
    end

    topic.save!(validate: false)

    if topic.election_poll_open && !topic.election_poll_open_after && topic.election_poll_open_time
      DiscourseElections::ElectionTime.schedule_poll_open(topic)
    end

    # 초기 메시지 "이 선거는 현재 후보 지명을 받고 있습니다." 를 출력하지 않음
    # 주석처리 -->
    # raw = opts[:nomination_message]
    # raw = I18n.t("election.nomination.default_message") if raw.blank?

    # manager = NewPostManager.new(Discourse.system_user, raw: raw, topic_id: topic.id, skip_validations: true)
    # result = manager.perform

    DiscourseElections::ElectionCategory.update_election_list(topic.category_id, topic.id, status: topic.election_status)


    ###################################
    # poll 정보 수정
    # NOTE: poll 은 post 에 저장되어 있으나, election poll의 경우, 현재 topic당 1개만 허용하기 때문에 그냥 topic의 custom_field에 저장함.

    # etna
    #JSON.parse(opts)
    # {"pollType":"regular","pollResult":"always","publicPoll":true,"pollTitle":"","pollMin":1,"pollMax":2,"pollStep":1,"score":100,"chartType":"bar","pollDataLinks":[{"url":"","title":"","content":""}],"name":"poll","pollOutput":"[poll type=regular results=always public=true chartType=bar score=100]\n* ㅁㄴㅇㄹ\n* ㅁㄴㅇㄻ\n* ㅁㄴㅇㄻㅇㄹ\n[/poll]\n[poll_data_link]\n\n[/poll_data_link]\n"}
    #pp "################################# " + opts['content']
    content_parsed = JSON.parse(opts['content'])

    election_post = topic.election_post
    old_content = election_post.raw

    new_content = ''
    if old_content.blank? || old_content !~ %r{\[\/poll\]}
      new_content += content_parsed['pollOutput']
    else
      # TODO: poll 이 여러개일 경우?
      #new_content = election_post.raw.gsub(%r{(\[poll\s.*\[\/poll\])}m, content_parsed['pollOutput'])
      new_content = election_post.raw.gsub(%r{(\[poll\s.*\[\/poll_data_link\])}m, content_parsed['pollOutput'])
    end

    result2 = DiscourseElections::ElectionPost.update_election_post(topic, new_content)
    #pp "##########result2 #{result2}"
    # if result2.success?
    #   { url: topic.relative_url }
    # else
    #   { error_message: I18n.t("election.errors.create_failed") }
    # end
    ###################################

    #if result.success?
      { url: topic.relative_url }
    # else
    #   { error_message: I18n.t("election.errors.create_failed") }
    # end
  end

  # def self.set_content(topic_id, content)
  #   topic = Topic.find(topic_id)
  #   #current_status = topic.election_status

  #   # saved = false
  #   # TopicCustomField.transaction do
  #   #   topic.custom_fields["election_status"] = status
  #   #   topic.election_status_changed = status != current_status
  #   #   saved = topic.save! ## need to save whole topic here as it triggers status change handlers - see 'handle_election_status_change' above

  #   #   if saved && status != current_status
  #   #     DiscourseElections::ElectionPost.rebuild_election_post(topic, unattended)
  #   #   end
  #   # end

  #   # if !saved || topic.election_post.errors.any?
  #   #   raise StandardError.new I18n.t("election.errors.set_status_failed")
  #   # end

  #   # topic.election_status

  #   DiscourseElections::ElectionPost.update_election_post(topic, content)
  # end

  
  def self.set_election_poll_current_stage(topic_id, poll_current_stage)
    topic = Topic.find(topic_id)
    existing_poll_current_stage = topic.election_poll_current_stage

    saved = false
    TopicCustomField.transaction do
      topic.custom_fields["election_poll_current_stage"] = poll_current_stage
      topic.election_poll_current_stage_changed = existing_poll_current_stage != poll_current_stage
      saved = topic.save! ## need to save whole topic here as it triggers status change handlers - see 'handle_election_status_change' above

      # if saved && existing_poll_current_stage != poll_current_stage
      #   DiscourseElections::ElectionPost.rebuild_election_post(topic, unattended)
      # end
    end

    # if !saved || topic.election_post.errors.any?
    #   raise StandardError.new I18n.t("election.errors.set_status_failed")
    # end

    topic.election_poll_current_stage
  end

  def self.set_status(topic_id, status, unattended = false)
    topic = Topic.find(topic_id)
    current_status = topic.election_status

    saved = false
    TopicCustomField.transaction do
      topic.custom_fields["election_status"] = status
      topic.election_status_changed = status != current_status
      saved = topic.save! ## need to save whole topic here as it triggers status change handlers - see 'handle_election_status_change' above

      if saved && status != current_status
        DiscourseElections::ElectionPost.rebuild_election_post(topic, unattended)
      end
    end

    if !saved || topic.election_post.errors.any?
      raise StandardError.new I18n.t("election.errors.set_status_failed")
    end

    topic.election_status
  end

  def self.set_message(topic_id, message, type, same_message = nil)
    topic = Topic.find(topic_id)

    saved = false
    TopicCustomField.transaction do
      topic.custom_fields["election_#{type}_message"] = message
      saved = topic.save_custom_fields(true)

      if saved && topic.election_status == Topic.election_statuses[type.to_sym]
        DiscourseElections::ElectionPost.rebuild_election_post(topic)
      end
    end

    if !saved || (topic.election_post && topic.election_post.errors.any?)
      raise StandardError.new I18n.t("election.errors.set_message_failed")
    end

    topic.custom_fields["election_#{type}_message"]
  end

  def self.set_position(topic_id, position)
    topic = Topic.find(topic_id)
    topic.title = I18n.t("election.title", position: position)
    topic.custom_fields["election_position"] = position
    saved = topic.save!

    self.refresh(topic_id) if saved

    saved
  end

  def self.set_winner(topic_id, username)
    topic = Topic.find(topic_id)
    result = nil

    TopicCustomField.transaction do
      topic.custom_fields["election_winner"] = username

      if topic.save_custom_fields(true)
        result = DiscourseElections::ElectionPost.rebuild_election_post(topic)
      end
    end

    if result
      winner = topic.election_winner

      { winner: winner, success: true }
    else
      { failed: true }
    end
  end

  def self.notify_moderators(topic_id, type)
    Jobs.cancel_scheduled_job(:election_notify_moderators, topic_id: topic_id, type: "poll")
    Jobs.cancel_scheduled_job(:election_notify_moderators, topic_id: topic_id, type: "closed_poll")
    Jobs.enqueue_in(1.hour, :election_notify_moderators, topic_id: topic_id, type: type)
  end

  def self.refresh(topic_id)
    MessageBus.publish("/topic/#{topic_id}", reload_topic: true, refresh_stream: true)
  end

  def self.moderators(topic_id)
    topic = Topic.find(topic_id)
    moderators = User.where(moderator: true).human_users
    category_moderators =
      moderators.select do |u|
        u.custom_fields["moderator_category_id"].to_i === topic.category_id.to_i
      end

    if category_moderators.any?
      category_moderators
    else
      moderators.select { |u| u.custom_fields["moderator_category_id"].blank? }
    end
  end
end
