/**
 * Pronunciation utility using Web Speech API with Google Translate fallback
 */

export function playPronunciation(text: string, langCode: string): boolean {
  if ("speechSynthesis" in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.8;
    utterance.pitch = 1;

    // Check if the language is supported
    const voices = window.speechSynthesis.getVoices();
    const hasVoice = voices.some((v) => v.lang.startsWith(langCode.split("-")[0]));

    if (hasVoice || voices.length === 0) {
      // voices.length === 0 means voices haven't loaded yet, try anyway
      window.speechSynthesis.speak(utterance);
      return true;
    }
  }

  // Fallback to Google Translate
  openGoogleTranslate(text, langCode);
  return false;
}

export function openGoogleTranslate(text: string, langCode: string): void {
  const sl = langCode.split("-")[0];
  const url = `https://translate.google.com/?sl=${sl}&tl=en&text=${encodeURIComponent(text)}&op=translate`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareToTwitter(text: string, url: string): void {
  const fullText = `${text}\n${url}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;
  window.open(tweetUrl, "_blank", "noopener,noreferrer");
}

export function shareToFacebook(url: string, text?: string): void {
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text || '')}`;
  window.open(fbUrl, "_blank", "noopener,noreferrer");
}

export function shareToWhatsApp(text: string, url: string): void {
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
