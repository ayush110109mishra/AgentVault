export interface VoiceRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error?: string;
}

export type VoiceCommandIntent =
  | { type: 'PLAN_WORKFLOW'; payload?: string }
  | { type: 'RUN_WORKFLOW' }
  | { type: 'PAUSE_WORKFLOW' }
  | { type: 'RESUME_WORKFLOW' }
  | { type: 'RETRY_STEP' }
  | { type: 'CANCEL_WORKFLOW' }
  | { type: 'EXPLAIN_RESULT' }
  | { type: 'GENERAL_INPUT'; text: string };

/**
 * Interprets a spoken sentence into an application intent
 */
export function interpretVoiceCommand(transcript: string): VoiceCommandIntent {
  const t = transcript.trim().toLowerCase();

  if (t.includes('pause execution') || t === 'pause' || t.includes('pause workflow')) {
    return { type: 'PAUSE_WORKFLOW' };
  }
  if (t.includes('resume execution') || t === 'resume' || t.includes('resume workflow') || t.includes('continue')) {
    return { type: 'RESUME_WORKFLOW' };
  }
  if (t.includes('retry') || t.includes('retry the failed step') || t.includes('try again')) {
    return { type: 'RETRY_STEP' };
  }
  if (t.includes('cancel execution') || t.includes('cancel workflow') || t === 'cancel run' || t === 'abort') {
    return { type: 'CANCEL_WORKFLOW' };
  }
  if (t.includes('explain the latest result') || t.includes('explain result') || t.includes('read report') || t.includes('speak summary')) {
    return { type: 'EXPLAIN_RESULT' };
  }
  if (t.startsWith('run the approved') || t === 'run workflow' || t.startsWith('execute plan') || t.startsWith('start workflow')) {
    return { type: 'RUN_WORKFLOW' };
  }
  if (t.startsWith('plan a research') || t.startsWith('plan ') || t.startsWith('create plan')) {
    const rawGoal = transcript.replace(/^(plan\s+(a\s+)?(research\s+)?(workflow\s+)?(for\s+)?)/i, '').trim();
    return { type: 'PLAN_WORKFLOW', payload: rawGoal || transcript };
  }

  return { type: 'GENERAL_INPUT', text: transcript };
}

export class VoiceController {
  private recognition: any = null;
  private isListening = false;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (this.onTranscriptCallback) {
            const combined = finalTranscript || interimTranscript;
            this.onTranscriptCallback(combined, !!finalTranscript);
          }
        };

        this.recognition.onerror = (event: any) => {
          this.isListening = false;
          let msg = event.error || 'Speech recognition error.';
          if (event.error === 'not-allowed') {
            msg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
          } else if (event.error === 'no-speech') {
            msg = 'No speech detected. Please speak closer to your microphone.';
          }
          if (this.onErrorCallback) {
            this.onErrorCallback(msg);
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public startListening(
    onTranscript: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use text input.');
      return false;
    }

    try {
      this.onTranscriptCallback = onTranscript;
      this.onErrorCallback = onError;
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e: any) {
      onError(e.message || 'Could not start speech recognition.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  public speak(
    text: string,
    options?: { voiceName?: string; rate?: number; pitch?: number; onEnd?: () => void }
  ): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // stop current speech
    const cleanText = text.replace(/[*_#`[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (options?.rate) utterance.rate = options.rate;
    if (options?.pitch) utterance.pitch = options.pitch;

    if (options?.voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find(v => v.name === options.voiceName);
      if (matched) utterance.voice = matched;
    }

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    return typeof window !== 'undefined' && !!window.speechSynthesis && window.speechSynthesis.speaking;
  }
}

export const voiceController = new VoiceController();
