import React, { useState } from "react";
import ChatWindow from "./ChatWindow";

export default function Dashboard() {
  const [selectedChat, setSelectedChat] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Demo users until you implement user list from DB
  const users = [
    { _id: "1", name: "Alice" },
    { _id: "2", name: "Bob" },
    { _id: "3", name: "Charlie" },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 border-r flex flex-col">
        <div className="p-4 font-bold flex justify-between items-center bg-white border-b">
          <span>{currentUser?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-2 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => setSelectedChat(user)}
              className={`p-3 cursor-pointer border-b hover:bg-green-50 ${
                selectedChat?._id === user._id ? "bg-green-100" : ""
              }`}
            >
              {user.name}
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow activeChat={selectedChat} currentUser={currentUser} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
