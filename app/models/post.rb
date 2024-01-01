class Post < ApplicationRecord
  belongs_to :profile
  belongs_to :stream
end
