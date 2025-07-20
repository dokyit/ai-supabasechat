"use client";
import { useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";

export default function VoiceChatPage() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiAudioUrl, setAiAudioUrl] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const waveRef = useRef<HTMLDivElement>(null);
  const aiWaveRef = useRef<HTMLDivElement>(null);

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
      body: JSON.stringify({ message: text, model: "qwen3:1.7b", conversationId: "voice" }),
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
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Voice Chat</h1>
      <div className="mb-4">
        <Button onClick={recording ? stopRecording : startRecording}>
          {recording ? "Stop Recording" : "Start Recording"}
        </Button>
      </div>
      <div ref={waveRef} className="mb-4" />
      {transcript && (
        <div className="mb-4">
          <div className="font-semibold">You said:</div>
          <div>{transcript}</div>
        </div>
      )}
      {aiReply && (
        <div className="mb-4">
          <div className="font-semibold">AI says:</div>
          <div>{aiReply}</div>
        </div>
      )}
      {aiAudioUrl && (
        <>
          <audio src={aiAudioUrl} controls autoPlay />
          <div ref={aiWaveRef} className="mt-2" />
        </>
      )}
    </div>
  );
}