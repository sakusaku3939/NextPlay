class CreatePosts < ActiveRecord::Migration[7.1]
  def change
    create_table :posts do |t|
      t.integer :profile_id
      t.string :content
      t.integer :stream_id
      t.integer :comment_stream_id

      t.timestamps
    end
  end
end
