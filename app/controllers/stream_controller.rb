class StreamController < ApplicationController
  def show
    @stream = Stream.find(params[:id])
  end

  def new
  end
end
