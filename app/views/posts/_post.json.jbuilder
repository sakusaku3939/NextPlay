json.extract! post, :id, :profile_id, :content, :comment_stream_id, :stream_id, :created_at, :updated_at
json.url post_url(post, format: :json)
