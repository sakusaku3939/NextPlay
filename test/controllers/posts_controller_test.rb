require "test_helper"

class PostsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  test "index and individual posts are public" do
    get posts_url
    assert_response :success
    assert_select ".logo", "NextPlay"
    get post_url(posts(:one))
    assert_response :success
    assert_select "p", text: posts(:one).content
  end

  test "new posts require login" do
    get new_post_url
    assert_redirected_to new_user_session_url
  end

  test "signed in users can open and submit the post form" do
    sign_in users(:one)
    get new_post_url
    assert_response :success
    assert_select "h1", "新しく投稿"
    assert_difference("Post.count", 1) do
      post posts_url, params: { post: { profile_id: profiles(:one).id, content: "更新後の投稿" } }
    end
    assert_redirected_to root_url
    assert_equal profiles(:one), Post.last.profile
    assert_nil Post.last.stream_id
    follow_redirect!
    assert_response :success
    assert_select "p", text: "更新後の投稿"
  end

  test "signed in users can update a post" do
    sign_in users(:one)
    patch post_url(posts(:one)), params: { post: { content: "変更した投稿" } }
    assert_redirected_to post_url(posts(:one))
    assert_equal "変更した投稿", posts(:one).reload.content
  end

  test "deleting a stream post removes its stream" do
    sign_in users(:two)
    assert_difference(["Post.count", "Stream.count"], -1) do
      delete post_url(posts(:two))
    end
    assert_redirected_to posts_url
  end

  # Existing app limitations, not Rails upgrade regressions: edit has no template;
  # destroy dereferences post.stream even for ordinary posts without a stream.
end
