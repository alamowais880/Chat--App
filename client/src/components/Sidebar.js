import React from "react";

const dummyChats = [
  { id: 1, name: "Aman", lastMessage: "Hey there!", time: "10:30 AM" },
  { id: 2, name: "Priya", lastMessage: "Let’s meet soon", time: "Yesterday" },
  { id: 3, name: "Dev Team", lastMessage: "Code pushed on GitHub", time: "2 days ago" },
];

const Sidebar = ({ onSelectChat }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#075E54] text-white p-4 text-lg font-semibold">
        WhatsChat 💬
      </div>

      {/* Search bar */}
      <div className="p-2 bg-[#f6f6f6]">
        <input
          type="text"
          placeholder="Search or start new chat"
          className="w-full p-2 rounded-lg outline-none border border-gray-300"
        />
      </div>

      {/* Chat List */}
      <div className="overflow-y-auto flex-1 bg-white">
        {dummyChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="p-4 flex justify-between items-center hover:bg-gray-100 cursor-pointer border-b"
          >
            <div>
              <div className="font-semibold text-gray-800">{chat.name}</div>
              <div className="text-sm text-gray-500">{chat.lastMessage}</div>
            </div>
            <div className="text-xs text-gray-400">{chat.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
