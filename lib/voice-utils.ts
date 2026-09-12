"use client";

// ============================================================
// 1. SPEECH RECOGNITION (SPEECH-TO-TEXT DICTATION)
// ============================================================

export interface SpeechRecognitionHandlers {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export function startSpeechRecognition(
  language: "hi" | "en" | "bn",
  handlers: SpeechRecognitionHandlers
): { stop: () => void } | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    handlers.onError("Speech recognition is not supported in this browser.");
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang =
      language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-IN";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        handlers.onTranscript(finalTranscript, true);
      } else if (interimTranscript) {
        handlers.onTranscript(interimTranscript, false);
      }
    };

    recognition.onerror = (event: any) => {
      handlers.onError(event.error || "Speech recognition error");
    };

    recognition.onend = () => {
      handlers.onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {}
      },
    };
  } catch (err: any) {
    handlers.onError(err?.message || "Failed to initialize speech recognition");
    return null;
  }
}

// ============================================================
// 2. AUDIO VOICE NOTE RECORDER (MEDIARECORDER API)
// ============================================================

export interface RecordedAudioNote {
  blob: Blob;
  url: string;
  durationSeconds: number;
}

export class VoiceNoteRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Audio recording is not supported in this browser.");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];
    this.startTime = Date.now();

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : "";

    this.mediaRecorder = mimeType
      ? new MediaRecorder(this.stream, { mimeType })
      : new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100);
  }

  stop(): Promise<RecordedAudioNote> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error("No active recording found."));
      }

      const durationSeconds = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Stop all microphone tracks to turn off the browser recording indicator
        if (this.stream) {
          this.stream.getTracks().forEach((t) => t.stop());
          this.stream = null;
        }

        resolve({
          blob: audioBlob,
          url: audioUrl,
          durationSeconds,
        });
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        reject(e);
      }
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}

// ============================================================
// 3. TEXT-TO-SPEECH (SPEECH SYNTHESIS)
// ============================================================

export function speakText(
  text: string,
  language: "hi" | "en" | "bn" = "hi",
  onEnd?: () => void
): { stop: () => void } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { stop: () => {} };
  }

  try {
    window.speechSynthesis.cancel(); // Stop any currently playing utterance

    // Strip markdown formatting and emojis for cleaner speech synthesis
    const cleanText = text
      .replace(/[*_~`#>•-]/g, " ")
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return { stop: () => {} };

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang =
      language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-IN";
    utterance.rate = 0.95; // Slightly slower for crisp clarity
    utterance.pitch = 1.0;

    // Pick matching localized voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetLang = utterance.lang.toLowerCase();
    const matchingVoice =
      voices.find((v) => v.lang.toLowerCase() === targetLang) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(language));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);

    return {
      stop: () => {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      },
    };
  } catch {
    return { stop: () => {} };
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}
