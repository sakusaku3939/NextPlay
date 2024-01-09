/*
* 参考（元となったコード）
* MIT License
* Copyright (c) 2022 nakka
*
* https://github.com/nakkag/webrtc_mesh/blob/main/webrtc_mesh.js
* */
import {peers, peerConnectionConfig, init_signaling, errorHandler} from "./signaling"

let localStream;
let roomId;
let signaling;
const localId = Math.random().toString(36).slice(-4) + '_' + new Date().getTime();
document.addEventListener('turbo:load', () => {
    while (!roomId) {
        roomId = window.prompt('Room ID', '');
    }
    navigator.mediaDevices.getUserMedia({video: true}).then(stream => {
        signaling = init_signaling(localId, roomId, startPeerConnection);
        localStream = stream;
    })
});

function startPeerConnection(id, sdpType) {
    if (peers.has(id)) {
        peers.get(id)._stopPeerConnection();
    }
    let pc = new RTCPeerConnection(peerConnectionConfig);

    document.getElementById('remote').insertAdjacentHTML('beforeend', '<video id="' + id + '" playsinline autoplay></video>');

    pc._remoteVideo = document.getElementById(id);
    pc._queue = [];
    pc._setDescription = function (description) {
        if (pc) {
            pc.setLocalDescription(description).then(() => {
                // SDP送信
                signaling.perform('speak', {type: sdpType, sdp: pc.localDescription, room: roomId});
            }).catch(errorHandler);
        }
    }
    pc.addTransceiver('video', {'direction': 'recvonly'});

    pc.onicecandidate = function (event) {
        if (event.candidate) {
            // ICE送信
            signaling.perform('speak', {type: "ice", ice: event.candidate, room: roomId});
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
        peers.delete(id);
    };
    peers.set(id, pc);

    if (sdpType === 'offer') {
        // Offerの作成
        pc.createOffer().then(pc._setDescription).catch(errorHandler);
    }
}
