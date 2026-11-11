require "application_system_test_case"

class PostsTest < ApplicationSystemTestCase
  test "public Japanese feed is visible" do
    visit posts_url
    assert_selector ".logo", text: "NextPlay"
    assert_link "ログイン"
    assert_text posts(:one).content
    assert_text "配信中のゲーム一覧"
  end

  test "user can log in and publish a text post without media permissions" do
    visit new_user_session_url
    fill_in "user_email", with: users(:one).email
    fill_in "user_password", with: "test-password-123"
    click_button "ログイン"
    assert_text "@player_oneさんでログイン中"
    click_link "投稿する"
    assert_selector "h1", text: "新しく投稿"
    fill_in "textarea", with: "アップグレード後も投稿できます"
    click_button "投稿する"
    assert_text "Post was successfully created."
    assert_text "アップグレード後も投稿できます"
    assert_current_path root_path
  end
end
