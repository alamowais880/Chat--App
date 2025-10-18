import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { Send, MoreVertical, Phone, Video, X } from "lucide-react";

let socket;
let peerConnection;

export default function ChatWindow({ activeChat, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(false);

  const messagesEndRef = useRef(null);
  const localVideo = useRef();
  const remoteVideo = useRef();

  // Initialize socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    socket = io("http://localhost:5000", { auth: { token } });

    socket.on("messageSent", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));

    socket.on("messageDelivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: "delivered" } : m))
      );
    });
    socket.on("messageSeen", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: "seen" } : m))
      );
    });

    // Call-related events
    socket.on("call:incoming", ({ from, isVideo }) => {
      window.callerId = from;
      setIncomingCall(true);
      setIsVideoCall(isVideo);
    });

    socket.on("call:offer", async ({ offer }) => {
      await handleAnswer(offer);
    });

    socket.on("call:answer", async ({ answer }) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("call:iceCandidate", async ({ candidate }) => {
      if (candidate) {
        try {
          await peerConnection.addIceCandidate(candidate);
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  // Fetch chat history
  useEffect(() => {
    if (!activeChat || !currentUser) return;
    const loadMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/${currentUser._id}/${activeChat._id}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };
    loadMessages();
  }, [activeChat, currentUser]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messageData = {
      senderId: currentUser._id,
      receiverId: activeChat._id,
      text,
    };

    socket.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, { ...messageData, status: "sent" }]);
    setText("");
  };

  // Start a call
  const startCall = async (isVideo = false) => {
    setIsVideoCall(isVideo);
    setInCall(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: isVideo,
      audio: true,
    });
    localVideo.current.srcObject = stream;

    peerConnection = new RTCPeerConnection();
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideo.current.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:iceCandidate", {
          to: activeChat._id,
          candidate: event.candidate,
        });
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("call:offer", {
      to: activeChat._id,
      offer,
      isVideo,
    });
  };

  // Answer incoming call
  const handleAnswer = async (offer) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: isVideoCall,
      audio: true,
    });
    localVideo.current.srcObject = stream;

    peerConnection = new RTCPeerConnection();
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideo.current.srcObject = event.streams[0];
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("call:answer", {
      to: window.callerId || activeChat._id,
      answer,
    });

    setIncomingCall(false);
    setInCall(true);
  };

  const endCall = () => {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    setInCall(false);
    setIncomingCall(false);
    localVideo.current.srcObject = null;
    remoteVideo.current.srcObject = null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-green-600 text-white p-4 shadow-md">
        <div className="flex items-center space-x-3">
          <img
            src={activeChat.avatar || `https://ui-avatars.com/api/?name=${activeChat.name}`}
            alt={activeChat.name}
            className="w-10 h-10 rounded-full border border-white"
          />
          <div>
            <h3 className="font-semibold text-lg">{activeChat.name}</h3>
            <p className="text-xs text-green-100">Online</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => startCall(false)}
            className="bg-green-500 p-2 rounded-full hover:bg-green-400"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => startCall(true)}
            className="bg-green-500 p-2 rounded-full hover:bg-green-400"
          >
            <Video size={18} />
          </button>
          <MoreVertical size={22} className="cursor-pointer hover:text-gray-200" />
        </div>
      </div>

      {/* Incoming call alert */}
      {incomingCall && (
        <div className="bg-yellow-200 text-center py-3 text-gray-800">
          📞 Incoming {isVideoCall ? "Video" : "Audio"} Call...
          <div className="mt-2 space-x-3">
            <button
              onClick={() => handleAnswer(window.offer)}
              className="bg-green-600 text-white px-4 py-1 rounded"
            >
              Accept
            </button>
            <button
              onClick={endCall}
              className="bg-red-600 text-white px-4 py-1 rounded"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-green-50 to-gray-100">
        {messages.map((m, idx) => {
          const isSender = m.senderId === currentUser._id;
          return (
            <div
              key={idx}
              className={`flex flex-col my-2 ${
                isSender ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-xs p-3 rounded-2xl shadow-sm ${
                  isSender
                    ? "bg-green-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                <p>{m.text}</p>
                <div className="text-[10px] text-right opacity-80 mt-1">
                  {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {isSender && (
                    <>
                      {" "}
                      {m.status === "seen" ? (
                        <span className="text-blue-300 ml-1">✓✓</span>
                      ) : m.status === "delivered" ? (
                        <span className="text-gray-300 ml-1">✓✓</span>
                      ) : (
                        <span className="text-gray-400 ml-1">✓</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Video Call Overlay */}
      {inCall && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          {isVideoCall && (
            <>
              <video
                ref={remoteVideo}
                autoPlay
                playsInline
                className="w-3/4 h-3/4 rounded-lg border"
              />
              <video
                ref={localVideo}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-32 h-32 rounded-lg border-2 border-white"
              />
            </>
          )}
          {!isVideoCall && (
            <div className="text-white text-lg mb-4">🔊 In Audio Call...</div>
          )}
          <button
            onClick={endCall}
            className="bg-red-600 text-white px-6 py-2 rounded-full flex items-center space-x-2"
          >
            <X size={18} /> <span>End Call</span>
          </button>
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="flex items-center p-3 bg-white border-t"
      >
        <input
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="ml-2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
