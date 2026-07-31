export const TRANSLATION_LANGUAGES = [
  ["en", "English"],
  ["hi", "Hindi"],
  ["bn", "Bengali"],
  ["gu", "Gujarati"],
  ["mr", "Marathi"],
  ["pa", "Punjabi"],
  ["ta", "Tamil"],
  ["te", "Telugu"],
  ["ur", "Urdu"],
  ["ne", "Nepali"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["de", "German"],
  ["it", "Italian"],
  ["pt", "Portuguese"],
  ["ru", "Russian"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["zh", "Chinese"],
  ["ar", "Arabic"],
];

export const getLanguageName = (code) =>
  TRANSLATION_LANGUAGES.find(([value]) => value === code)?.[1] || code;
