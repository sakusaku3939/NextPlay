require "test_helper"

class SignalingChannelTest < ActionCable::Channel::TestCase
  setup do
    @room = "upgrade-test-room"
    @member = "upgrade-test-viewer"
    # The app stores room membership in class variables. Isolate each example.
    SignalingChannel.class_variable_set(:@@members, {})
    SignalingChannel.class_variable_set(:@@streamer_ids, {})
    stub_connection
    subscribe(room: @room, id: @member)
  end

  teardown do
    SignalingChannel.class_variable_set(:@@members, {})
    SignalingChannel.class_variable_set(:@@streamer_ids, {})
  end

  test "subscribes to the room and personal signaling stream" do
    assert subscription.confirmed?
    assert_has_stream "room_#{@room}"
    assert_has_stream SignalingChannel.broadcasting_for(@member)
  end

  test "join routes notification to the streamer and leave broadcasts departure" do
    perform :speak, type: "join", is_streamer: true
    assert_broadcast_on(SignalingChannel.broadcasting_for(@member), type: "join", room: @room, id: @member) do
      perform :speak, type: "join", is_streamer: false
    end
    assert_broadcast_on("room_#{@room}", type: "leave", id: @member) do
      unsubscribe
    end
  end

  test "comments are broadcast to the room" do
    assert_broadcast_on("room_#{@room}", type: "comment", content: "こんにちは", username: "player_one") do
      perform :speak, type: "comment", content: "こんにちは", username: "player_one"
    end
  end

  test "offer answer and ice are routed to the target peer" do
    %w[offer answer].each do |type|
      assert_broadcast_on(SignalingChannel.broadcasting_for("target"), type: type, sdp: "test-sdp", room: @room, id: @member) do
        perform :speak, type: type, id: "target", sdp: "test-sdp"
      end
    end
    assert_broadcast_on(SignalingChannel.broadcasting_for("target"), type: "ice", ice: "test-candidate", room: @room, id: @member) do
      perform :speak, type: "ice", id: "target", ice: "test-candidate"
    end
  end

  # Unsubscribing before joining currently raises because the room has no member
  # list. This existing application defect is outside the dependency upgrade.
end
