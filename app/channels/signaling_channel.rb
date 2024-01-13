class SignalingChannel < ApplicationCable::Channel
  @@members = {}

  def subscribed
    room_id = "room_#{params[:room]}"

    # 新しいユーザーが参加したとき
    stream_from room_id
    stream_for params[:id]

    # 参加者リストを更新
    @@members[room_id] ||= []
    @@members[room_id] << params[:id]

    ActionCable.server.broadcast(room_id, { type: "join", room: params[:room], id: params[:id] })
  end

  def unsubscribed
    leave
  end

  def speak(data)
    room_id = "room_#{params[:room]}"

    if data['type'] == "start"
      SignalingChannel.broadcast_to(params[:id], { type: "start", members: @@members[room_id].reject { |e| e == params[:id] } })
    end
    if data['type'] == "leave"
      leave
    end
    if data['type'] == "offer" || data['type'] == "answer"
      SignalingChannel.broadcast_to(data['id'], { type: data['type'], sdp: data['sdp'], room: params[:room], id: params[:id] })
    end
    if data['type'] == "ice"
      SignalingChannel.broadcast_to(data['id'], { type: data['type'], ice: data['ice'], room: params[:room], id: params[:id] })
    end

    # 配信コメントの投稿
    if data['type'] == "comment"
      ActionCable.server.broadcast(room_id, { type: "comment", content: data['content'], username: data['username'] })
    end
  end

  private

  def leave
    room_id = "room_#{params[:room]}"
    @@members[room_id].delete(params[:id])
    ActionCable.server.broadcast(room_id, { type: "leave", id: params[:id] })
  end
end