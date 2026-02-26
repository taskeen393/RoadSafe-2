// components/ToastContext.tsx — Global Toast Notification System
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ─── Types ───
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
    type: ToastType;
    title: string;
    message?: string;
    duration?: number; // ms, default 3000
}

interface ToastContextValue {
    showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue>({
    showToast: () => { },
});

export const useToast = () => useContext(ToastContext);

// ─── Theme Config ───
const TOAST_THEMES: Record<ToastType, { bg: string; border: string; icon: string; iconName: string; progressColor: string }> = {
    success: {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        icon: '#059669',
        iconName: 'checkmark-circle',
        progressColor: '#059669',
    },
    error: {
        bg: '#FEF2F2',
        border: '#FECACA',
        icon: '#DC2626',
        iconName: 'close-circle',
        progressColor: '#DC2626',
    },
    warning: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        icon: '#D97706',
        iconName: 'warning',
        progressColor: '#D97706',
    },
    info: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        icon: '#2563EB',
        iconName: 'information-circle',
        progressColor: '#2563EB',
    },
};

// ─── Provider ───
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<ToastConfig | null>(null);
    const [visible, setVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-150)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hideToast = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: -150, duration: 300, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
            setVisible(false);
            setToast(null);
        });
    }, [slideAnim, opacityAnim]);

    const showToast = useCallback((config: ToastConfig) => {
        // Clear any existing timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const duration = config.duration || 3000;

        setToast(config);
        setVisible(true);
        slideAnim.setValue(-150);
        opacityAnim.setValue(0);
        progressAnim.setValue(1);

        // Slide in
        Animated.parallel([
            Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();

        // Progress bar (non-native driver for width)
        Animated.timing(progressAnim, { toValue: 0, duration, useNativeDriver: false }).start();

        // Auto-dismiss
        timeoutRef.current = setTimeout(() => {
            hideToast();
        }, duration);
    }, [slideAnim, opacityAnim, progressAnim, hideToast]);

    const theme = toast ? TOAST_THEMES[toast.type] : TOAST_THEMES.info;

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Render toast in a transparent Modal so it floats above
                react-native-screens native containers */}
            <Modal
                visible={visible}
                transparent
                animationType="none"
                statusBarTranslucent
                hardwareAccelerated
                onRequestClose={hideToast}
            >
                <View style={styles.modalOverlay} pointerEvents="box-none">
                    {toast && (
                        <Animated.View
                            style={[
                                styles.toastContainer,
                                {
                                    top: insets.top + 10,
                                    transform: [{ translateY: slideAnim }],
                                    opacity: opacityAnim,
                                },
                            ]}
                            pointerEvents="box-none"
                        >
                            <View style={[styles.toast, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                {/* Icon */}
                                <View style={[styles.iconWrap, { backgroundColor: theme.icon + '18' }]}>
                                    <Ionicons name={theme.iconName as any} size={22} color={theme.icon} />
                                </View>

                                {/* Text Content */}
                                <View style={styles.textWrap}>
                                    <Text style={[styles.title, { color: theme.icon }]}>{toast.title}</Text>
                                    {toast.message ? (
                                        <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
                                    ) : null}
                                </View>

                                {/* Close Button */}
                                <TouchableOpacity onPress={hideToast} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name="close" size={18} color="#9CA3AF" />
                                </TouchableOpacity>

                                {/* Progress Bar */}
                                <Animated.View
                                    style={[
                                        styles.progressBar,
                                        {
                                            backgroundColor: theme.progressColor,
                                            width: progressAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            }),
                                        },
                                    ]}
                                />
                            </View>
                        </Animated.View>
                    )}
                </View>
            </Modal>
        </ToastContext.Provider>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    toastContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
        elevation: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            },
            android: { elevation: 12 },
        }),
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textWrap: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    message: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
        lineHeight: 18,
    },
    closeBtn: {
        marginLeft: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        borderBottomLeftRadius: 16,
    },
});
