require "test_helper"
require "minitest/mock"

class RailsSecurityTest < ActiveSupport::TestCase
  test "safe_constantize treats a LoadError constant name literally" do
    ["Example.Channel", "Example.Channel::Nested"].each do |name|
      error = LoadError.new("Unable to autoload constant ExampleXChannel")
      ActiveSupport::Inflector.stub(:constantize, ->(_) { raise error }) do
        assert_raises(LoadError) { ActiveSupport::Inflector.safe_constantize(name) }
      end
    end
    error = LoadError.new("Unable to autoload constant Example.Channel")
    ActiveSupport::Inflector.stub(:constantize, ->(_) { raise error }) do
      assert_nil ActiveSupport::Inflector.safe_constantize("Example.Channel::Nested")
    end
  end
end
