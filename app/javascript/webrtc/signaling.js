import consumer from "./consumer";
import {createAnswer} from "./webrtc";

export const _peers = new Map();
export const _peerConnectionConfig = {
    iceServers: [
        // GoogleのパブリックSTUNサーバー
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'stun:stun1.l.google.com:19302'},
        {urls: 'stun:stun2.l.google.com:19302'},
        // TURNサーバー
        //{urls: 'turn:turn_server', username:'', credential:''}
    ]
};
export let _ws;

export function init_signaling(localId, roomId, startPeerConnection) {
    _ws = consumer.subscriptions.create({channel: "SignalingChannel", room: roomId, id: localId}, {
        connected() {
            console.log("connected with localId: " + localId + ", roomId: " + roomId);
            this.perform('speak', {type: "start"});
        },

        disconnected() {
        },

        received(data) {
            if (data['id'] === localId) return;
            gotMessageFromServer(data, localId, startPeerConnection)
        },
    });
}

function gotMessageFromServer(data, localId, startPeerConnection) {
    // コメントの受信
    if (data['type'] === "comment") {
        console.log("comment: " + JSON.stringify(data))
        document.getElementById('comment-list').insertAdjacentHTML(
            'beforeend', '<li>' + data['content'] + '<span class="to-comment">' + data['username'] + '</span></li>'
        );
        return;
    }
    console.log(JSON.stringify(data));

    // Offer, Answerのピアコネクションを作成
    if (data['type'] === "join") {
        console.log("join: " + data['id'])
        startPeerConnection(data['id'], 'offer')
        return;
    }
    if (data['type'] === "offer") {
        console.log("offer_from: " + data['id'])
        startPeerConnection(data['id'], 'answer');
    }

    const pc = _peers.get(data['id']);
    if (!pc) {
        return;
    }

    // 受信データに含まれているSDPをチェック
    if ("sdp" in data) {
        if (data['sdp'].sdp.includes('a=inactive')) {
            console.error("Received an inactive SDP. Ignoring...");
            return;
        }

        if (data['type'] === 'offer') {
            pc.setRemoteDescription(data['sdp']).then(() => {
                // Answerを送信
                createAnswer(pc);
            }).catch(errorHandler);

        } else if (data['type'] === 'answer') {
            pc.setRemoteDescription(data['sdp']).catch(errorHandler);
        }
    }

    if (data['type'] === "ice") {
        if (data['ice'].usernameFragment) {
            if (pc.remoteDescription) {
                pc.addIceCandidate(new RTCIceCandidate(data['ice'])).catch(errorHandler);
            } else {
                // SDPが未処理のためキューに貯める
                pc._queue.push(data);
                return;
            }
        } else {
            console.error("ICE candidate has a null usernameFragment. Ignoring...");
        }
    }

    if (pc._queue.length > 0 && pc.remoteDescription) {
        // キューのメッセージを再処理
        gotMessageFromServer(pc._queue.shift(), localId, startPeerConnection);
    }

    if (data['type'] === "leave") {
        // 退出通知
        console.log("leave: " + data['id'])
        pc._stopPeerConnection();
    }
}

export function errorHandler(error) {
    alert('Signaling error.\n\n' + error.name + ': ' + error.message);
}