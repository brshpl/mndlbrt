# frozen_string_literal: true

class AddAuthorToPosts < ActiveRecord::Migration[6.0]
  def change
    add_column :posts, :author, :string
  end
end
