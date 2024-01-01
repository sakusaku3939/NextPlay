require "test_helper"

class StreamControllerTest < ActionDispatch::IntegrationTest
  test "should get show" do
    get stream_show_url
    assert_response :success
  end
end
