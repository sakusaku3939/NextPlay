# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

Profile.create(user_id: 1, username: "bootstrap", nickname: "Bootstrap")
Profile.create(user_id: 2, username: "stub_", nickname: "Stub")
Profile.create(user_id: 3, username: "ice_protocol", nickname: "ice_protocol")
Profile.create(user_id: 4, username: "pyopyo", nickname: "piyopiyo")
Profile.create(user_id: 5, username: "foo", nickname: "foo")
Profile.create(user_id: 6, username: "username", nickname: "HogeHoge")

Post.create(profile_id: 1, content: "valorant枠", stream_id: 1)
Post.create(profile_id: 2, content: "誰かスト6対戦しましょう")
Post.create(profile_id: 3, content: "Apexランクやります", stream_id: 2)
Post.create(profile_id: 4, content: "篝火のスマブラ大会熱すぎる！！あcolaさんのコンボルートめちゃくちゃ上手い")
Post.create(profile_id: 5, content: "今の置きエイムすごくうまい", comment_stream_id: 1)
Post.create(profile_id: 6, content: "Apex@2人 募集しています！誰か一緒にやりましょう")
