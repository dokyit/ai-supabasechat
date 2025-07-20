"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SettingsPanel,
  SettingsPanelProvider,
  SettingsPanelTrigger,
} from "@/components/settings-panel"; // <-- import Trigger
import { ChatMessage } from "@/components/chat-message";
import ModelSelector from "@/components/model-selector";
import ThemeToggle from "@/components/theme-toggle";
import TypingIndicator from "@/components/typing-indicator";
import useChat from "@/hooks/use-chat"; // make sure this hook exposes loadSession

type ChatSession = {
  id: string;
  title: string;
  lastActive: string;
};

export default function Page() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string>("default");
  const [search, setSearch] = useState("");
  const [model, setModel] = useState("qwen3:1.7b");
  const [input, setInput] = useState("");
  const { messages, send, thinking } = useChat();

  // Voice recognition states
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiAudioUrl, setAiAudioUrl] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const waveRef = useRef<HTMLDivElement>(null);
  const aiWaveRef = useRef<HTMLDivElement>(null);

  // load / persist sessions
  useEffect(() => {
    const stored = localStorage.getItem("chat_sessions");
    if (stored) setSessions(JSON.parse(stored));
    else
      setSessions([
        { id: "default", title: "Default", lastActive: new Date().toISOString() },
      ]);
  }, []);

  useEffect(() => {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleNewChat = () => {
    const id = `chat-${Date.now()}`;
    const session = {
      id,
      title: `Chat ${sessions.length + 1}`,
      lastActive: new Date().toISOString(),
    };
    setSessions([session, ...sessions]);
    setActiveSession(id);
    loadSession(id);
  };

  const handleSelectSession = (id: string) => {
    setActiveSession(id);
    loadSession(id);
  };

  // Move this function inside the component so it can access setSessions
  function loadSession(id: string) {
    setSessions((prev: ChatSession[]) =>
      prev.map((s: ChatSession) =>
        s.id === id ? { ...s, lastActive: new Date().toISOString() } : s
      )
    );
  }

  // Start recording
  const startRecording = async () => {
    setTranscript("");
    setAiReply("");
    setAiAudioUrl("");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new window.MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];
    mediaRecorder.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorder.onstop = handleStop;
    mediaRecorder.start();
    setRecording(true);
    // Optionally: visualize audio here with wavesurfer.js
  };

  // Stop recording and send to backend
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  // Handle audio after recording
  const handleStop = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
    // Display waveform
    if (waveRef.current) {
      const ws = WaveSurfer.create({
        container: waveRef.current,
        waveColor: "#6366f1",
        progressColor: "#818cf8",
        height: 80,
        barWidth: 2,
      });
      ws.loadBlob(audioBlob);
    }
    // Send to backend for transcription
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");
    const res = await fetch("http://localhost:5001/api/transcribe", {
      method: "POST",
      body: formData,
    });
    const { text } = await res.json();
    setTranscript(text);

    // Get AI response (replace with your own logic if needed)
    const aiRes = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: text,
        model: "qwen3:1.7b",
        conversationId: "voice",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const { reply } = await aiRes.json();
    setAiReply(reply);

    // Get TTS audio from backend
    const ttsRes = await fetch("http://localhost:5001/api/tts", {
      method: "POST",
      body: JSON.stringify({ text: reply }),
      headers: { "Content-Type": "application/json" },
    });
    const ttsBlob = await ttsRes.blob();
    const ttsUrl = URL.createObjectURL(ttsBlob);
    setAiAudioUrl(ttsUrl);

    // Display AI waveform in pink
    if (aiWaveRef.current) {
      const ws = WaveSurfer.create({
        container: aiWaveRef.current,
        waveColor: "#f472b6",
        progressColor: "#ec4899",
        height: 80,
        barWidth: 2,
      });
      ws.load(ttsUrl);
    }
  };

  return (
    <SettingsPanelProvider>
      <SidebarProvider>
        {/* LEFT sidebar */}
        <AppSidebar>
          <div className="flex flex-col h-full">
            <div className="p-3 border-b">
              <Button onClick={handleNewChat} className="w-full">
                + New Chat
              </Button>
            </div>
            <div className="p-2">
              <Input
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="flex-1 px-2">
              {filteredSessions.map((s) => (
                <div
                  key={s.id}
                  className={`p-2 mb-1 rounded cursor-pointer text-sm ${
                    activeSession === s.id
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleSelectSession(s.id)}
                >
                  <div className="font-medium truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.lastActive).toLocaleString()}
                  </div>
                </div>
              ))}
            </ScrollArea>
            <div className="p-3 border-t flex gap-2">
              {/* Use SettingsPanelTrigger for mobile, fallback to button for desktop */}
              <SettingsPanelTrigger />
              <Button variant="ghost" className="w-full hidden lg:block">
                Settings
              </Button>
            </div>
          </div>
        </AppSidebar>

        {/* MAIN area */}
        <SidebarInset>
          <header className="flex justify-between p-4 border-b">
            <SidebarTrigger />
            <ThemeToggle />
          </header>

          <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="p-4 border-b">
              <ModelSelector onChange={setModel} />
            </div>

            <ScrollArea className="flex-1 p-4 space-y-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ChatMessage isUser={m.role === "user"}>{m.content}</ChatMessage>
                </motion.div>
              ))}
              {thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ChatMessage isUser={false} thinking={true}>
                    Thinking...
                  </ChatMessage>
                </motion.div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type /pull mistral-nemo to fetch..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      if (input.startsWith("/pull")) {
                        const modelName = input.split(" ")[1];
                        await fetch("/api/ollama/pull", {
                          method: "POST",
                          body: JSON.stringify({ model: modelName }),
                        });
                        window.location.reload(); // refresh model list
                      } else {
                        send(input, model, activeSession);
                      }
                      setInput("");
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    send(input, model, activeSession);
                    setInput("");
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>

        {/* RIGHT settings panel */}
        <SettingsPanel />
      </SidebarProvider>
    </SettingsPanelProvider>
  );
}

