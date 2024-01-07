class SignalingChannel < ApplicationCable::Channel
  def subscribed
    # 新しいユーザーが参加したとき
    stream_from "room_#{params[:room]}"
    ActionCable.server.broadcast("room_#{params[:room]}", { type: "join", room: params[:room], id: params[:id] })
  end

  def unsubscribed
  end

  def speak(data)
    if data['type'] == "offer" || data['type'] == "answer"
      ActionCable.server.broadcast("room_#{params[:room]}", { type: data['type'], sdp: data['sdp'], room: data['room'], id: params[:id] })
    end
    if data['type'] == "ice"
      ActionCable.server.broadcast("room_#{params[:room]}", { type: data['type'], ice: data['ice'], room: data['room'], id: params[:id] })
    end
  end
end