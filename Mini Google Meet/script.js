const firebaseConfig = {
  apiKey: "AIzaSyDx02BNUAs9WxuuXbHVSWXuEnE1yaAyEog",
  authDomain: "mini--meet.firebaseapp.com",
  databaseURL: "https://mini--meet-default-rtdb.firebaseio.com",
  projectId: "mini--meet",
  storageBucket: "mini--meet.firebasestorage.app",
  messagingSenderId: "292190709426",
  appId: "1:292190709426:web:e36c6a822dcf7b4e084bab",
  measurementId: "G-MMKY7K0MR0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 🔗 Pega a sala da URL
const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');
document.getElementById('roomName').innerText = `Sala: ${room}`;

// 🔥 Configura PeerJS
const peer = new Peer();
let conn;
let call;

// 📹 Vídeo local
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
  localVideo.srcObject = stream;

  peer.on('call', incomingCall => {
    incomingCall.answer(stream);
    incomingCall.on('stream', remoteStream => {
      remoteVideo.srcObject = remoteStream;
    });
    call = incomingCall;
  });

  peer.on('open', id => {
    const roomRef = db.ref(`rooms/${room}`);

    roomRef.once('value').then(snapshot => {
      const data = snapshot.val();
      if (!data) {
        roomRef.set({ peerId: id });
      } else {
        const remotePeerId = data.peerId;
        const outgoingCall = peer.call(remotePeerId, stream);
        outgoingCall.on('stream', remoteStream => {
          remoteVideo.srcObject = remoteStream;
        });
        call = outgoingCall;
      }
    });

    // Chat
    const messagesRef = roomRef.child('messages');
    messagesRef.on('child_added', snapshot => {
      const msg = snapshot.val();
      const div = document.createElement('div');
      div.innerText = msg;
      document.getElementById('messages').appendChild(div);
    });

    window.sendMessage = function() {
      const msg = document.getElementById('msgInput').value;
      if (msg.trim()) {
        messagesRef.push(msg);
        document.getElementById('msgInput').value = '';
      }
    };
  });
});
