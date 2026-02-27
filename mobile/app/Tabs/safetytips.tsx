// app/Tabs/safetytips.tsx — Safety Guide (Light + Dark Theme)
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

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
  const { colors: G, isDark } = useTheme();
  const [isEnglish, setIsEnglish] = useState(true);
  const lang = isEnglish ? 'en' : 'ur';
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
  const [contactsVisible, setContactsVisible] = useState(false);

  const toggle = (key: string) => setOpenKeys(prev => ({ ...prev, [key]: !prev[key] }));

  const showContacts = () => setContactsVisible(true);

  const CONTACTS = [
    { emoji: '🚔', label: { en: 'Police', ur: 'پولیس' }, number: '15', color: '#3B82F6' },
    { emoji: '🚑', label: { en: 'Ambulance', ur: 'ایمبولینس' }, number: '115', color: '#EF4444' },
    { emoji: '🚒', label: { en: 'Rescue', ur: 'ریسکیو' }, number: '1122', color: '#F97316' },
    { emoji: '📞', label: { en: 'Tourist Police', ur: 'ٹورسٹ پولیس' }, number: '1422', color: '#8B5CF6' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: G.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ─── Hero ─── */}
        <LinearGradient colors={G.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
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
              <View key={section.key} style={[styles.card, {
                backgroundColor: G.card, borderColor: G.border,
                ...Platform.select({
                  ios: { shadowColor: isDark ? '#000' : G.darkGreen, shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 10 },
                  android: { elevation: 3 },
                }),
              }]}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggle(section.key)} activeOpacity={0.7}>
                  <View style={[styles.cardIconWrap, { backgroundColor: section.color + '18' }]}>
                    <MaterialCommunityIcons name={section.icon} size={20} color={section.color} />
                  </View>
                  <Text style={[styles.cardTitle, { color: G.text }]}>{section.title[lang]}</Text>
                  <View style={[styles.chevronWrap, { backgroundColor: isDark ? G.chipBg : '#F3F4F6' }, isOpen && { backgroundColor: G.lightGreen }]}>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={isOpen ? G.midGreen : G.sub} />
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={[styles.cardContent, { borderTopColor: G.border }]}>
                    {items.map((item: string, i: number) => (
                      <View key={i} style={styles.tipRow}>
                        <View style={[styles.tipDot, { backgroundColor: G.lightGreen }]}>
                          <Text style={[styles.tipNum, { color: G.midGreen }]}>{i + 1}</Text>
                        </View>
                        <Text style={[styles.tipText, { color: isDark ? G.sub : '#374151' }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {/* ─── Emergency Contact ─── */}
          <TouchableOpacity onPress={showContacts} activeOpacity={0.88} style={{ marginTop: 6 }}>
            <LinearGradient colors={[G.darkGreen, G.midGreen] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.contactBtn}>
              <MaterialCommunityIcons name="phone-alert" size={20} color="#fff" />
              <Text style={styles.contactText}>
                {isEnglish ? 'Emergency Contacts' : 'ہنگامی رابطے'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ─── Emergency Contacts Modal ─── */}
      <Modal visible={contactsVisible} transparent animationType="none" statusBarTranslucent onRequestClose={() => setContactsVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setContactsVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={[styles.modalCard, { backgroundColor: G.modalBg }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? '#444' : '#E5E7EB' }]} />
            <View style={[styles.modalIconCircle, { backgroundColor: isDark ? '#3A2020' : '#FEF2F2' }]}>
              <MaterialCommunityIcons name="phone-alert" size={28} color="#E95B5B" />
            </View>
            <Text style={[styles.modalTitle, { color: G.text }]}>
              {isEnglish ? 'Emergency Contacts' : 'ہنگامی رابطے'}
            </Text>
            {CONTACTS.map((c, i) => (
              <View key={i} style={[styles.contactRow, i < CONTACTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: G.divider }]}>
                <Text style={styles.contactEmoji}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactLabel, { color: isDark ? G.text : '#374151' }]}>{c.label[lang]}</Text>
                </View>
                <View style={[styles.contactNumBadge, { backgroundColor: c.color + '15' }]}>
                  <Text style={[styles.contactNum, { color: c.color }]}>{c.number}</Text>
                </View>
              </View>
            ))}
            <Text style={[styles.contactNote, { color: G.sub }]}>
              {isEnglish
                ? 'Always follow local administration instructions.'
                : 'ہمیشہ مقامی انتظامیہ کی ہدایات پر عمل کریں۔'}
            </Text>
            <TouchableOpacity style={[styles.contactCloseBtn, { backgroundColor: G.lightGreen }]} onPress={() => setContactsVisible(false)}>
              <Text style={[styles.contactCloseText, { color: G.midGreen }]}>{isEnglish ? 'OK' : 'ٹھیک ہے'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

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
  card: { borderRadius: 20, marginBottom: 14, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  chevronWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Card content
  cardContent: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, paddingTop: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tipDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  tipNum: { fontSize: 11, fontWeight: '800' },
  tipText: { flex: 1, fontSize: 14, lineHeight: 21 },

  // Contact Button
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 18, borderRadius: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  contactText: { color: '#fff', fontWeight: '800', fontSize: 15, flex: 1, textAlign: 'center' },

  // Emergency Contacts Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28, paddingTop: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 20 },
    }),
  },
  modalHandle: { width: 36, height: 5, borderRadius: 3, marginBottom: 20 },
  modalIconCircle: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, letterSpacing: -0.3 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, width: '100%', gap: 14 },
  contactEmoji: { fontSize: 24 },
  contactLabel: { fontSize: 15, fontWeight: '600' },
  contactNumBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  contactNum: { fontSize: 16, fontWeight: '800' },
  contactNote: { fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  contactCloseBtn: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 16 },
  contactCloseText: { fontSize: 15, fontWeight: '700' },
});
