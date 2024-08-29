import {_ws, errorHandler, init_signaling, _peerConnectionConfig, _peers} from "./signaling"

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

    document.getElementById('remote').innerHTML = '<video id="' + id + '" playsinline autoplay></video>';

    pc._remoteVideo = document.getElementById(id);
    pc._queue = [];
    pc._setDescription = function (description) {
        if (pc) {
            pc.setLocalDescription(description).then(() => {
                // SDP送信
                _ws.perform('speak', {type: sdpType, sdp: pc.localDescription, id: id});
                console.log("Sending SDP: ", pc.localDescription);
            }).catch(errorHandler);
        }
    }
    pc.addTransceiver('video', {'direction': 'recvonly'});

    pc.onicecandidate = function (event) {
        if (event.candidate) {
            // ICE送信
            _ws.perform('speak', {type: "ice", ice: event.candidate, id: id});
            console.log("Sending ICE Candidate: ", event.candidate);
        }
    };
    pc.ontrack = function (event) {
        if (pc) {
            // Remote側のストリームを設定
            if (event.streams && event.streams[0]) {
                pc._remoteVideo.srcObject = event.streams[0];
                // revokePermissions();
            } else {
                pc._remoteVideo.srcObject = new MediaStream(event.track);
            }
        }
    };
    pc._stopPeerConnection = function () {
        if (!pc) {
            return;
        }
        if (pc._remoteVideo && pc._remoteVideo.srcObject) {
            try {
                console.log("close")
                pc._remoteVideo.srcObject.getTracks().forEach(track => {
                    track.stop();
                });
            } catch (error) {
                console.error(error);
            }
            pc._remoteVideo.srcObject = null;
        }
        if (pc._remoteVideo) {
            // VIDEOタグの削除
            pc._remoteVideo.remove();
        }
        pc.close();
        pc = null;
        _peers.delete(id);
        document.getElementById('remote').innerHTML = '<div class="video-loader">ロード中です。。。</div>';
    };
    _peers.set(id, pc);

    if (sdpType === 'offer') {
        // Offerの作成
        pc.createOffer().then(pc._setDescription).catch(errorHandler);
    }
}