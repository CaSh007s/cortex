import { useState, useEffect, useCallback, useRef } from 'react';

// --- Types for Web Speech API ---
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Use a Ref to store the instance (avoids re-rendering loops)
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.webkitSpeechRecognition) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false; // Stop after one sentence
      recognition.interimResults = true; // Show text as you speak
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);

        if (event.error === 'network') {
           alert("Voice recognition failed. Please check your internet connection or disable your VPN.");
        }
        if (event.error === 'not-allowed') {
           alert("Microphone access blocked. Please allow permissions in your browser settings.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript(''); // Clear old text
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1; // Speed (0.1 to 10)
      utterance.pitch = 1; // Pitch (0 to 2)
      window.speechSynthesis.speak(utterance);
    }
  };

  return {
    isListening,
    transcript,
    toggleListening,
    speak,
    hasSupport: typeof window !== 'undefined' && !!window.webkitSpeechRecognition
  };
};