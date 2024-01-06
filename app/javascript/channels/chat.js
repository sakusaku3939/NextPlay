import consumer from "./consumer"

let roomId;
while (!roomId) {
    roomId = window.prompt('Room ID', '');
}

const localId = Math.random().toString(36).slice(-4) + '_' + new Date().getTime();
const chatChannel = consumer.subscriptions.create({channel: "ChatChannel", room: roomId, id: localId}, {
    connected() {
        console.log("connected with localId: " + localId);
        chatChannel.perform('speak', {type: "join", room: roomId, id: localId});
    },

    disconnected() {
        // 切断時の処理
    },

    received(data) {
        if (data['id'] === localId) return;
        console.log(JSON.stringify(data));
        if (data['type'] === "join") {
            chatChannel.perform('speak', {type: "offer", message: "Hello, Rails! " + localId});
        }
        if (data['type'] === "offer") {
            chatChannel.perform('speak', {type: "answer", message: "Hello, Rails! " + localId});
        }
    },
});