class SignalingChannel < ApplicationCable::Channel
  def subscribed
    # 新しいユーザーが参加したとき
    stream_from "room_#{params[:room]}"
    ActionCable.server.broadcast("room_#{params[:room]}", { type: "join", room: params[:room], id: params[:id] })
  end

  def unsubscribed
  end

  def speak(data)
    if data['message']
      ActionCable.server.broadcast("room_#{params[:room]}", { type: data['type'], message: data['message'], id: params[:id] })
    end
  end
end