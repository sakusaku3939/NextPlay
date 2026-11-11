require "test_helper"

module ApplicationCable
  class ConnectionTest < ActionCable::Connection::TestCase
    test "connects with the existing anonymous connection policy" do
      connect
      assert_instance_of ApplicationCable::Connection, connection
    end
  end
end
