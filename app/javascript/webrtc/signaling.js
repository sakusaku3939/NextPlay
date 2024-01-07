// import consumer from "./consumer"
//
// let roomId;
// while (!roomId) {
//     roomId = window.prompt('Room ID', '');
// }
//
// const localId = Math.random().toString(36).slice(-4) + '_' + new Date().getTime();
// const signaling = consumer.subscriptions.create({channel: "SignalingChannel", room: roomId, id: localId}, {
//     connected() {
//         console.log("connected with localId: " + localId);
//         signaling.perform('speak', {type: "join", room: roomId, id: localId});
//     },
//
//     disconnected() {
//         // 切断時の処理
//     },
//
//     received(data) {
//         if (data['id'] === localId) return;
//         console.log(JSON.stringify(data));
//         if (data['type'] === "join") {
//             signaling.perform('speak', {type: "offer", message: "Hello, Rails! " + localId});
//         }
//         if (data['type'] === "offer") {
//             signaling.perform('speak', {type: "answer", message: "Hello, Rails! " + localId});
//         }
//     },
// });
//
// let localVideo;
// let sc;
// let peers = new Map();
//
// const sslPort = 8443;
// const peerConnectionConfig = {
//     iceServers: [
//         // GoogleのパブリックSTUNサーバー
//         {urls: 'stun:stun.l.google.com:19302'},
//         {urls: 'stun:stun1.l.google.com:19302'},
//         {urls: 'stun:stun2.l.google.com:19302'},
//         // TURNサーバー
//         //{urls: 'turn:turn_server', username:'', credential:''}
//     ]
// };
//
// function startServerConnection(roomId, localId) {
//     // if (sc) {
//     //     sc.close();
//     // }
//     // // サーバー接続の開始
//     // sc = new WebSocket('wss://' + location.hostname + ':' + sslPort + '/');
//     // sc.onmessage = gotMessageFromServer;
//     // sc.onopen = function (event) {
//     //     // サーバーに接続情報を通知
//     //     this.send(JSON.stringify({join: {room: roomId, id: localId}}));
//     // };
//     // sc.onclose = function (event) {
//     //     clearInterval(this._pingTimer);
//     //     setTimeout(conn => {
//     //         if (sc === conn) {
//     //             // 一定時間経過後にサーバーへ再接続
//     //             startServerConnection(roomId, localId);
//     //         }
//     //     }, 5000, this);
//     // }
//     // sc._pingTimer = setInterval(() => {
//     //     // 接続確認
//     //     sc.send(JSON.stringify({ping: 1}));
//     // }, 30000);
// }
//
// function gotMessageFromServer(message) {
//     const signal = JSON.parse(message.data);
//     if (signal.start) {
//         // 同じ部屋のすべてのPeerとの接続を開始する(Offer側)
//         signal.start.forEach(data => startPeerConnection(data.id, 'offer'));
//         return;
//     }
//     if (signal.join) {
//         // 新規参加者通知(Answer側)
//         startPeerConnection(signal.join, 'answer');
//         return;
//     }
//     if (signal.ping) {
//         sc.send(JSON.stringify({pong: 1}));
//         return;
//     }
//     const pc = peers.get(signal.src);
//     if (!pc) {
//         return;
//     }
//     if (signal.part) {
//         // 退出通知
//         pc._stopPeerConnection();
//         return;
//     }
//     // 以降はWebRTCのシグナリング処理
//     if (signal.sdp) {
//         // SDP受信
//         if (signal.sdp.type === 'offer') {
//             pc.setRemoteDescription(signal.sdp).then(() => {
//                 // Answerの作成
//                 pc.createAnswer().then(pc._setDescription).catch(errorHandler);
//             }).catch(errorHandler);
//         } else if (signal.sdp.type === 'answer') {
//             pc.setRemoteDescription(signal.sdp).catch(errorHandler);
//         }
//     }
//     if (signal.ice) {
//         // ICE受信
//         if (pc.remoteDescription) {
//             pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
//         } else {
//             // SDPが未処理のためキューに貯める
//             pc._queue.push(message);
//             return;
//         }
//     }
//     if (pc._queue.length > 0 && pc.remoteDescription) {
//         // キューのメッセージを再処理
//         gotMessageFromServer(pc._queue.shift());
//     }
// }
//
// function errorHandler(error) {
//     alert('Signaling error.\n\n' + error.name + ': ' + error.message);
// }