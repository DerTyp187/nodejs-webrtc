const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
	host: "/",
	port: "3001",
});

const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(
	(stream) => {
		addVideoStream(myVideo, stream);

		myPeer.on("call", (call) => {
			call.answer(stream);
			const video = document.createElement("video");
			call.on("stream", (userVideoStream) => {
				addVideoStream(video, userVideoStream);
			});
		});
		socket.on("user-connected", (userId) => {
			connectToNewUser(userId, stream);
		});
	},
	(err) => console.error(err)
);

myPeer.on("open", (id) => {
	socket.emit("join-room", ROOM_ID, id);
});
socket.emit("join-room", ROOM_ID, 10);

socket.on("user-connected", (userId) => {
	console.log(`User ${userId} connected`);
});

socket.on("user-disconnected", (userId) => {
	if (peers[userId]) {
		console.log(`User ${userId} disconnected`);
		peers[userId].close();
		delete peers[userId];
	}
});

function connectToNewUser(userId, stream) {
	const call = myPeer.call(userId, stream);
	const video = document.createElement("video");
	call.on("stream", (userVideoStream) => {
		addVideoStream(video, userVideoStream);
	});
	call.on("close", () => {
		video.remove();
	});

	peers[userId] = call;
}

function addVideoStream(video, stream) {
	video.srcObject = stream;
	video.addEventListener("loadedmetadata", () => {
		video.play();
	});
	videoGrid.append(video);
}
