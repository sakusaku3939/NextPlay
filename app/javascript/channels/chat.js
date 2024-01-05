import consumer from "./consumer"

const chatChannel = consumer.subscriptions.create("ChatChannel", {
    connected() {
        // 接続時の処理
    },

    disconnected() {
        // 切断時の処理
    },

    received(data) {
        console.log(data.message);
    },

    speak: function (message) {
        return this.perform('speak', {message: message});
    }
});

setTimeout(() => {
    chatChannel.speak("Hello, Rails!");
}, 1000);