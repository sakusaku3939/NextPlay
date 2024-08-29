import {init_signaling, _peers, _peerConnectionConfig, _ws} from "./signaling"
import {createOffer, createPeerConnection} from "./webrtc";

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
            init_signaling(true, localId, roomId, startPeerConnection);
        }).catch(e => {
            alert('配信開始エラー\n\n' + e.name + ': ' + e.message);
        });
    } else {
        alert('お使いのブラウザは getDisplayMedia API をサポートしていません');
    }
}

function startPeerConnection(id, sdpType) {
    if (_peers.has(id)) {
        _peers.get(id)._stopPeerConnection();
    }
    let pc = new RTCPeerConnection(_peerConnectionConfig);

    pc = createPeerConnection(pc, sdpType, id);

    // Local側のストリームを設定
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            pc.addTrack(track, window.stream);
            track.onended = () => _ws.perform('speak', {type: "leave"});
        });
    }

    // 相手のコネクションの終了時
    pc._stopPeerConnection = function () {
        if (!pc) {
            return;
        }
        console.log("コネクション終了: " + id);

        pc.close();
        pc = null;
        _peers.delete(id);
    };

    _peers.set(id, pc);

    // 自分がOffer側の場合はOfferを送信する
    if (sdpType === 'offer') {
        createOffer(pc);
    }
}