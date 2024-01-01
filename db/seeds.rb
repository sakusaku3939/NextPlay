# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

Profile.create(user_id: 1, username: "ice_protocol", nickname: "ice_protocol")
Profile.create(user_id: 2, username: "foo", nickname: "foo")
Profile.create(user_id: 3, username: "username", nickname: "HogeHoge")

Post.create(profile_id: 1, content: "Apexランクやります", stream_id: 2)
Post.create(profile_id: 2, content: "今の置きエイムすごくうまい", comment_stream_id: 1)
Post.create(profile_id: 3, content: "Apex@2人 募集しています！誰か一緒にやりましょう")
