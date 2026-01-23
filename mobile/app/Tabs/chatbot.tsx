import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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

// Import chatbot service
import { chatbotService } from '../services';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
};

export default function ChatbotScreen() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userText = message;
    setChat(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
    setMessage('');
    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(userText);

      setChat(prev => [
        ...prev,
        { id: Date.now() + 1, text: response.bot || 'No reply', sender: 'bot' }
      ]);

    } catch (err: any) {
      console.log('CHATBOT ERROR:', err);
      setChat(prev => [
        ...prev,
        { id: Date.now() + 1, text: 'Server not reachable', sender: 'bot' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chat]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="robot" size={48} color="#2E8B57" />
        <Text style={styles.title}>ChatBot</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={{ padding: 15 }}
        keyboardShouldPersistTaps="handled"
      >
        {chat.length === 0 && (
          <Text style={styles.placeholder}>Type a message to start chatting</Text>
        )}

        {chat.map(item => (
          <View
            key={item.id}
            style={[
              styles.bubble,
              item.sender === 'user' ? styles.userBubble : styles.botBubble
            ]}
          >
            <Text
              style={[
                styles.text,
                item.sender === 'user' ? styles.userText : styles.botText
              ]}
            >
              {item.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.botBubble}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <MaterialCommunityIcons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F5E9' },
  header: { alignItems: 'center', paddingVertical: 20, backgroundColor: '#F9FFF9' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2E8B57', marginTop: 5 },
  chatArea: { flex: 1 },
  placeholder: { textAlign: 'center', color: '#555', marginTop: 120, fontStyle: 'italic' },
  bubble: { padding: 12, borderRadius: 18, marginVertical: 6, maxWidth: '75%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#C8E6C9' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#2E7D32' },
  text: { fontSize: 16 },
  userText: { color: '#1B5E20' },
  botText: { color: '#fff' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#F9FFF9', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F1F8E9', borderRadius: 25, paddingHorizontal: 18, paddingVertical: 10, fontSize: 16 },
  sendBtn: { marginLeft: 10, backgroundColor: '#2E7D32', padding: 12, borderRadius: 50 },
});
