import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { RADIUS, SPACING } from '../../constants/globalStyles';
import { useTheme } from '../context/ThemeContext';
import { chatbotService } from '../services';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  isError?: boolean;
};

export default function ChatbotScreen() {
  const { colors: G, isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi! I'm your road safety assistant. Ask me about safe driving, weather hazards, or emergency contacts.", sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    Keyboard.dismiss();
    setInput('');

    const userMsg: Message = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await chatbotService.chat(text);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Something went wrong. Try again later.', sender: 'bot', isError: true }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: G.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.chatList}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View key={msg.id} style={[styles.bubble, isUser
              ? { backgroundColor: G.darkGreen, alignSelf: 'flex-end' }
              : { backgroundColor: G.card, alignSelf: 'flex-start', borderWidth: 1, borderColor: G.border }
            ]}>
              {!isUser && (
                <MaterialCommunityIcons name="robot-outline" size={16} color={G.midGreen} style={{ marginBottom: 4 }} />
              )}
              <Text style={[styles.bubbleText, { color: isUser ? '#fff' : msg.isError ? G.red : G.text }]}>{msg.text}</Text>
            </View>
          );
        })}
        {loading && (
          <View style={[styles.bubble, { backgroundColor: G.card, alignSelf: 'flex-start', borderWidth: 1, borderColor: G.border }]}>
            <ActivityIndicator size="small" color={G.midGreen} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { backgroundColor: G.card, borderTopColor: G.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: G.inputBg, borderColor: G.border, color: G.text }]}
          placeholder="Ask about road safety..."
          placeholderTextColor={G.sub}
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: G.darkGreen }]}
          onPress={sendMessage}
          disabled={loading || !input.trim()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatList: { padding: SPACING.md, gap: SPACING.sm },
  bubble: {
    maxWidth: '80%', padding: SPACING.md, borderRadius: RADIUS.lg,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.sm,
    borderTopWidth: 1, gap: SPACING.xs,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    fontSize: 15,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
});
