PostRevisor.track_topic_field(:election_nomination_statement)

NewPostManager.add_handler do |manager|
  if SiteSetting.elections_enabled && manager.args[:topic_id]
    topic = Topic.find(manager.args[:topic_id])

    # do nothing if first post in topic
    if topic.subtype === 'election' && topic.try(:highest_post_number) != 0
      extracted_polls = DiscoursePoll::Poll.extract(manager.args[:raw], manager.args[:topic_id], manager.user[:id])

      unless extracted_polls.empty?
        result = NewPostResult.new(:poll, false)
        result.errors[:base] = I18n.t('election.errors.seperate_poll')
        result
      end
    end
  end
end

require_dependency 'post'
class ::Post
  def election_nomination_statement
    if self.custom_fields['election_nomination_statement'] != nil
      self.custom_fields['election_nomination_statement']
    else
      false
    end
  end
end

require_dependency 'post_custom_field'
class ::PostCustomField
  after_save :update_election_status, if: :polls_updated

  def polls_updated
    name == 'polls'
  end

  def update_election_status
    return unless SiteSetting.elections_enabled

    poll = JSON.parse(value)['poll']
    post = Post.find(post_id)
    new_status = nil

    if poll['status'] == 'closed' && post.topic.election_status == Topic.election_statuses[:poll]
      new_status = Topic.election_statuses[:closed_poll]
    end

    if poll['status'] == 'open' && post.topic.election_status == Topic.election_statuses[:closed_poll]
      new_status = Topic.election_statuses[:poll]
    end

    if new_status
      result = DiscourseElections::ElectionTopic.set_status(post.topic_id, new_status)

      if result
        DiscourseElections::ElectionTopic.refresh(post.topic.id)
      end
    end
  end
end

require_dependency 'new_post_manager'
require_dependency 'post_creator'
class DiscourseElections::ElectionPost
  def self.update_poll_status(topic)
    post = topic.first_post
    if post.custom_fields['polls'].present?
      status = topic.election_status == Topic.election_statuses[:closed_poll] ? 'closed' : 'open'
      DiscoursePoll::Poll.toggle_status(post.id, "poll", status, topic.user)
    end
  end

  def self.rebuild_election_post(topic, unattended = false)
    topic.reload
    status = topic.election_status

    content = ""

    if topic.election_poll_current_stage == 'finding_winner'      
      if topic.election_winner.present?
        user = User.find_by(username: topic.election_winner)
        content << "<div class='title'>#{I18n.t('election.post.winner')}</div>"
        content << build_winner(user)
        content << "\n\n"
      end

      if status == Topic.election_statuses[:nomination]
        build_nominations(content, topic, unattended)
      else
        build_poll__winner(content, topic, unattended)
      end
    
    else # finding_answer
      if content.blank?
        content = "<p class='poll_msg'>PollUiBuilder를 열어서 poll 내용을 구성해주세요.\n\n</p>"
      end
      build_poll__default(content, topic, unattended)
    end
  end

  private


# [poll type=regular results=always public=true chartType=bar score=100]
# * poll1
# * poll2 [correct]
# * poll3
# [/poll]
# [poll_data_link]

