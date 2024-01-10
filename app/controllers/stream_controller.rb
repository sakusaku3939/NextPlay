class StreamController < ApplicationController
  def show
    @stream = Stream.find(params[:id])
  end

  def new
    @room_id = params[:id]
  end
end
