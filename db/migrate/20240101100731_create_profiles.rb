class CreateProfiles < ActiveRecord::Migration[7.1]
  def change
    create_table :profiles do |t|
      t.integer :user_id
      t.string :username
      t.string :nickname

      t.timestamps
    end
  end
end
