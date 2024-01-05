class CreateStreams < ActiveRecord::Migration[7.1]
  def change
    create_table :streams do |t|
      t.string :room_id
      t.integer :profile_id
      t.string :username

      t.timestamps
    end
  end
end
