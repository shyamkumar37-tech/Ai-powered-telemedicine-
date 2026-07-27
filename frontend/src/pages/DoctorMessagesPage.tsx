import React from 'react';
import ChatInterface from "../components/ChatInterface";

export default function DoctorMessagesPage() {
  return (
    <div className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] w-full flex flex-col animate-fadeSlideUp">
      <ChatInterface />
    </div>
  );
}
