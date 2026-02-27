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
import { COLORS, RADIUS, SPACING } from '../constants/globalStyles';
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

        // Debounce protection
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
            // Re-enable send after debounce delay
            debounceTimerRef.current = setTimeout(() => {
                setIsSendDisabled(false);
            }, DEBOUNCE_MS);
        }
    }, [message, loading, isSendDisabled]);

    // Retry failed message
    const handleRetry = useCallback(async (errorMsgId: number) => {
        // Find the user message just before the error
        const errorIndex = chat.findIndex(m => m.id === errorMsgId);
        if (errorIndex <= 0) return;

        const userMsg = chat[errorIndex - 1];
        if (userMsg.sender !== 'user') return;

        // Remove the error message
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
                {/* Soft glow ring */}
                <View style={styles.fabGlow} />
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setVisible(true)}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="robot-happy" size={24} color={COLORS.textWhite} />
                </TouchableOpacity>
            </Animated.View>

            {/* ─── Chatbot Modal ─── */}
            <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.headerLeft}>
                                <View style={styles.botAvatar}>
                                    <MaterialCommunityIcons name="robot-happy" size={22} color={COLORS.textWhite} />
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>RoadSafe AI</Text>
                                    <Text style={styles.headerSubtitle}>Road Safety Assistant</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                                <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
                            </TouchableOpacity>
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
                                            styles.bubbleText,
                                            item.sender === 'user' ? styles.userText : styles.botText,
                                            item.isError && styles.errorText,
                                        ]}
                                    >
                                        {item.text}
                                    </Text>
                                    {item.isError && (
                                        <View style={styles.retryHint}>
                                            <MaterialCommunityIcons name="refresh" size={14} color={COLORS.accentRed} />
                                            <Text style={styles.retryText}>Tap to retry</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}

                            {loading && (
                                <View style={[styles.bubble, styles.botBubble, { paddingVertical: 14 }]}>
                                    <View style={styles.typingIndicator}>
                                        <ActivityIndicator color={COLORS.textWhite} size="small" />
                                        <Text style={styles.typingText}>Thinking...</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Input Bar */}
                        <View style={styles.inputBar}>
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
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // FAB
    fabContainer: {
        position: 'absolute',
        bottom: 95,
        right: 20,
        zIndex: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabGlow: {
        position: 'absolute',
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: COLORS.emerald,
        opacity: 0.25,
    },
    fab: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.emerald,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '85%',
        backgroundColor: COLORS.bgCard,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        overflow: 'hidden',
    },

    // Header
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    botAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.emerald,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 1,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Chat
    chatArea: {
        flex: 1,
        backgroundColor: COLORS.bgPrimary,
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
    bubbleText: {
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
    retryText: {
        fontSize: 12,
        color: COLORS.accentRed,
        fontWeight: '600',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typingText: {
        color: COLORS.textWhite,
        fontSize: 13,
        fontStyle: 'italic',
    },

    // Input
    inputBar: {
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
