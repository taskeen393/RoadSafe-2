// components/ConfirmDialog.tsx — Styled Bottom-Sheet Confirmation Modal
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

// ─── Theme ───
const G = {
    darkGreen: '#1A4D2E',
    midGreen: '#2D7A4D',
    lightGreen: '#E8F5ED',
    text: '#1A1A1A',
    sub: '#6B7280',
    red: '#EF4444',
    redLight: '#FEF2F2',
    redBorder: '#FECACA',
};

export interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    icon?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    visible,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
    icon,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const slideAnim = useRef(new Animated.Value(height)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 11,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const iconName = icon || (destructive ? 'warning' : 'help-circle');
    const iconColor = destructive ? G.red : G.midGreen;
    const iconBg = destructive ? G.redLight : G.lightGreen;

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <View style={styles.container}>
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={onCancel}>
                    <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
                </TouchableWithoutFeedback>

                {/* Dialog Card */}
                <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
                    {/* Drag Handle */}
                    <View style={styles.handle} />

                    {/* Icon */}
                    <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                        <Ionicons name={iconName as any} size={28} color={iconColor} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
                            <Text style={styles.cancelText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmBtnWrap]}
                            onPress={onConfirm}
                            activeOpacity={0.85}
                        >
                            {destructive ? (
                                <View style={[styles.confirmInner, { backgroundColor: G.red }]}>
                                    <Ionicons name="trash-outline" size={16} color="#fff" />
                                    <Text style={styles.confirmText}>{confirmText}</Text>
                                </View>
                            ) : (
                                <LinearGradient
                                    colors={[G.darkGreen, G.midGreen]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.confirmInner}
                                >
                                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                    <Text style={styles.confirmText}>{confirmText}</Text>
                                </LinearGradient>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 28,
        paddingTop: 14,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
            },
            android: { elevation: 20 },
        }),
    },
    handle: {
        width: 36,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#E5E7EB',
        marginBottom: 20,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A1A',
        textAlign: 'center',
        letterSpacing: -0.3,
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    confirmBtnWrap: {
        flex: 1.5,
        borderRadius: 16,
        overflow: 'hidden',
    },
    confirmInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
    },
    confirmText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});
