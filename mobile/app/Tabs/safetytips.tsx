import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/* ================= REAL & USEFUL CONTENT ================= */

const TEXT = {
  header: {
    en: 'Safe Travel Guide – Northern Areas',
    ur: 'شمالی علاقوں کے لیے محفوظ سفر کی مکمل رہنمائی',
  },

  mountainDriving: {
    title: {
      en: 'Mountain Driving Safety',
      ur: 'پہاڑی علاقوں میں ڈرائیونگ کی حفاظت',
    },
    en: [
      'Use engine braking while descending instead of continuous brakes.',
      'Avoid overtaking on blind curves or narrow mountain roads.',
      'Keep your vehicle in lower gear on steep climbs and descents.',
      'Do not stop the vehicle in the middle of narrow roads.',
      'Always give way to vehicles climbing uphill.',
      'Check brake condition before entering mountainous terrain.',
    ],
    ur: [
      'نیچے اترتے وقت مسلسل بریک کے بجائے انجن بریکنگ استعمال کریں۔',
      'اندھے موڑ یا تنگ پہاڑی سڑکوں پر اوورٹیک نہ کریں۔',
      'چڑھائی اور اترائی پر گاڑی کم گیئر میں رکھیں۔',
      'تنگ سڑک کے درمیان گاڑی نہ روکیں۔',
      'اوپر چڑھنے والی گاڑی کو ہمیشہ راستہ دیں۔',
      'پہاڑی علاقے میں داخل ہونے سے پہلے بریک چیک کریں۔',
    ],
  },

  weatherSafety: {
    title: {
      en: 'Weather & Road Conditions',
      ur: 'موسم اور سڑک کی صورتحال',
    },
    en: [
      'Check weather updates from official sources before departure.',
      'Avoid traveling during heavy rain due to landslide risks.',
      'Fog can reduce visibility significantly in early mornings.',
      'Snowfall can block roads for hours or days in remote areas.',
      'Always keep buffer time in case roads are closed.',
    ],
    ur: [
      'سفر سے پہلے سرکاری ذرائع سے موسم کی تازہ صورتحال چیک کریں۔',
      'لینڈ سلائیڈ کے خطرے کے باعث شدید بارش میں سفر نہ کریں۔',
      'صبح کے وقت دھند نظر کو شدید متاثر کر سکتی ہے۔',
      'برفباری دور دراز علاقوں میں سڑکیں بند کر سکتی ہے۔',
      'سڑک بند ہونے کی صورت میں اضافی وقت ساتھ رکھیں۔',
    ],
  },

  vehiclePrep: {
    title: {
      en: 'Vehicle Preparation',
      ur: 'گاڑی کی تیاری',
    },
    en: [
      'Ensure spare tire, jack, and toolkit are available.',
      'Fuel stations are limited; refuel whenever possible.',
      'Check engine oil, coolant, and brake fluid levels.',
      'Carry power bank and car charger for mobile phones.',
      'Keep headlights and fog lights fully functional.',
    ],
    ur: [
      'اسپیئر ٹائر، جیک اور ٹول کٹ ضرور ساتھ رکھیں۔',
      'پیٹرول پمپ کم ہوتے ہیں، موقع ملتے ہی فیول بھروائیں۔',
      'انجن آئل، کولنٹ اور بریک فلوئڈ چیک کریں۔',
      'موبائل کے لیے پاور بینک اور کار چارجر رکھیں۔',
      'ہیڈلائٹس اور فوگ لائٹس درست حالت میں ہوں۔',
    ],
  },

  emergency: {
    title: {
      en: 'Emergency & Communication',
      ur: 'ہنگامی صورتحال اور رابطہ',
    },
    en: [
      'Mobile network may not be available in remote valleys.',
      'Inform a trusted person about your travel route.',
      'Keep emergency numbers written offline.',
      'Know the nearest police post or medical facility.',
      'Avoid traveling alone at night in isolated areas.',
    ],
    ur: [
      'دور دراز وادیوں میں موبائل نیٹ ورک دستیاب نہیں ہوتا۔',
      'اپنے سفر کے راستے کی اطلاع کسی قابلِ اعتماد شخص کو دیں۔',
      'ہنگامی نمبرز کاغذ پر لکھ کر رکھیں۔',
      'قریبی پولیس پوسٹ یا طبی مرکز کی معلومات رکھیں۔',
      'سنسان علاقوں میں رات کو اکیلے سفر سے گریز کریں۔',
    ],
  },
};

