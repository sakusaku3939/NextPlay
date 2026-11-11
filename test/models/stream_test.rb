require "test_helper"
require "stringio"
require "base64"

class StreamTest < ActiveSupport::TestCase
  test "thumbnail can be attached and downloaded with the disk test service" do
    # A one-pixel PNG exercises attachment storage without external image tools.
    bytes = Base64.decode64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=")
    stream = streams(:one)
    stream.thumbnail.attach(io: StringIO.new(bytes), filename: "thumbnail.png", content_type: "image/png")
    assert stream.reload.thumbnail.attached?
    assert_equal "image/png", stream.thumbnail.content_type
    assert_equal bytes, stream.thumbnail.download
    assert_match %r{/rails/active_storage/blobs/redirect/}, Rails.application.routes.url_helpers.rails_blob_path(stream.thumbnail, only_path: true)
  ensure
    stream&.thumbnail&.purge
  end
end
