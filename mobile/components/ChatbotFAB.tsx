// components/ChatbotFAB.tsx
// Floating Action Button that opens the AI Chatbot as a modal overlay
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/globalStyles';
import { chatbotService } from '../app/services';

type Message = {
    id: number;
    text: string;
    sender: 'user' | 'bot';
};

export default function ChatbotFAB() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation on mount
    useEffect(() => {
        // Subtle pulse: scale 1 → 1.07
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.07, duration: 1400, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

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
                { id: Date.now() + 1, text: response.bot || 'No reply', sender: 'bot' },
            ]);
        } catch (err: any) {
            setChat(prev => [
                ...prev,
                { id: Date.now() + 1, text: 'Server not reachable', sender: 'bot' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }
    }, [chat, visible]);

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
            <Modal visible={visible} animationType="slide" transparent>
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
                                    <Text style={styles.headerSubtitle}>Your travel assistant</Text>
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
                            {chat.length === 0 && (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="robot-happy-outline" size={60} color={COLORS.border} />
                                    <Text style={styles.emptyText}>Ask me anything about road safety!</Text>
                                </View>
                            )}

                            {chat.map(item => (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.bubble,
                                        item.sender === 'user' ? styles.userBubble : styles.botBubble,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.bubbleText,
                                            item.sender === 'user' ? styles.userText : styles.botText,
                                        ]}
                                    >
                                        {item.text}
                                    </Text>
                                </View>
                            ))}

                            {loading && (
                                <View style={[styles.bubble, styles.botBubble, { paddingVertical: 14 }]}>
                                    <ActivityIndicator color={COLORS.textWhite} size="small" />
                                </View>
                            )}
                        </ScrollView>

                        {/* Input Bar */}
                        <View style={styles.inputBar}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type a message..."
                                placeholderTextColor={COLORS.textLight}
                                value={message}
                                onChangeText={setMessage}
                                onSubmitEditing={handleSend}
                                returnKeyType="send"
                            />
                            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
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
    emptyState: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        marginTop: SPACING.md,
        fontSize: 15,
        color: COLORS.textLight,
        fontStyle: 'italic',
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
});
