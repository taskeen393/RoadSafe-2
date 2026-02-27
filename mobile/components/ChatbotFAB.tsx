// components/ChatbotFAB.tsx
// Premium floating chatbot modal with formatted AI responses
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import { FONT, FONT_SIZE, RADIUS, SPACING } from '../constants/globalStyles';
import { useTheme } from '../app/context/ThemeContext';
import { sendMessage } from '../app/services/chatbotService';

type Message = {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    isError?: boolean;
    timestamp: Date;
};

const DEBOUNCE_MS = 300;

// ── Formatted text renderer ──────────────────────────
// Parses bullet points, numbered lists, and paragraphs
function FormattedText({ text, color, isDark }: { text: string; color: string; isDark: boolean }) {
    const lines = text.split('\n');
    const bulletColor = isDark ? '#4CAF50' : '#2D7A4D';

    return (
        <View style={fmtStyles.container}>
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <View key={i} style={fmtStyles.spacer} />;

                // Bullet point: - or •
                const bulletMatch = trimmed.match(/^[-•]\s+(.*)/);
                if (bulletMatch) {
                    return (
                        <View key={i} style={fmtStyles.bulletRow}>
                            <View style={[fmtStyles.bulletDot, { backgroundColor: bulletColor }]} />
                            <Text style={[fmtStyles.text, { color }]}>{bulletMatch[1]}</Text>
                        </View>
                    );
                }

                // Numbered list: 1. or 1)
                const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
                if (numMatch) {
                    return (
                        <View key={i} style={fmtStyles.bulletRow}>
                            <View style={[fmtStyles.numBadge, { backgroundColor: bulletColor }]}>
                                <Text style={fmtStyles.numText}>{numMatch[1]}</Text>
                            </View>
                            <Text style={[fmtStyles.text, { color }]}>{numMatch[2]}</Text>
                        </View>
                    );
                }

                // Regular paragraph
                return <Text key={i} style={[fmtStyles.text, { color }]}>{trimmed}</Text>;
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

// ── Typing indicator ──────────────────────────────────
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
//  Main Component
// ══════════════════════════════════════════════════════
export default function ChatbotFAB() {
    const { colors: C, isDark } = useTheme();
    const [visible, setVisible] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 0,
            text: 'Hello! I am your Road Safety Assistant.\n\nAsk me anything about:\n- Traffic rules and regulations\n- Safe driving tips\n- Road signs and meanings\n- Emergency guidance after accidents\n- Weather-related driving safety',
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [loading, setLoading] = useState(false);
    const [sendDisabled, setSendDisabled] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── FAB pulse ──────────────────────────────────────
    useEffect(() => {
        const pulse = Animated.loop(Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.07, duration: 1400, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ]));
        pulse.start();
        return () => pulse.stop();
    }, [scaleAnim]);

    // ── Auto-scroll ────────────────────────────────────
    useEffect(() => {
        if (visible) {
            const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            return () => clearTimeout(t);
        }
    }, [messages, visible, loading]);

    // ── Cleanup ────────────────────────────────────────
    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    // ── Send message ───────────────────────────────────
    const handleSend = useCallback(async () => {
        if (!input.trim() || loading || sendDisabled) return;

        setSendDisabled(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const userText = input.trim();
        setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user', timestamp: new Date() }]);
        setInput('');
        Keyboard.dismiss();
        setLoading(true);

        try {
            const response = await sendMessage(userText);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: response.reply || 'No reply received.',
                sender: 'bot',
                isError: !response.success,
                timestamp: new Date(),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: 'Unable to reach the server. Tap to retry.',
                sender: 'bot',
                isError: true,
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
            debounceRef.current = setTimeout(() => setSendDisabled(false), DEBOUNCE_MS);
        }
    }, [input, loading, sendDisabled]);

    // ── Retry ──────────────────────────────────────────
    const handleRetry = useCallback(async (errorId: number) => {
        const idx = messages.findIndex(m => m.id === errorId);
        if (idx <= 0) return;
        const userMsg = messages[idx - 1];
        if (userMsg.sender !== 'user') return;

        setMessages(prev => prev.filter(m => m.id !== errorId));
        setLoading(true);

        try {
            const response = await sendMessage(userMsg.text);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: response.reply || 'No reply received.',
                sender: 'bot',
                isError: !response.success,
                timestamp: new Date(),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: 'Still unable to connect. Please check your network.',
                sender: 'bot',
                isError: true,
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
        }
    }, [messages]);

    // ── Dynamic colours ────────────────────────────────
    const botBubbleBg = isDark ? '#1E2D24' : '#F0F5F1';
    const userBubbleBg = C.darkGreen;
    const botAvatarBg = isDark ? '#1B3A2A' : '#E0EDE4';
    const inputBarBg = isDark ? '#1A1A1A' : '#FFFFFF';
    const inputFieldBg = isDark ? '#262626' : '#F4F7F4';

    return (
        <>
            {/* ─── FAB Button ─── */}
            <Animated.View style={[styles.fabWrap, { transform: [{ scale: scaleAnim }] }]}>
                <View style={[styles.fabGlow, { backgroundColor: C.midGreen }]} />
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: C.midGreen, shadowColor: C.midGreen }]}
                    onPress={() => setVisible(true)}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="robot-happy" size={24} color="#fff" />
                </TouchableOpacity>
            </Animated.View>

            {/* ─── Modal ─── */}
            <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={[styles.modal, { backgroundColor: C.bg }]}
                    >
                        {/* ── Header ──────────────────────────── */}
                        <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
                            <View style={styles.headerLeft}>
                                <View style={[styles.headerAvatar, { backgroundColor: C.midGreen }]}>
                                    <MaterialCommunityIcons name="robot-happy" size={20} color="#fff" />
                                </View>
                                <View>
                                    <Text style={[styles.headerTitle, { color: C.text }]}>RoadSafe AI</Text>
                                    <View style={styles.statusRow}>
                                        <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                                        <Text style={[styles.headerSub, { color: C.sub }]}>Online</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => setVisible(false)}
                                style={[styles.closeBtn, { backgroundColor: C.chipBg }]}
                            >
                                <MaterialCommunityIcons name="close" size={20} color={C.sub} />
                            </TouchableOpacity>
                        </View>

                        {/* ── Messages ────────────────────────── */}
                        <ScrollView
                            ref={scrollRef}
                            style={styles.chatArea}
                            contentContainerStyle={styles.chatContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {messages.map(msg => {
                                const isUser = msg.sender === 'user';

                                return (
                                    <TouchableOpacity
                                        key={msg.id}
                                        activeOpacity={msg.isError ? 0.6 : 1}
                                        onPress={msg.isError ? () => handleRetry(msg.id) : undefined}
                                        disabled={!msg.isError || loading}
                                        style={[styles.msgRow, isUser && styles.msgRowUser]}
                                    >
                                        {/* Bot avatar */}
                                        {!isUser && (
                                            <View style={[styles.avatar, { backgroundColor: botAvatarBg }]}>
                                                <MaterialCommunityIcons name="robot-outline" size={16} color={C.midGreen} />
                                            </View>
                                        )}

                                        {/* Bubble */}
                                        <View style={[
                                            styles.bubble,
                                            {
                                                backgroundColor: msg.isError
                                                    ? (isDark ? '#3A1A1A' : '#FEF2F2')
                                                    : isUser ? userBubbleBg : botBubbleBg,
                                                borderColor: msg.isError
                                                    ? (isDark ? '#5A2A2A' : '#FECACA')
                                                    : 'transparent',
                                                borderWidth: msg.isError ? 1 : 0,
                                            },
                                        ]}>
                                            {/* Label */}
                                            {!isUser && !msg.isError && (
                                                <Text style={[styles.label, { color: C.midGreen }]}>Road Safety AI</Text>
                                            )}

                                            {/* Content */}
                                            {msg.isError ? (
                                                <View>
                                                    <Text style={[fmtStyles.text, { color: C.red }]}>{msg.text}</Text>
                                                    <View style={styles.retryRow}>
                                                        <MaterialCommunityIcons name="refresh" size={14} color={C.red} />
                                                        <Text style={[styles.retryText, { color: C.red }]}>Tap to retry</Text>
                                                    </View>
                                                </View>
                                            ) : isUser ? (
                                                <Text style={[fmtStyles.text, { color: '#FFFFFF' }]}>{msg.text}</Text>
                                            ) : (
                                                <FormattedText text={msg.text} color={C.text} isDark={isDark} />
                                            )}

                                            {/* Timestamp */}
                                            <Text style={[styles.time, { color: isUser ? 'rgba(255,255,255,0.5)' : C.sub }]}>
                                                {fmtTime(msg.timestamp)}
                                            </Text>
                                        </View>

                                        {/* User avatar */}
                                        {isUser && (
                                            <View style={[styles.avatar, { backgroundColor: isDark ? '#1A4D2E' : '#2D7A4D' }]}>
                                                <MaterialCommunityIcons name="account" size={16} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Typing indicator */}
                            {loading && (
                                <View style={styles.msgRow}>
                                    <View style={[styles.avatar, { backgroundColor: botAvatarBg }]}>
                                        <MaterialCommunityIcons name="robot-outline" size={16} color={C.midGreen} />
                                    </View>
                                    <View style={[styles.bubble, { backgroundColor: botBubbleBg }]}>
                                        <Text style={[styles.label, { color: C.midGreen }]}>Road Safety AI</Text>
                                        <TypingDots color={C.midGreen} />
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* ── Input Bar ───────────────────────── */}
                        <View style={[styles.inputBar, { backgroundColor: inputBarBg, borderTopColor: C.border }]}>
                            <View style={[styles.inputField, { backgroundColor: inputFieldBg, borderColor: C.border }]}>
                                <TextInput
                                    style={[styles.textInput, { color: C.text }]}
                                    placeholder="Ask about road safety..."
                                    placeholderTextColor={C.sub}
                                    value={input}
                                    onChangeText={setInput}
                                    onSubmitEditing={handleSend}
                                    returnKeyType="send"
                                    multiline
                                    maxLength={500}
                                    editable={!loading}
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.sendBtn,
                                    { backgroundColor: input.trim() && !loading ? C.darkGreen : isDark ? '#333' : '#D1D5DB' },
                                ]}
                                onPress={handleSend}
                                disabled={!input.trim() || loading}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name="send"
                                    size={18}
                                    color={input.trim() && !loading ? '#fff' : isDark ? '#666' : '#9CA3AF'}
                                />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}

// ══════════════════════════════════════════════════════
const styles = StyleSheet.create({
    // FAB
    fabWrap: {
        position: 'absolute', bottom: 95, right: 20, zIndex: 999,
        alignItems: 'center', justifyContent: 'center',
    },
    fabGlow: { position: 'absolute', width: 62, height: 62, borderRadius: 31, opacity: 0.25 },
    fab: {
        width: 52, height: 52, borderRadius: 26,
        justifyContent: 'center', alignItems: 'center',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
    },

    // Modal shell
    overlay: { flex: 1, justifyContent: 'flex-end' },
    modal: {
        height: '88%',
        borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
        overflow: 'hidden',
    },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
        borderBottomWidth: 1,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    headerAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    headerSub: { fontSize: 12 },
    closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

    // Chat
    chatArea: { flex: 1 },
    chatContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.md },

    // Message rows
    msgRow: {
        flexDirection: 'row', alignItems: 'flex-end',
        marginBottom: SPACING.lg, gap: SPACING.sm,
    },
    msgRowUser: { justifyContent: 'flex-end' },

    avatar: {
        width: 30, height: 30, borderRadius: 15,
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

    label: {
        fontSize: 11, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 6,
    },

    time: { fontSize: 10, marginTop: 8, textAlign: 'right' },

    retryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    retryText: { fontSize: 12, fontWeight: '600' },

    // Input bar
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
    textInput: { fontSize: 14.5, lineHeight: 20, maxHeight: 80 },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 0 : 1,
    },
});
