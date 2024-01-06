import consumer from "./consumer"

let roomId;
while (!roomId) {
    roomId = window.prompt('Room ID', '');
}

const localId = Math.random().toString(36).slice(-4) + '_' + new Date().getTime();
const signaling = consumer.subscriptions.create({channel: "SignalingChannel", room: roomId, id: localId}, {
    connected() {
        console.log("connected with localId: " + localId);
        signaling.perform('speak', {type: "join", room: roomId, id: localId});
    },

    disconnected() {
        // 切断時の処理
    },

    received(data) {
        if (data['id'] === localId) return;
        console.log(JSON.stringify(data));
        if (data['type'] === "join") {
            signaling.perform('speak', {type: "offer", message: "Hello, Rails! " + localId});
        }
        if (data['type'] === "offer") {
            signaling.perform('speak', {type: "answer", message: "Hello, Rails! " + localId});
        }
    },
});