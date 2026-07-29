// Speech synthesis helper for standard English & Chinese pronunciation for elementary students

export interface SpeechOptions {
  rate?: number; // 0.85 is great for kids
  pitch?: number;
  lang?: string;
}

export function playSpeech(text: string, options: SpeechOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported in this browser.');
      resolve();
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    // Clean up markdown characters (*, #, _, `, etc.) and emojis if any for clear speech
    const cleanText = text
      .replace(/[\*\_`#~]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    if (!cleanText) {
      resolve();
      return;
    }

    const hasChinese = /[\u4e00-\u9fa5]/.test(cleanText);
    const targetLang = options.lang || (hasChinese ? 'zh-TW' : 'en-US');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = targetLang;
    utterance.rate = options.rate !== undefined ? options.rate : (hasChinese ? 1.0 : 0.85);
    utterance.pitch = options.pitch !== undefined ? options.pitch : 1.0;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (hasChinese && !options.lang) {
      selectedVoice = voices.find(
        (v) => v.lang.startsWith('zh') && (v.name.includes('Taiwan') || v.name.includes('TW') || v.name.includes('Han') || v.name.includes('Mei-Jia') || v.name.includes('Google'))
      ) || voices.find((v) => v.lang.startsWith('zh'));
    } else {
      selectedVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen'))
      ) || voices.find((v) => v.lang.startsWith('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

