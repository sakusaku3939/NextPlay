import {init_signaling, _peers, errorHandler, _peerConnectionConfig, _ws} from "./signaling"

let localVideo;
let roomId;

const localId = Math.random().toString(36).slice(-4) + '_' + new Date().getTime();
document.addEventListener('turbo:load', () => {
    const videoFrame = document.querySelector('.video-frame');
    roomId = videoFrame.dataset.roomId;
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
                width: {max: 1280},
                height: {max: 720},
            },
            audio: true,
            preferCurrentTab: false,
            selfBrowserSurface: "exclude",
            systemAudio: "include",
            surfaceSwitching: "include",
            monitorTypeSurfaces: "include",
        };
        localVideo = document.getElementById('localVideo');
        // WebRTCの配信、Websocketの接続
        navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(stream => {
            window.stream = stream;
            localVideo.srcObject = stream;
            init_signaling(localId, roomId, startPeerConnection);
        }).catch(e => {
            alert('Media start error.\n\n' + e.name + ': ' + e.message);
        });
    } else {
        alert('Your browser does not support getDisplayMedia API');
    }
}

function startPeerConnection(id, sdpType) {
    if (_peers.has(id)) {
        _peers.get(id)._stopPeerConnection();
    }
    let pc = new RTCPeerConnection(_peerConnectionConfig);

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
    pc.onicecandidate = function (event) {
        if (event.candidate) {
            // ICE送信
            _ws.perform('speak', {type: "ice", ice: event.candidate, id: id});
            console.log("Sending ICE Candidate: ", event.candidate);
        }
    };
    if (window.stream) {
        // Local側のストリームを設定
        window.stream.getTracks().forEach(track => {
            pc.addTrack(track, window.stream);
            track.onended = () => _ws.perform('speak', {type: "leave"});
        });
    }

    pc._stopPeerConnection = function () {
        if (!pc) {
            return;
        }
        console.log("close")
        pc.close();
        pc = null;
        _peers.delete(id);
    };
    _peers.set(id, pc);

    if (sdpType === 'offer') {
        // Offerの作成
        pc.createOffer().then(pc._setDescription).catch(errorHandler);
    }
}