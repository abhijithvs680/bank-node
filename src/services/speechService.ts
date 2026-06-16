// Service for text-to-speech using Web Speech API

export class SpeechService {
  private synth = window.speechSynthesis;
  
  speak(text: string, options = { rate: 1, pitch: 1, volume: 1 }) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }
    
    // Cancel any ongoing speech
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate;
    utterance.pitch = options.pitch;
    utterance.volume = options.volume;
    
    this.synth.speak(utterance);
  }
  
  cancel() {
    this.synth?.cancel();
  }
  
  isSpeaking(): boolean {
    return this.synth?.speaking || false;
  }
}

export const speechService = new SpeechService();
