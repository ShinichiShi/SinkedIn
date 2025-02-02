"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

const Chatbot = () => {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState<string>("You are Sadbot, a chatbot that empathizes with sadness and provides comforting advice. BUT DONT BE TOO CArried away while doing so...answer to the point while maintaining the empathy");

  if (pathname!="/"){
    return null;
  }
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const sendMessage = async () => {
    if (!message.trim()) return; // Prevent sending empty messages
  
    const newMessage: ChatMessage = { sender: "user", text: message };
    setChatHistory((prev) => [...prev, newMessage]);
  
    try {
      console.log("Sending message:", message);
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message, prompt }), // Send prompt with the message
      });
  
      console.log("Response status:", response.status);
  
      if (response.ok) {
        const data = await response.json();
  
        if (data?.response) {
          setChatHistory((prev) => [
            ...prev,
            { sender: "bot", text: data.response },
          ]);
        } else {
          setChatHistory((prev) => [
            ...prev,
            { sender: "bot", text: "I didn't get that. Please try again." },
          ]);
        }
      } else {
        setChatHistory((prev) => [
          ...prev,
          { sender: "bot", text: "Error communicating with the server." },
        ]);
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Network error. Please try again later." },
      ]);
    } finally {
      setMessage(""); 
    }
  };
  
  return (
    <div>
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-5 right-5 p-3 bg-black text-white rounded-full shadow-lg z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chatbox */}
      {isChatOpen && (
        <div className="fixed bottom-0 right-0 w-80 h-96 bg-black text-white shadow-lg rounded-tl-lg z-40">
          <div className="flex justify-between items-center bg-black text-white p-3 rounded-tl-lg rounded-tr-lg">
            <span>Sadbot</span>
            <button
              onClick={toggleChat}
              className="p-1 bg-transparent text-white rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-[calc(100%-170px)]">
            <div className="flex flex-col space-y-2">
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg max-w-xs ${
                      msg.sender === "user"
                        ? "bg-white text-black"
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 bg-gray-700 flex items-center">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="ml-2 p-2 bg-black text-white rounded-full"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
          <div className="p-3 bg-gray-800 flex items-center">
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
