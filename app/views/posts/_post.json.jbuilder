json.extract! post, :id, :user_id, :content, :comment_stream_id, :created_at, :updated_at
json.url post_url(post, format: :json)
