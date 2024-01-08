import consumer from "./consumer"

let localVideo;
let peers = new Map();

const peerConnectionConfig = {
    iceServers: [
        // GoogleのパブリックSTUNサーバー
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'stun:stun1.l.google.com:19302'},
        {urls: 'stun:stun2.l.google.com:19302'},
        // TURNサーバー
        //{urls: 'turn:turn_server', username:'', credential:''}
    ]
};

const signaling = () => consumer.subscriptions.create({channel: "SignalingChannel", room: roomId, id: localId}, {
    connected() {
        console.log("connected with localId: " + localId);
        signaling().perform('speak', {type: "join", room: roomId, id: localId});
    },

    disconnected() {
        // 切断時の処理
    },

    received(data) {
        if (data['id'] === localId) return;
        console.log(JSON.stringify(data));
        gotMessageFromServer(data)
    },
});


const localId = Math.random().toString(36).slice(-4) + '_' + new Date().getTime();
let roomId;
let localStream;
document.addEventListener('turbo:load', () => {
    while (!roomId) {
        roomId = window.prompt('Room ID', '');
    }
    navigator.mediaDevices.getUserMedia({video: true}).then(stream => {
        signaling();
        localStream = stream;
    })
});

function gotMessageFromServer(data) {
    if (data['type'] === "join") {
        startPeerConnection(localId, "offer")
        // signaling.perform('speak', {type: "offer", message: "Hello, Rails! " + localId});
    }
    if (data['type'] === "offer") {
        startPeerConnection(data['id'], "answer");
        // signaling.perform('speak', {type: "answer", message: "Hello, Rails! " + localId});
    }
    const pc = peers.get(data['id']);
    if (!pc) {
        return;
    }
    // if (signal.part) {
    //     // 退出通知
    //     pc._stopPeerConnection();
    //     return;
    // }
    // 以降はWebRTCのシグナリング処理
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
        gotMessageFromServer(pc._queue.shift());
    }
}

function startPeerConnection(id, sdpType) {
    if (peers.has(id)) {
        peers.get(id)._stopPeerConnection();
    }
    let pc = new RTCPeerConnection(peerConnectionConfig);

    document.getElementById('remote').insertAdjacentHTML('beforeend', '<video id="' + id + '" playsinline autoplay></video>');
    console.log(document.getElementById('remote'))

    pc._remoteVideo = document.getElementById(id);
    pc._queue = [];
    pc._setDescription = function (description) {
        if (pc) {
            pc.setLocalDescription(description).then(() => {
                // SDP送信
                signaling().perform('speak', {type: sdpType, sdp: pc.localDescription, room: roomId});
            }).catch(errorHandler);
        }
    }
    pc.addTransceiver('video', {'direction': 'recvonly'});

    pc.onicecandidate = function (event) {
        if (event.candidate) {
            // ICE送信
            signaling().perform('speak', {type: "ice", ice: event.candidate, room: roomId});
        }
    };
    pc.ontrack = function (event) {
        if (pc) {
            // Remote側のストリームを設定
            if (event.streams && event.streams[0]) {
                console.log(event.streams)
                pc._remoteVideo.srcObject = event.streams[0];
                // revokePermissions();
            } else {
                alert("ok")
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
        peers.delete(id);
    };
    peers.set(id, pc);

    if (sdpType === 'offer') {
        // Offerの作成
        pc.createOffer().then(pc._setDescription).catch(errorHandler);
    }
}

function errorHandler(error) {
    alert('Signaling error.\n\n' + error.name + ': ' + error.message);
}
