import {init_signaling, _peerConnectionConfig, _peers} from "./signaling"
import {createOffer, createPeerConnection} from "./webrtc";

let localStream;
let roomId;

const localId = Math.random().toString(36).slice(-4) + '_' + new Date().getTime();
document.addEventListener('turbo:load', () => {
    // ローディング表示、ルームIDを設定
    document.getElementById('remote').innerHTML = '<div class="video-loader">ロード中です。。。</div>';
    const videoFrame = document.querySelector('.video-frame');
    roomId = videoFrame.dataset.roomId;

    // 配信コメントの送信
    document.getElementById('comment-button').addEventListener('click', () => {
        const commentField = document.getElementById('comment-field');
        if (commentField.value) {
            ws.perform('speak', {
                type: "comment",
                content: commentField.value,
                username: commentField.dataset.username
            });
            // フォームの入力値をリセット
            setTimeout(() => commentField.value = '', 200);
        }
    });

    // WebRTCの受信、Websocketの接続
    navigator.mediaDevices.getUserMedia({video: true}).then(stream => {
        localStream = stream;
        init_signaling(localId, roomId, startPeerConnection);
    })
});

function startPeerConnection(id, sdpType) {
    if (_peers.has(id)) {
        _peers.get(id)._stopPeerConnection();
    }

    let pc = new RTCPeerConnection(_peerConnectionConfig);
    pc.addTransceiver('video', {'direction': 'recvonly'});

    createPeerConnection(pc, sdpType, id);

    // VIDEOタグの作成
    document.getElementById('remote').innerHTML = '<video id="' + id + '" playsinline autoplay></video>';
    pc._remoteVideo = document.getElementById(id);

    // WebRTCのストリーム受信時
    pc.ontrack = function (event) {
        if (pc) {
            if (event.streams && event.streams[0]) {
                pc._remoteVideo.srcObject = event.streams[0];
                // revokePermissions();
            } else {
                pc._remoteVideo.srcObject = new MediaStream(event.track);
            }
        }
    };

    // 相手のコネクションの終了時
    pc._stopPeerConnection = function () {
        if (!pc) {
            return;
        }
        if (pc._remoteVideo && pc._remoteVideo.srcObject) {
            try {
                console.log("コネクション終了: " + id);
                pc._remoteVideo.srcObject.getTracks().forEach(track => {
                    track.stop();
                });
            } catch (error) {
                console.error(error);
            }
            pc._remoteVideo.srcObject = null;
        }
        if (pc._remoteVideo) {
            // VIDEOタグを削除
            pc._remoteVideo.remove();
        }

        pc.close();
        pc = null;
        _peers.delete(id);
        document.getElementById('remote').innerHTML = '<div class="video-loader">ロード中です。。。</div>';
    };

    _peers.set(id, pc);

    // 自分がOffer側の場合はOfferを送信する
    if (sdpType === 'offer') {
        createOffer(pc);
    }
}