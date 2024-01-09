/*
* 参考（元となったコード）
* MIT License
* Copyright (c) 2022 nakka
*
* https://github.com/nakkag/webrtc_mesh/blob/main/webrtc_mesh.js
* */
import {peers, peerConnectionConfig, init_signaling, errorHandler} from "./signaling"

let localVideo;
let roomId;
let signaling;
const localId = Math.random().toString(36).slice(-4) + '_' + new Date().getTime();
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
            signaling = init_signaling(localId, roomId, startPeerConnection);
        }).catch(e => {
            alert('Media start error.\n\n' + e.name + ': ' + e.message);
        });
    } else {
        alert('Your browser does not support getDisplayMedia API');
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
                signaling.perform('speak', {type: sdpType, sdp: pc.localDescription, room: roomId, id: id});
            }).catch(errorHandler);
        }
    }
    pc.onicecandidate = function (event) {
        if (event.candidate) {
            // ICE送信
            signaling.perform('speak', {type: "ice", ice: event.candidate, room: roomId, id: id});
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
        console.log("close")
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
