class StreamController < ApplicationController
  before_action :authenticate_user!

  def show
    @stream = Stream.find(params[:id])
    @profile = Profile.find(1)
  end

  def new
    @room_id = params[:id]
  end

  def create
    @post = Post.new(profile_id: params[:profile_id], content: params[:content], stream_id: params[:id], is_comment: true)
    if @post.save
      puts "Comment saved successfully"
    else
      puts @post.errors
    end
  end
end
