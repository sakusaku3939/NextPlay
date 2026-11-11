require "test_helper"

class StreamControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  test "stream pages require login" do
    get stream_url(streams(:one))
    assert_redirected_to new_user_session_url
    get new_stream_url(id: "test-room")
    assert_redirected_to new_user_session_url
  end

  test "signed in user can view a stream" do
    sign_in users(:one)
    get stream_url(streams(:one))
    assert_response :success
    assert_select "h1", "player_oneさんの配信"
    assert_select ".video-frame[data-room-id=?]", streams(:one).room_id
  end

  test "stream setup and comments use current routes" do
    sign_in users(:one)
    get new_stream_url(id: "test-room")
    assert_response :success
    assert_equal "test-room", session["room_id"]
    assert_difference("Post.count", 1) do
      post streams_url(streams(:one)), params: { profile_id: profiles(:one).id, content: "応援しています" }
    end
    assert_response :no_content
    assert_equal streams(:one), Post.last.stream
    assert Post.last.is_comment
  end
end