export default function SafetyTips() {
  const [isEnglish, setIsEnglish] = useState(true);
  const lang = isEnglish ? 'en' : 'ur';

  const [open, setOpen] = useState({
    mountain: false,
    weather: false,
    vehicle: false,
    emergency: false,
  });

  const toggle = (key: keyof typeof open) =>
    setOpen({ ...open, [key]: !open[key] });

  const showContacts = () => {
    Alert.alert(
      isEnglish ? 'Emergency & Advisors Contact' : 'ہنگامی اور رہنمائی رابطے',
      isEnglish
        ? `Police: 15
Ambulance: 115
Rescue: 1122

Tourist Police Helpline:
1422

Travel Advisory:
Always follow local administration instructions.`
        : `پولیس: 15
ایمبولینس: 115
ریسکیو: 1122

ٹورسٹ پولیس ہیلپ لائن:
1422

سفری ہدایات:
ہمیشہ مقامی انتظامیہ کی ہدایات پر عمل کریں۔`,
      [{ text: isEnglish ? 'OK' : 'ٹھیک ہے' }],
    );
  };

  const renderCard = (
    title: string,
    openState: boolean,
    onPress: () => void,
    items: string[],
  ) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={onPress}>
        <Text style={styles.cardTitle}>{title}</Text>
        <MaterialCommunityIcons
          name={openState ? 'chevron-up' : 'chevron-down'}
          size={26}
          color="#2E8B57"
        />
      </TouchableOpacity>

      {openState && (
        <View style={styles.content}>
          {items.map((item, i) => (
            <Text key={i} style={styles.text}>
              {i + 1}. {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Language Toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.langText}>{isEnglish ? 'English' : 'Urdu'}</Text>
        <Switch value={isEnglish} onValueChange={() => setIsEnglish(!isEnglish)} />
      </View>

      <Text style={styles.header}>{TEXT.header[lang]}</Text>

      {renderCard(
        TEXT.mountainDriving.title[lang],
        open.mountain,
        () => toggle('mountain'),
        TEXT.mountainDriving[lang],
      )}

      {renderCard(
        TEXT.weatherSafety.title[lang],
        open.weather,
        () => toggle('weather'),
        TEXT.weatherSafety[lang],
      )}

      {renderCard(
        TEXT.vehiclePrep.title[lang],
        open.vehicle,
        () => toggle('vehicle'),
        TEXT.vehiclePrep[lang],
      )}

      {renderCard(
        TEXT.emergency.title[lang],
        open.emergency,
        () => toggle('emergency'),
        TEXT.emergency[lang],
      )}

      {/* ===== FINAL CONTACT BUTTON ===== */}
      <TouchableOpacity style={styles.contactButton} onPress={showContacts}>
        <MaterialCommunityIcons name="phone-alert" size={22} color="#fff" />
        <Text style={styles.contactButtonText}>
          {isEnglish
            ? 'Emergency & Advisors Contact'
            : 'ہنگامی اور رہنمائی رابطہ'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FFF4',
    padding: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
    marginTop:30
  },
  langText: {
    marginRight: 8,
    fontSize: 16,
    color: '#2E8B57',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E8B57',
  },
  content: {
    marginTop: 10,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
    color: '#2E4B36',
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: '#2E8B57',
    padding: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
