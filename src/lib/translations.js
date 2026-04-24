// Centralized translations object for UI, emails and PDFs
export const translations = {
  en: {
    'Sending Report...': 'Sending Report...',
    '📧 Send Report': '📧 Send Report',
    '✅ Success! Report sent to': '✅ Success! Report sent to',
    'email(s):': 'email(s):',
    '❌ Error:': '❌ Error:',
    '❌ Error: Failed to send report. Please try again.': '❌ Error: Failed to send report. Please try again.',
    'Sample:': 'Sample:',
    'Enter Your Soil Sample Data': 'Enter Your Soil Sample Data',
    'Manual — Soil': 'Manual — Soil',
    'Manual — Water (water pH)': 'Manual — Water (water pH)',
    'ThingSpeak — Soil': 'ThingSpeak — Soil',
    'ThingSpeak — Water': 'ThingSpeak — Water',
    'Sample Number (e.g. S1)': 'Sample Number (e.g. S1)',
    'Email for report': 'Email for report',
    'Soil Moisture': 'Soil Moisture',
    'Soil EC': 'Soil EC',
    'Soil Humidity': 'Soil Humidity',
    'Soil pH': 'Soil pH',
    'Add Sample': 'Add Sample',
    'Finish': 'Finish',
    'No fertilizer recommendations based on current soil conditions.': 'No fertilizer recommendations based on current soil conditions.',
    'sample(s) added.': 'sample(s) added.',
  },
  hi: {
    'Sending Report...': 'रिपोर्ट भेजी जा रही है...',
    '📧 Send Report': '📧 रिपोर्ट भेजें',
    '✅ Success! Report sent to': '✅ सफलता! रिपोर्ट भेजी गई:',
    'email(s):': 'ईमेल(स):',
    '❌ Error:': '❌ त्रुटि:',
    '❌ Error: Failed to send report. Please try again.': '❌ त्रुटि: रिपोर्ट भेजने में विफल। कृपया पुनः प्रयास करें।',
    'Sample:': 'नमूना:',
    'Enter Your Soil Sample Data': 'अपना मिट्टी नमूना डेटा दर्ज करें',
    'Manual — Soil': 'मैन्युअल — मिट्टी',
    'Manual — Water (water pH)': 'मैन्युअल — पानी (पानी pH)',
    'ThingSpeak — Soil': 'ThingSpeak — मिट्टी',
    'ThingSpeak — Water': 'ThingSpeak — पानी',
    'Sample Number (e.g. S1)': 'नमूना संख्या (उदा. S1)',
    'Email for report': 'रिपोर्ट के लिए ईमेल',
    'Soil Moisture': 'मिट्टी की नमी',
    'Soil EC': 'मिट्टी EC',
    'Soil Humidity': 'मिट्टी आर्द्रता',
    'Soil pH': 'मिट्टी pH',
    'Add Sample': 'नमूना जोड़ें',
    'Finish': 'समाप्त',
  }
};

export function getTranslation(language = 'en', key, params = {}) {
  const lang = translations[language] || {};
  const en = translations['en'] || {};
  let str = lang[key] || en[key] || key;
  try {
    Object.keys(params).forEach(p => {
      const re = new RegExp(`\\{${p}\\}`, 'g');
      str = str.replace(re, String(params[p]));
    });
  } catch (e) {
    // ignore interpolation errors
  }
  return str;
}

export function getTranslations(language = 'en') {
  return {
    ...(translations['en'] || {}),
    ...(translations[language] || {})
  };
}
