// components/ChatbotFAB.tsx
// Floating Action Button that opens the AI Chatbot as a modal overlay
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { RADIUS, SPACING } from '../constants/globalStyles';
import { useTheme } from '../app/context/ThemeContext';
import { chatbotService } from '../app/services';

type Message = {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    isError?: boolean;
};

const DEBOUNCE_MS = 300;

const WELCOME_MESSAGE: Message = {
    id: 0,
    text: 'Hello! I am your Road Safety Assistant. Ask me anything about traffic rules, driving safety, road signs, or emergency guidance.',
    sender: 'bot',
};

export default function ChatbotFAB() {
    const { colors: G, isDark } = useTheme();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState<Message[]>([WELCOME_MESSAGE]);
    const [loading, setLoading] = useState(false);
    const [isSendDisabled, setIsSendDisabled] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pulse animation on mount
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.07, duration: 1400, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Debounced send
    const handleSend = useCallback(async () => {
        if (!message.trim() || loading || isSendDisabled) return;

        setIsSendDisabled(true);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        const userText = message.trim();
        const userMsgId = Date.now();
        setChat(prev => [...prev, { id: userMsgId, text: userText, sender: 'user' }]);
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
            debounceTimerRef.current = setTimeout(() => {
                setIsSendDisabled(false);
            }, DEBOUNCE_MS);
        }
    }, [message, loading, isSendDisabled]);

    // Retry failed message
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

    // Auto-scroll on new messages
    useEffect(() => {
        if (visible) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [chat, visible]);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    return (
        <>
            {/* ─── FAB Button ─── */}
            <Animated.View style={[styles.fabContainer, { transform: [{ scale: scaleAnim }] }]}>
                <View style={[styles.fabGlow, { backgroundColor: G.midGreen }]} />
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: G.midGreen, shadowColor: G.midGreen }]}
                    onPress={() => setVisible(true)}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="robot-happy" size={24} color="#fff" />
                </TouchableOpacity>
            </Animated.View>

            {/* ─── Chatbot Modal ─── */}
            <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
                <View style={[styles.modalOverlay, { backgroundColor: G.overlay }]}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={[styles.modalContainer, { backgroundColor: G.card }]}
                    >
                        {/* Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: G.border }]}>
                            <View style={styles.headerLeft}>
                                <View style={[styles.botAvatar, { backgroundColor: G.midGreen }]}>
                                    <MaterialCommunityIcons name="robot-happy" size={22} color="#fff" />
                                </View>
                                <View>
                                    <Text style={[styles.headerTitle, { color: G.text }]}>RoadSafe AI</Text>
                                    <Text style={[styles.headerSubtitle, { color: G.sub }]}>Road Safety Assistant</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setVisible(false)} style={[styles.closeBtn, { backgroundColor: G.chipBg }]}>
                                <MaterialCommunityIcons name="close" size={22} color={G.sub} />
                            </TouchableOpacity>
                        </View>

                        {/* Chat Area */}
                        <ScrollView
                            ref={scrollViewRef}
                            style={[styles.chatArea, { backgroundColor: G.bg }]}
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
                                        item.sender === 'user'
                                            ? [styles.userBubble, { backgroundColor: G.darkGreen }]
                                            : [styles.botBubble, { backgroundColor: isDark ? '#1A3A2A' : G.darkGreen }],
                                        item.isError && { backgroundColor: isDark ? '#3A1A1A' : '#FEE2E2', borderWidth: 1, borderColor: isDark ? '#5A2A2A' : '#FECACA' },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.bubbleText,
                                            item.isError ? { color: G.red } : { color: '#fff' },
                                        ]}
                                    >
                                        {item.text}
                                    </Text>
                                    {item.isError && (
                                        <View style={styles.retryHint}>
                                            <MaterialCommunityIcons name="refresh" size={14} color={G.red} />
                                            <Text style={[styles.retryText, { color: G.red }]}>Tap to retry</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}

                            {loading && (
                                <View style={[styles.bubble, styles.botBubble, { paddingVertical: 14, backgroundColor: isDark ? '#1A3A2A' : G.darkGreen }]}>
                                    <View style={styles.typingIndicator}>
                                        <ActivityIndicator color="#fff" size="small" />
                                        <Text style={styles.typingText}>Thinking...</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Input Bar */}
                        <View style={[styles.inputBar, { backgroundColor: G.card, borderTopColor: G.border }]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: G.inputBg, borderColor: G.border, color: G.text }]}
                                placeholder="Ask about road safety..."
                                placeholderTextColor={G.sub}
                                value={message}
                                onChangeText={setMessage}
                                onSubmitEditing={handleSend}
                                returnKeyType="send"
                                maxLength={500}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, { backgroundColor: G.midGreen }, (!message.trim() || loading) && styles.sendBtnDisabled]}
                                onPress={handleSend}
                                disabled={!message.trim() || loading}
                            >
                                <MaterialCommunityIcons name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // FAB
    fabContainer: {
        position: 'absolute', bottom: 95, right: 20, zIndex: 999,
        alignItems: 'center', justifyContent: 'center',
    },
    fabGlow: { position: 'absolute', width: 62, height: 62, borderRadius: 31, opacity: 0.25 },
    fab: {
        width: 52, height: 52, borderRadius: 26,
        justifyContent: 'center', alignItems: 'center',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
    },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContainer: { height: '85%', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden' },

    // Header
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    botAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, marginTop: 1 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    // Chat
    chatArea: { flex: 1 },
    bubble: { padding: SPACING.md, borderRadius: RADIUS.lg, marginVertical: SPACING.xs, maxWidth: '78%' },
    userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: SPACING.xs },
    botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: SPACING.xs },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    retryHint: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
    retryText: { fontSize: 12, fontWeight: '600' },
    typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typingText: { color: '#fff', fontSize: 13, fontStyle: 'italic' },

    // Input
    inputBar: {
        flexDirection: 'row', padding: SPACING.md, alignItems: 'center', borderTopWidth: 1,
    },
    input: {
        flex: 1, borderRadius: RADIUS.xl,
        paddingHorizontal: SPACING.lg, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        fontSize: 15, borderWidth: 1,
    },
    sendBtn: {
        marginLeft: SPACING.sm, width: 42, height: 42, borderRadius: 21,
        justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
});
