import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FONT, FONT_SIZE, RADIUS, SPACING } from '../../constants/globalStyles';
import { useTheme } from '../context/ThemeContext';
import { sendMessage as sendChatMessage } from '../services/chatbotService';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  isError?: boolean;
  timestamp: Date;
};

// ── Formatted text renderer ──────────────────────────
function FormattedText({ text, color, isDark }: { text: string; color: string; isDark: boolean }) {
  const lines = text.split('\n');
  const accent = isDark ? '#4CAF50' : '#2D7A4D';

  return (
    <View style={fmtStyles.container}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} style={fmtStyles.spacer} />;

        // Bullet: - or •
        const bulletMatch = trimmed.match(/^[-•]\s+(.*)/);
        if (bulletMatch) {
          return (
            <View key={i} style={fmtStyles.bulletRow}>
              <View style={[fmtStyles.bulletDot, { backgroundColor: accent }]} />
              <Text style={[fmtStyles.text, { color }]} selectable>{bulletMatch[1]}</Text>
            </View>
          );
        }

        // Numbered: 1. or 1)
        const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
        if (numMatch) {
          return (
            <View key={i} style={fmtStyles.bulletRow}>
              <View style={[fmtStyles.numBadge, { backgroundColor: accent }]}>
                <Text style={fmtStyles.numText}>{numMatch[1]}</Text>
              </View>
              <Text style={[fmtStyles.text, { color }]} selectable>{numMatch[2]}</Text>
            </View>
          );
        }

        return <Text key={i} style={[fmtStyles.text, { color }]} selectable>{trimmed}</Text>;
      })}
    </View>
  );
}

const fmtStyles = StyleSheet.create({
  container: { gap: 6 },
  spacer: { height: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 4 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  numBadge: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  numText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  text: { fontSize: 14.5, lineHeight: 22, flex: 1 },
});

// ── Typing dots ───────────────────────────────────────
function TypingDots({ color }: { color: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ]));
    Animated.parallel([anim(dot1, 0), anim(dot2, 200), anim(dot3, 400)]).start();
  }, [dot1, dot2, dot3]);

  const s = (d: Animated.Value) => ({
    opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 6 }}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }, s(d)]} />
      ))}
    </View>
  );
}

// ── Time formatter ────────────────────────────────────
const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ══════════════════════════════════════════════════════
//  Chatbot Screen
// ══════════════════════════════════════════════════════
export default function ChatbotScreen() {
  const { colors: C, isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your road safety assistant.\n\nAsk me anything about:\n- Safe driving tips and best practices\n- Traffic rules and regulations\n- Weather hazards and precautions\n- Emergency contacts and procedures\n- Road signs and their meanings",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    Keyboard.dismiss();
    setInput('');

    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user', timestamp: new Date() }]);
    setLoading(true);

    try {
      const result = await sendChatMessage(text);
      const reply = result.reply ?? 'No response from server.';
      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot', timestamp: new Date() }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: 'Something went wrong. Please try again.', sender: 'bot', isError: true, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  // ── Dynamic colours ─────────────────────────────────
  const userBubbleBg = C.darkGreen;
  const botBubbleBg = isDark ? '#1E2D24' : '#F0F5F1';
  const botAvatarBg = isDark ? '#1B3A2A' : '#E0EDE4';
  const inputBarBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const inputFieldBg = isDark ? '#262626' : '#F4F7F4';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── Messages ─────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messageList}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <View key={msg.id} style={[styles.messageRow, isUser && styles.messageRowUser]}>
              {/* Bot avatar */}
              {!isUser && (
                <View style={[styles.avatar, { backgroundColor: botAvatarBg }]}>
                  <MaterialCommunityIcons name="robot-outline" size={18} color={C.midGreen} />
                </View>
              )}

              {/* Bubble */}
              <View style={[
                styles.bubble,
                {
                  backgroundColor: msg.isError ? (isDark ? '#3A1A1A' : '#FEF2F2') : isUser ? userBubbleBg : botBubbleBg,
                  borderColor: msg.isError ? (isDark ? '#5A2A2A' : '#FECACA') : 'transparent',
                  borderWidth: msg.isError ? 1 : 0,
                },
              ]}>
                {/* Label */}
                {!isUser && !msg.isError && (
                  <Text style={[styles.senderLabel, { color: C.midGreen }]}>Road Safety AI</Text>
                )}

                {/* Content */}
                {msg.isError ? (
                  <Text style={[fmtStyles.text, { color: C.red }]}>{msg.text}</Text>
                ) : isUser ? (
                  <Text style={[fmtStyles.text, { color: '#FFFFFF' }]}>{msg.text}</Text>
                ) : (
                  <FormattedText text={msg.text} color={C.text} isDark={isDark} />
                )}

                {/* Timestamp */}
                <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.5)' : C.sub }]}>
                  {fmtTime(msg.timestamp)}
                </Text>
              </View>

              {/* User avatar */}
              {isUser && (
                <View style={[styles.avatar, { backgroundColor: isDark ? '#1A4D2E' : '#2D7A4D' }]}>
                  <MaterialCommunityIcons name="account" size={18} color="#FFFFFF" />
                </View>
              )}
            </View>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <View style={styles.messageRow}>
            <View style={[styles.avatar, { backgroundColor: botAvatarBg }]}>
              <MaterialCommunityIcons name="robot-outline" size={18} color={C.midGreen} />
            </View>
            <View style={[styles.bubble, { backgroundColor: botBubbleBg }]}>
              <Text style={[styles.senderLabel, { color: C.midGreen }]}>Road Safety AI</Text>
              <TypingDots color={C.midGreen} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input Bar ────────────────────────────────── */}
      <View style={[styles.inputBar, { backgroundColor: inputBarBg, borderTopColor: C.border }]}>
        <View style={[styles.inputField, { backgroundColor: inputFieldBg, borderColor: C.border }]}>
          <TextInput
            style={[styles.textInput, { color: C.text }]}
            placeholder="Ask about road safety..."
            placeholderTextColor={C.sub}
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() && !loading ? C.darkGreen : isDark ? '#333' : '#D1D5DB' },
          ]}
          onPress={handleSend}
          disabled={loading || !input.trim()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="send"
            size={20}
            color={input.trim() && !loading ? '#FFFFFF' : isDark ? '#666' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  messageList: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  messageRowUser: { justifyContent: 'flex-end' },

  avatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },

  bubble: {
    maxWidth: '78%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },

  senderLabel: {
    fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 6,
  },

  timestamp: { fontSize: 10, marginTop: 8, textAlign: 'right' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    borderTopWidth: 1, gap: SPACING.sm,
  },
  inputField: {
    flex: 1, borderWidth: 1, borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    maxHeight: 100,
  },
  textInput: { fontSize: FONT_SIZE.body, lineHeight: 20, maxHeight: 80 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 1,
  },
});
