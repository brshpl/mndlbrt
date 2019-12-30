# frozen_string_literal: true

class Post < ApplicationRecord
  mount_uploader :image, ImageUploader
  validates :image, file_size: { less_than: 10.megabytes }
end
