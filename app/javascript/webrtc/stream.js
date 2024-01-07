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
document.addEventListener('turbo:load', () => {
    while (!roomId) {
        roomId = window.prompt('Room ID', '');
    }
    startVideo();
});

function startVideo() {
    if (navigator.mediaDevices.getDisplayMedia) {
        if (window.stream) {
            // 既存のストリームを破棄
            try {
                window.stream.getTracks().forEach(track => {
                    track.stop();
                });
            } catch (error) {
                console.error(error);
            }
            window.stream = null;
        }
        // メディアの設定
        const displayMediaOptions = {
            video: {
                mediaSource: "screen",
                frameRate: {
                    ideal: 60,
                    max: 60,
                },
            },
            audio: true,
            preferCurrentTab: false,
            selfBrowserSurface: "exclude",
            systemAudio: "include",
            surfaceSwitching: "include",
            monitorTypeSurfaces: "include",
        };
        localVideo = document.getElementById('localVideo');
        navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(stream => {
            window.stream = stream;
            localVideo.srcObject = stream;
            signaling();
        }).catch(e => {
            alert('Media start error.\n\n' + e.name + ': ' + e.message);
        });
    } else {
        alert('Your browser does not support getDisplayMedia API');
    }
}

function gotMessageFromServer(data) {
    if (data['type'] === "join") {
        startPeerConnection(data['id'], "offer")
        // signaling.perform('speak', {type: "offer", message: "Hello, Rails! " + localId});
    }
    if (data['type'] === "offer") {
        startPeerConnection(data['id'], "answer");
        // signaling.perform('speak', {type: "answer", message: "Hello, Rails! " + localId});
    }
    const pc = peers.get(localId);
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

    pc._queue = [];
    pc._setDescription = function (description) {
        if (pc) {
            pc.setLocalDescription(description).then(() => {
                // SDP送信
                signaling().perform('speak', {type: sdpType, sdp: pc.localDescription, room: roomId});
            }).catch(errorHandler);
        }
    }
    pc.onicecandidate = function (event) {
        if (event.candidate) {
            // ICE送信
            signaling().perform('speak', {type: "ice", ice: event.candidate, room: roomId});
        }
    };
    if (window.stream) {
        // Local側のストリームを設定
        window.stream.getTracks().forEach(track => pc.addTrack(track, window.stream));
    }

    pc._stopPeerConnection = function () {
        if (!pc) {
            return;
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
