// app/Tabs/safetytips.tsx — Safety Guide (Light + Dark Green)
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Theme ───
const G = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  darkGreen: '#1A4D2E',
  midGreen: '#2D7A4D',
  lightGreen: '#E8F5ED',
  text: '#1A1A1A',
  sub: '#6B7280',
  border: '#D1E8D9',
};

// ─── Content ───
const SECTIONS = [
  {
    key: 'mountain',
    icon: 'terrain' as const,
    color: '#1A4D2E',
    title: { en: 'Mountain Driving Safety', ur: 'پہاڑی علاقوں میں ڈرائیونگ کی حفاظت' },
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
  {
    key: 'weather',
    icon: 'weather-partly-cloudy' as const,
    color: '#3B9EE8',
    title: { en: 'Weather & Road Conditions', ur: 'موسم اور سڑک کی صورتحال' },
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
  {
    key: 'vehicle',
    icon: 'car-wrench' as const,
    color: '#8B5CF6',
    title: { en: 'Vehicle Preparation', ur: 'گاڑی کی تیاری' },
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
  {
    key: 'emergency',
    icon: 'phone-alert' as const,
    color: '#E95B5B',
    title: { en: 'Emergency & Communication', ur: 'ہنگامی صورتحال اور رابطہ' },
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
];

const HEADER_TEXT = {
  en: 'Safe Travel Guide',
  ur: 'محفوظ سفر کی رہنمائی',
};

export default function SafetyTips() {
  const insets = useSafeAreaInsets();
  const [isEnglish, setIsEnglish] = useState(true);
  const lang = isEnglish ? 'en' : 'ur';
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpenKeys(prev => ({ ...prev, [key]: !prev[key] }));

  const showContacts = () => {
    Alert.alert(
      isEnglish ? 'Emergency Contacts' : 'ہنگامی رابطے',
      isEnglish
        ? `🚔 Police: 15\n🚑 Ambulance: 115\n🚒 Rescue: 1122\n📞 Tourist Police: 1422\n\nAlways follow local administration instructions.`
        : `🚔 پولیس: 15\n🚑 ایمبولینس: 115\n🚒 ریسکیو: 1122\n📞 ٹورسٹ پولیس: 1422\n\nہمیشہ مقامی انتظامیہ کی ہدایات پر عمل کریں۔`,
      [{ text: isEnglish ? 'OK' : 'ٹھیک ہے' }],
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ─── Hero ─── */}
        <LinearGradient colors={[G.darkGreen, G.midGreen]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.heroDeco} />
          <View style={styles.heroRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{HEADER_TEXT[lang]}</Text>
              <Text style={styles.heroSub}>{isEnglish ? 'Northern Areas Edition' : 'شمالی علاقوں کا ایڈیشن'}</Text>
            </View>
          </View>

          {/* Language Toggle */}
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[styles.langBtn, isEnglish && styles.langActive]}
              onPress={() => setIsEnglish(true)}
            >
              <Text style={[styles.langText, isEnglish && { color: G.darkGreen }]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, !isEnglish && styles.langActive]}
              onPress={() => setIsEnglish(false)}
            >
              <Text style={[styles.langText, !isEnglish && { color: G.darkGreen }]}>اردو</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ─── Sections ─── */}
        <View style={styles.body}>
          {SECTIONS.map((section) => {
            const isOpen = !!openKeys[section.key];
            const items = section[lang];
            return (
              <View key={section.key} style={styles.card}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggle(section.key)} activeOpacity={0.7}>
                  <View style={[styles.cardIconWrap, { backgroundColor: section.color + '18' }]}>
                    <MaterialCommunityIcons name={section.icon} size={20} color={section.color} />
                  </View>
                  <Text style={styles.cardTitle}>{section.title[lang]}</Text>
                  <View style={[styles.chevronWrap, isOpen && { backgroundColor: G.lightGreen }]}>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={isOpen ? G.midGreen : G.sub} />
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.cardContent}>
                    {items.map((item: string, i: number) => (
                      <View key={i} style={styles.tipRow}>
                        <View style={styles.tipDot}>
                          <Text style={styles.tipNum}>{i + 1}</Text>
                        </View>
                        <Text style={styles.tipText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {/* ─── Emergency Contact ─── */}
          <TouchableOpacity onPress={showContacts} activeOpacity={0.88} style={{ marginTop: 6 }}>
            <LinearGradient colors={[G.darkGreen, G.midGreen]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.contactBtn}>
              <MaterialCommunityIcons name="phone-alert" size={20} color="#fff" />
              <Text style={styles.contactText}>
                {isEnglish ? 'Emergency Contacts' : 'ہنگامی رابطے'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },

  // Hero
  hero: { paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  heroDeco: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  heroIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Lang toggle
  langToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 4, gap: 4 },
  langBtn: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: 'center' },
  langActive: { backgroundColor: '#fff' },
  langText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },

  // Body
  body: { paddingHorizontal: 16, marginTop: 20 },

  // Cards
  card: {
    backgroundColor: G.card,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: G.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: G.darkGreen, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: {
    flex: 1, fontSize: 15, fontWeight: '700', color: G.text,
  },
  chevronWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },

  // Card content
  cardContent: {
    paddingHorizontal: 16, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: G.border,
    marginTop: 0, paddingTop: 14,
  },
  tipRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginBottom: 10,
  },
  tipDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: G.lightGreen,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 1,
  },
  tipNum: {
    fontSize: 11, fontWeight: '800', color: G.midGreen,
  },
  tipText: {
    flex: 1, fontSize: 14, lineHeight: 21, color: '#374151',
  },

  // Contact Button
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 18, borderRadius: 18,
    ...Platform.select({
      ios: { shadowColor: G.darkGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  contactText: {
    color: '#fff', fontWeight: '800', fontSize: 15, flex: 1, textAlign: 'center',
  },
});