# [/poll_data_link]

  def self.build_poll__default(content, topic, unattended)
    nominations = topic.election_nominations
    status = topic.election_status

    return if nominations.length < 2

    poll_status = ''

    if status === Topic.election_statuses[:poll]
      poll_status = 'open'
    else
      poll_status = 'closed'
    end

    poll_options = ''

    content << "[poll type=regular status=#{poll_status}]#{poll_options}\n[/poll]"

    message = nil
    if status === Topic.election_statuses[:poll]
      message = topic.custom_fields['election_poll_message']
    else
      message = topic.custom_fields['election_closed_poll_message']
    end

    if message
      content << "\n\n #{message}"
    end

    revisor_opts = {  }
    update_election_post(topic, content, unattended, revisor_opts, content_type: 'finding_answer')
  end
  
  def self.build_poll__winner(content, topic, unattended)
    nominations = topic.election_nominations
    status = topic.election_status

    return if nominations.length < 2

    poll_status = ''

    if status === Topic.election_statuses[:poll]
      poll_status = 'open'
    else
      poll_status = 'closed'
    end

    poll_options = ''

    nominations.each do |n|
      # Nominee username is added as a placeholder. Without the username,
      # the 'content' of the token in discourse-markdown/poll is blank
      # which leads to the md5Hash being identical for each option.
      # the username placeholder is removed on the client before render.

      user = User.find(n)
      poll_options << "\n- #{user.username}"
      poll_options << build_nominee(topic, user)
    end

    content << "[poll type=regular status=#{poll_status}]#{poll_options}\n[/poll]"

    message = nil
    if status === Topic.election_statuses[:poll]
      message = topic.custom_fields['election_poll_message']
    else
      message = topic.custom_fields['election_closed_poll_message']
    end

    if message
      content << "\n\n #{message}"
    end

    revisor_opts = {  }
    update_election_post(topic, content, unattended, revisor_opts, content_type: 'finding_winner')
  end


  def self.build_nominations(content, topic, unattended)
    nominations = topic.election_nominations

    if nominations.any?
      content << "<div class='title'>#{I18n.t('election.post.nominated')}</div>"

      content << "<div class='nomination-list'>"

      nominations.each do |n|
        user = User.find(n)
        content << build_nominee(topic, user)
      end

      content << "</div>"
    end

    message = topic.custom_fields['election_nomination_message']

    if message.blank?
      message = I18n.t('election.nomination.default_message')
    end

    content << "\n\n #{message}"

    revisor_opts = { skip_validations: true }

    update_election_post(topic, content, unattended, revisor_opts, content_type: 'finding_winner')
  end

  def self.build_winner(user)
    avatar_url = user&.avatar_template_url&.gsub("{size}", "50") || ""

    html = "<div class='winner'><span>"

    html << "<div class='winner-user'>"
    html << "<div class='trigger-user-card' href='/u/#{user.username}' data-user-card='#{user.username}'>"
    html << "<img alt='' width='25' height='25' src='#{avatar_url}' class='avatar'>"
    html << "<a class='mention'>@#{user.username}</a>"
    html << "</div>"
    html << "</div>"

    html << "</span></div>"

    html
  end

  def self.build_nominee(topic, user)
    nomination_statements = topic.election_nomination_statements
    avatar_url = user&.avatar_template_url&.gsub("{size}", "50") || ""

    html = "<div class='nomination'><span>"

    html << "<div class='nomination-user'>"
    html << "<div class='trigger-user-card' href='/u/#{user.username}' data-user-card='#{user.username}'>"
    html << "<img alt='' width='25' height='25' src='#{avatar_url}' class='avatar'>"
    html << "<a class='mention'>@#{user.username}</a>"
    html << "</div>"
    html << "</div>"

    html << "<div class='nomination-statement'>"
    statement = nomination_statements.find { |s| s['user_id'] == user.id }
    if statement
      post = Post.find(statement['post_id'])
      html << "<a href='#{post.url}'>#{statement['excerpt']}</a>"
    end
    html << "</div>"

    html << "</span></div>"

    html
  end  

  # content_type: 'finding_answer' or 'finding_winner'
  def self.update_election_post(topic, content, unattended = false, revisor_opts = {}, content_type: 'finding_answer')
    election_post = topic.election_post

    pp "###################1" + election_post.raw
    pp "###################2" + content

    return if !election_post || election_post.raw == content

    revisor = PostRevisor.new(election_post, topic)

    ## We always skip the revision as these are system edits to a single post.
    revisor_opts.merge!(skip_revision: true)

    pp "###################3 content: " + content
    pp "###################4 revisor_opts:" + revisor_opts.to_s

    content_raw = election_post.raw

    if content_type == 'finding_answer'
      # content2 = content_raw.gsub(%r{<!--POLL_DEFAULT-->.*<!--\/POLL_DEFAULT-->}m, '')
      # pp "------------------------1 #{content2}-----------------------"
      # content2 = "<!--POLL_DEFAULT-->\n" + content + "\n<!--/POLL_DEFAULT-->\n" + content2
      content2 = "<!--POLL_DEFAULT-->\n" + content + "\n<!--/POLL_DEFAULT-->\n"

    else
      content2 = content_raw.gsub(%r{<!--POLL_ELECTION-->.*<!--\/POLL_ELECTION-->}m, '')      
      pp "------------------------2 #{content2}------------------------"
      content2 = content2 + "\n<!--POLL_ELECTION-->\n" + content + "\n<!--/POLL_ELECTION-->\n"
    end
    pp "###################4 content2:" + content2

    revise_result = revisor.revise!(election_post.user, { raw: content2 }, revisor_opts)
  
    if election_post.errors.any?
      if unattended
        message_moderators(topic.id, election_post.errors.messages.to_s)
      else
        #raise ::ActiveRecord::Rollback
        raise ::ActiveRecord::Rollback.new(election_post.errors.full_messages.join(", "))
        #raise election_post.errors.full_messages.join(", ")
      end
    end

    if !revise_result
      if unattended
        message_moderators(topic.id, I18n.t("election.errors.revisor_failed"))
      else
        election_post.errors.add(:base, I18n.t("election.errors.revisor_failed"))

        #raise ::ActiveRecord::Rollback
        raise ::ActiveRecord::Rollback.new(election_post.errors.full_messages.join(", "))
        #raise election_post.errors.full_messages.join(", ")
      end
    end

    { success: true }
  end

  def self.message_moderators(topic_id, error)
    DiscourseElections::ElectionTopic.moderators(topic_id).each do |user|
      SystemMessage.create_from_system_user(user, :error_updating_election_post,
        topic_id: topic_id, error: error)
    end
  end
end

DiscourseEvent.on(:post_created) do |post, opts, user|
  if SiteSetting.elections_enabled && opts[:election_nomination_statement] && post.topic.election_nominations.include?(user.id)
    post.custom_fields['election_nomination_statement'] = opts[:election_nomination_statement]
    post.save_custom_fields(true)

    DiscourseElections::NominationStatement.update(post)
  end
end

DiscourseEvent.on(:post_edited) do |post, _topic_changed|
  user = User.find(post.user_id)
  if SiteSetting.elections_enabled && post.custom_fields['election_nomination_statement'] && post.topic.election_nominations.include?(user.id)
    DiscourseElections::NominationStatement.update(post)
  end
end

DiscourseEvent.on(:post_destroyed) do |post, _opts, user|
  if SiteSetting.elections_enabled && post.custom_fields['election_nomination_statement'] && post.topic.election_nominations.include?(user.id)
    DiscourseElections::NominationStatement.update(post)
  end
end

DiscourseEvent.on(:post_recovered) do |post, _opts, user|
  if SiteSetting.elections_enabled && post.custom_fields['election_nomination_statement'] && post.topic.election_nominations.include?(user.id)
    DiscourseElections::NominationStatement.update(post)
  end
end
