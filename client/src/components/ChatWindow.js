import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

let socket;

export default function ChatWindow({ activeChat, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

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

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!activeChat || !currentUser) return;
    const loadMessages = async () => {
      const res = await axios.get(
        `http://localhost:5000/api/messages/${currentUser._id}/${activeChat._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessages(res.data);
    };
    loadMessages();
  }, [activeChat, currentUser]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit("sendMessage", {
      senderId: currentUser._id,
      receiverId: activeChat._id,
      text,
    });
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-green-600 text-white p-3 font-semibold">
        Chat with {activeChat.name}
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
        {messages.map((m) => (
          <div
            key={m._id}
            className={`my-2 p-2 rounded max-w-xs ${
              m.sender === currentUser._id
                ? "ml-auto bg-green-200"
                : "mr-auto bg-white"
            }`}
          >
            <div>{m.text}</div>
            <div className="text-xs text-gray-600 text-right">
              {new Date(m.createdAt).toLocaleTimeString()}
              {m.sender === currentUser._id && (
                <>
                  {" "}
                  {m.status === "seen" ? (
                    <span className="text-blue-600">✓✓</span>
                  ) : m.status === "delivered" ? (
                    <span className="text-gray-600">✓✓</span>
                  ) : (
                    <span className="text-gray-400">✓</span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex p-2 bg-white border-t">
        <input
          className="flex-1 border rounded-l px-3"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="bg-green-600 text-white px-4 rounded-r">Send</button>
      </form>
    </div>
  );
}
