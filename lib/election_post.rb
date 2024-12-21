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

    contents = {
      default: nil,
      finding_answer: build_content_for_finding_answer(topic, status, unattended),
      finding_winner: build_content_for_finding_winner(topic, status, unattended)
    }
    
    if contents[:finding_answer].blank? && contents[:finding_winner].blank?
      content[:default] = "<p class='poll_msg'>제대로 입력이 안되고 있으면, 옵션을 체크해주세요.</p>"
    end

    revisor_opts = {}
    update_election_post(topic, contents, unattended, revisor_opts, target_stage: topic.election_poll_current_stage, status: status)
  end

  def self.build_content_for_finding_answer(topic, status, unattended = false)
    content = ''

    # finding_answer    
    if topic.election_poll_enabled_stages.include?('finding_answer')
      if content.blank?
        content = "<p class='poll_msg'>PollUiBuilder를 열어서 poll 내용을 구성해주세요.\n\n</p>"
      end
      content = build_poll__default(content, topic, unattended)      
    end

    content
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
    #nominations = topic.election_nominations
    status = topic.election_status

    #return if nominations.length < 2

    # poll_status = ''

    # if status === Topic.election_statuses[:poll]
    #   poll_status = 'open'
    # else
    #   poll_status = 'closed'
    # end

    # poll_options = _build_poll_markups(topic)

    # if poll_options.present?
    #   content << "\n[poll type=regular status=#{poll_status} _generator=default]#{poll_options}\n[/poll]"
    # end

    poll_markups = _build_poll_markups(topic)
    if poll_markups.present?
      content << "\n#{poll_markups}"
    end

    message = nil
    if status === Topic.election_statuses[:poll]
      message = topic.custom_fields['election_poll_message']
    else
      message = topic.custom_fields['election_closed_poll_message']
    end

    if message
      content << "\n\n<div class='poll_msg'>#{message}</div>\n\n"
    end

    content
  end

  def self._build_poll_markups(topic)
    posts = topic.posts

    content = ''
    posts.each do |post|
      post.polls.each do |poll|
        content << _build_poll_markup_for_poll(poll, 'default')
      end
    end

    content
  end

  def self._build_poll_markup_for_poll(poll, _generator='default')
    attrs = %w[type status results visibility min max steps chart_type score]
    attrs_strs = []
    attrs.each do |attr|
      attrs_strs << "#{attr}='#{poll[attr]}'" if poll[attr].present?
    end

    content = ''
    poll_hd = "[poll #{attrs_strs.join(' ')} _generator=#{_generator}]\n"
    poll.poll_options.each do |option|
      if option['correct']
        content << "* #{option['html']} [correct]\n"
      else
        content << "* #{option['html']}\n"
      end
    end
    poll_tl = "[/poll]\n"

    content2 = ''
    poll.poll_data_links.each do |link|
      content2 << "[poll_data_link]\n"
      if link['url'].present?
        content2 << "[#{link.title}](#{link.url})\n"
      end
      if link.content.present?
        content2 << "#{link.content}\n"
      end
      content2 << "[/poll_data_link]\n"
    end

    poll_content = poll_hd + content + poll_tl + content2

    poll_content
  end

  def self.get_user_description(topic, username)
    nominations_usernames = topic.election_nominations_usernames

    pp "################### #{nominations_usernames}"

    nominations_usernames.each do |n|
      if n['username'] == username
        return n['description']
      end
    end

    ''
  end

  def self.build_content_for_finding_winner(topic, status, unattended = false)
    content = ''

    # finding_winner
    if topic.election_poll_enabled_stages.include?('finding_winner') && topic.election_poll_current_stage == 'finding_winner'
      if topic.election_winner.present?
        user = User.find_by(username: topic.election_winner)
        content << "<div class='title'>#{I18n.t('election.post.winner')}</div>"
        content << build_winner(user)
        content << "\n\n"
      end

      if status == Topic.election_statuses[:nomination]
        content = build_nominations(content, topic, unattended)
      elsif status == Topic.election_statuses[:poll] || status == Topic.election_statuses[:closed_poll]
        content = build_poll__winner(content, topic, unattended)
      else
        content = '(unknown status)'
      end

      message = nil
      if status === Topic.election_statuses[:poll]
        message = topic.custom_fields['election_poll_message']
      elsif status == Topic.election_statuses[:closed_poll]
        message = topic.custom_fields['election_closed_poll_message']
      elsif status == Topic.election_statuses[:nomination]
        message = topic.custom_fields['election_nomination_message']
      else 
        message = '(unknown status)'
      end

      if message.blank?
        message = I18n.t('election.nomination.default_message')
      end
  
      content << "\n\n<div class='poll_msg'>#{message}</div>\n\n"
    end

    content
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

    content
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
    html << "<p class='description'>#{get_user_description(topic, user.username)}</p>"
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
      #NOTE: 한줄에 한개의 옵션이어야 함. 
      poll_options << "\n- #{user.username} (#{user.name}) " 
      poll_options << build_nominee(topic, user)
    end

    content << "\n<div class='title'>#{I18n.t('election.title', position: '')}</div>\n"
    content << "\n[poll type=regular status=#{poll_status} _generator=winner]#{poll_options}\n[/poll]"

    content
  end

  # content_type: 'finding_answer' or 'finding_winner'
  def self.update_election_post(topic, contents, unattended = false, revisor_opts = {}, target_stage: 'finding_answer', status: nil)
    election_post = topic.election_post

    pp "###################update_election_post 1" 
    pp election_post.raw
    pp "###################update_election_post 2" 
    pp contents

    return if !election_post #|| election_post.raw == content

    revisor = PostRevisor.new(election_post, topic)

    pp "###################update_election_post 4 revisor_opts:" + revisor_opts.to_s

    content_raw = election_post.raw
    #content = content_raw

    content1 = ''
    if target_stage == 'finding_answer' && contents[:finding_answer].present?
      #matches = content.match(%r{<!--POLL_DEFAULT-->.*<!--\/POLL_DEFAULT-->}m)
      #if matches.present? then content1 = matches[0]
      if status != Topic.election_statuses[:nomination]
        content1 = "\n<!--POLL_DEFAULT-->\n" + remove_poll_tags(contents[:finding_answer].to_s) + "\n<!--/POLL_DEFAULT-->\n"
      else
        # NOTE: 20글자 이상 채워야 함.
        content1 = "\n(현재 상태가 nomination이 아니므로 선거지명자 명단은 숨겨집니다.)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\n"
      end
      pp "###################5 finding_answer: #{content1}"
    end

    content2 = ''
    if ['finding_winner', 'finding_answer'].include?(target_stage) && contents[:finding_winner].present?
      #content = content.gsub(%r{<!--POLL_ELECTION-->.*<!--\/POLL_ELECTION-->}m, '')
      content2 = "\n<!--POLL_ELECTION-->\n" + remove_poll_tags(contents[:finding_winner].to_s) + "\n<!--/POLL_ELECTION-->\n"
      pp "###################update_election_post 6 finding_winner: #{content2}"
    end

    content3 = contents[:default].to_s

    content_out = "#{content1}\n#{content2}\n#{content3}"
    
    content_out = "(본문이 없습니다.) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" if content_out.blank?

    puts "################### 본문: #{content_out}"

    # 똑같음 -> 무시
    if election_post.raw == content_out
      puts "########################update_election_post same content ignore: election_post.raw == content "
      return
    end

    ## We always skip the revision as these are system edits to a single post.
    revisor_opts.merge!(skip_revision: true)

    pp "############### content_out: " + content_out

    revise_result = revisor.revise!(election_post.user, { raw: content_out }, revisor_opts)

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

  def self.remove_poll_tags(content)
    content.gsub(%r{<!--/?POLL_DEFAULT-->}m, '')
          .gsub(%r{<!--/?POLL_ELECTION-->}m, '')
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
