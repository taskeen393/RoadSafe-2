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
import { COLORS, RADIUS, SPACING } from '../../constants/globalStyles';
import { chatbotService } from '../services';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  isError?: boolean;
};

const WELCOME_MESSAGE: Message = {
  id: 0,
  text: 'Hello! I am your Road Safety Assistant. Ask me anything about traffic rules, driving safety, road signs, or emergency guidance.',
  sender: 'bot',
};

export default function ChatbotScreen() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = useCallback(async () => {
    if (!message.trim() || loading) return;

    const userText = message.trim();
    setChat(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
    setMessage('');
    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(userText);
      setChat(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: response.reply || 'No reply received.',
          sender: 'bot',
          isError: !response.success,
        },
      ]);
    } catch (err: any) {
      setChat(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: 'Unable to reach the server. Tap to retry.',
          sender: 'bot',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [message, loading]);

  const handleRetry = useCallback(async (errorMsgId: number) => {
    const errorIndex = chat.findIndex(m => m.id === errorMsgId);
    if (errorIndex <= 0) return;

    const userMsg = chat[errorIndex - 1];
    if (userMsg.sender !== 'user') return;

    setChat(prev => prev.filter(m => m.id !== errorMsgId));
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(userMsg.text);
      setChat(prev => [
        ...prev,
        {
          id: Date.now(),
          text: response.reply || 'No reply received.',
          sender: 'bot',
          isError: !response.success,
        },
      ]);
    } catch {
      setChat(prev => [
        ...prev,
        {
          id: Date.now(),
          text: 'Still unable to connect. Please check your network.',
          sender: 'bot',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [chat]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chat]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <MaterialCommunityIcons name="robot-happy" size={28} color={COLORS.textWhite} />
        </View>
        <Text style={styles.title}>Road Safety AI</Text>
        <Text style={styles.subtitle}>Ask me anything about road safety</Text>
      </View>

      {/* Chat Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {chat.map(item => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={item.isError ? 0.6 : 1}
            onPress={item.isError ? () => handleRetry(item.id) : undefined}
            disabled={!item.isError || loading}
            style={[
              styles.bubble,
              item.sender === 'user' ? styles.userBubble : styles.botBubble,
              item.isError && styles.errorBubble,
            ]}
          >
            <Text
              style={[
                styles.text,
                item.sender === 'user' ? styles.userText : styles.botText,
                item.isError && styles.errorText,
              ]}
            >
              {item.text}
            </Text>
            {item.isError && (
              <View style={styles.retryHint}>
                <MaterialCommunityIcons name="refresh" size={14} color={COLORS.accentRed} />
                <Text style={styles.retryLabel}>Tap to retry</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.botBubble, { paddingVertical: 14 }]}>
            <View style={styles.typingRow}>
              <ActivityIndicator color={COLORS.textWhite} size="small" />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about road safety..."
          placeholderTextColor={COLORS.textLight}
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          maxLength={500}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!message.trim() || loading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || loading}
        >
          <MaterialCommunityIcons name="send" size={20} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgScreen,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  botAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
  },
  bubble: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginVertical: SPACING.xs,
    maxWidth: '78%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.emerald,
    borderBottomRightRadius: SPACING.xs,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.emeraldDark,
    borderBottomLeftRadius: SPACING.xs,
  },
  errorBubble: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: COLORS.textWhite,
  },
  botText: {
    color: COLORS.textWhite,
  },
  errorText: {
    color: COLORS.accentRed,
  },
  retryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  retryLabel: {
    fontSize: 12,
    color: COLORS.accentRed,
    fontWeight: '600',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.emerald,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
