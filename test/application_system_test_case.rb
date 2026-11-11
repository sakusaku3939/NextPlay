# Keep local and CI browser setup from sending Selenium Manager usage statistics.
ENV["SE_AVOID_STATS"] = "true"

require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium, using: :headless_chrome, screen_size: [1400, 1400] do |options|
    options.binary = ENV["CHROME_BIN"] if ENV["CHROME_BIN"].present?
    options.add_argument("--no-sandbox") if Process.uid.zero?
    options.add_argument("--disable-dev-shm-usage")
  end
end
