import {_ws, errorHandler} from "./signaling";

export function createPeerConnection(pc, sdpType, id) {
    pc._queue = [];
    pc._setDescription = function (description) {
        if (pc) {
            pc.setLocalDescription(description).then(() => {
                // SDP送信
                _ws.perform('speak', {type: sdpType, sdp: pc.localDescription, id: id});
                console.log(sdpType + "でSDPを送信: ", pc.localDescription);
            }).catch(errorHandler);
        }
    }
    pc.onicecandidate = function (event) {
        if (event.candidate) {
            // ICE送信
            _ws.perform('speak', {type: "ice", ice: event.candidate, id: id});
            console.log("ICE Candidateを送信: ", event.candidate);
        }
    };
    return pc
}

export function createOffer(pc) {
    pc.createOffer().then(pc._setDescription).catch(errorHandler);
}

export function createAnswer(pc) {
    pc.createAnswer().then(pc._setDescription).catch(errorHandler);
}