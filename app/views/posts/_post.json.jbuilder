json.extract! post, :id, :profile_id, :content, :is_comment, :stream_id, :created_at, :updated_at
json.url post_url(post, format: :json)
