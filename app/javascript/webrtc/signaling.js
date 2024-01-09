/*
* 参考（元となったコード）
* MIT License
* Copyright (c) 2022 nakka
*
* https://github.com/nakkag/webrtc_mesh/blob/main/webrtc_mesh.js
* */
import consumer from "./consumer";

export const peers = new Map();
export const peerConnectionConfig = {
    iceServers: [
        // GoogleのパブリックSTUNサーバー
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'stun:stun1.l.google.com:19302'},
        {urls: 'stun:stun2.l.google.com:19302'},
        // TURNサーバー
        //{urls: 'turn:turn_server', username:'', credential:''}
    ]
};

export function init_signaling(localId, roomId, startPeerConnection) {
    return consumer.subscriptions.create({channel: "SignalingChannel", room: roomId, id: localId}, {
        connected() {
            console.log("connected with localId: " + localId);
            this.perform('speak', {type: "start"});
        },

        disconnected() {
            const pc = peers.get(localId);
            if (!pc) {
                return;
            }
            // 退出通知
            pc._stopPeerConnection();
        },

        received(data) {
            if (data['id'] === localId) return;
            gotMessageFromServer(data, localId, startPeerConnection)
        },
    });
}

function gotMessageFromServer(data, localId, startPeerConnection) {
    if (data['type'] === "start") {
        console.log("start: " + JSON.stringify(data['members']))
        data['members'].forEach(id => startPeerConnection(id, 'offer'));
        return;
    }
    if (data['type'] === "join") {
        console.log("join: " + data['id'])
        startPeerConnection(data['id'], "answer");
        return;
    }
    console.log(JSON.stringify(data));

    const pc = peers.get(data['id']);
    if (!pc) {
        return;
    }
    if ("sdp" in data) {
        // SDP受信
        if (data['type'] === 'offer') {
            pc.setRemoteDescription(data['sdp']).then(() => {
                // Answerの作成
                pc.createAnswer().then(pc._setDescription).catch(errorHandler);
            }).catch(errorHandler);
        } else if (data['type'] === 'answer') {
            pc.setRemoteDescription(data['sdp']).catch(errorHandler);
        }
    }
    if (data['type'] === "ice") {
        // ICE受信
        if (pc.remoteDescription) {
            pc.addIceCandidate(new RTCIceCandidate(data['ice'])).catch(errorHandler);
        } else {
            // SDPが未処理のためキューに貯める
            pc._queue.push(data);
            return;
        }
    }
    if (pc._queue.length > 0 && pc.remoteDescription) {
        // キューのメッセージを再処理
        gotMessageFromServer(pc._queue.shift(), localId, startPeerConnection);
    }
}

export function errorHandler(error) {
    alert('Signaling error.\n\n' + error.name + ': ' + error.message);
}
