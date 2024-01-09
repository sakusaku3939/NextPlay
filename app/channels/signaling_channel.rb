class SignalingChannel < ApplicationCable::Channel
  @@members = {}

  def subscribed
    room_id = "room_#{params[:room]}"

    # 新しいユーザーが参加したとき
    stream_from room_id

    # 参加者リストを更新
    @@members[room_id] ||= []
    @@members[room_id] << params[:id]

    ActionCable.server.broadcast(room_id, { type: "join", room: params[:room], id: params[:id] })
  end

  def unsubscribed
    room_id = "room_#{params[:room]}"
    @@members[room_id].delete(params[:id])
  end

  def speak(data)
    room_id = "room_#{params[:room]}"

    if data['type'] == "start"
      ActionCable.server.broadcast(room_id, { type: "start", id: params[:id], members: @@members[room_id].reject { |e| e == params[:id] } })
    end
    if data['type'] == "offer" || data['type'] == "answer"
      ActionCable.server.broadcast(room_id, { type: data['type'], sdp: data['sdp'], room: data['room'], id: params[:id] })
    end
    if data['type'] == "ice"
      ActionCable.server.broadcast(room_id, { type: data['type'], ice: data['ice'], room: data['room'], id: params[:id] })
    end
  end
end