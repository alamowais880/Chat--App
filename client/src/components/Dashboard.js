import React, { useEffect, useState } from "react";
import axios from "axios";
import ChatWindow from "./ChatWindow";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, UserCircle2 } from "lucide-react"; // Icons

export default function Dashboard() {
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Fetch all users except the current user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/users");
        const otherUsers = res.data.filter((u) => u._id !== currentUser._id);
        setContacts(otherUsers);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Filter contacts based on search input
  const filteredContacts = contacts.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-green-600 text-white">
          <div className="flex items-center space-x-2">
            <UserCircle2 size={28} />
            <h2 className="font-semibold text-lg">{currentUser?.name || "You"}</h2>
          </div>
          <button
            onClick={handleLogout}
            className="hover:text-gray-200 transition"
            title="Logout"
          >
            <LogOut size={22} />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center bg-white border rounded-full px-3 py-1 shadow-sm">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="ml-2 w-full bg-transparent focus:outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((user) => (
              <div
                key={user._id}
                onClick={() => setActiveChat(user)}
                className={`flex items-center p-3 cursor-pointer border-b hover:bg-green-50 transition ${
                  activeChat?._id === user._id ? "bg-green-100" : ""
                }`}
              >
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full mr-3 border border-gray-200"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{user.name}</span>
                  <span className="text-xs text-gray-500">Click to chat</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 mt-5">No contacts found</p>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-gray-50">
        {activeChat ? (
          <ChatWindow activeChat={activeChat} currentUser={currentUser} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1349/1349830.png"
              alt="chat"
              className="w-28 mb-4 opacity-70"
            />
            <p className="text-lg">Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
