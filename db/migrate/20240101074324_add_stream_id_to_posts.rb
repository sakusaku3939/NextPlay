class AddStreamIdToPosts < ActiveRecord::Migration[7.1]
  def change
    add_column :posts, :stream_id, :integer
  end
end
