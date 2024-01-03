class Stream < ApplicationRecord
  belongs_to :profile
  has_one_attached :thumbnail
end
