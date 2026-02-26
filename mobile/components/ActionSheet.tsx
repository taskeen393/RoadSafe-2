// components/ActionSheet.tsx — Styled Bottom-Sheet Action List
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

const { height } = Dimensions.get('window');

// ─── Theme ───
const G = {
    darkGreen: '#1A4D2E',
    midGreen: '#2D7A4D',
    lightGreen: '#E8F5ED',
    text: '#1A1A1A',
    sub: '#6B7280',
};

export interface ActionOption {
    label: string;
    icon: string;
    iconColor?: string;
    onPress: () => void;
}

export interface ActionSheetProps {
    visible: boolean;
    title: string;
    options: ActionOption[];
    onCancel: () => void;
}

export default function ActionSheet({
    visible,
    title,
    options,
    onCancel,
}: ActionSheetProps) {
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

    const handleOptionPress = (option: ActionOption) => {
        onCancel(); // close first
        // Small delay so animation finishes before action (e.g. camera launch)
        setTimeout(() => option.onPress(), 300);
    };

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <View style={styles.container}>
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={onCancel}>
                    <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
                </TouchableWithoutFeedback>

                {/* Sheet */}
                <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    {/* Drag Handle */}
                    <View style={styles.handle} />

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Options */}
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionRow,
                                index < options.length - 1 && styles.optionBorder,
                            ]}
                            onPress={() => handleOptionPress(option)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: (option.iconColor || G.midGreen) + '15' }]}>
                                <Ionicons name={option.icon as any} size={22} color={option.iconColor || G.midGreen} />
                            </View>
                            <Text style={styles.optionLabel}>{option.label}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                        </TouchableOpacity>
                    ))}

                    {/* Cancel Button */}
                    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
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
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 14,
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
        alignSelf: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: G.text,
        letterSpacing: -0.3,
        marginBottom: 16,
        textAlign: 'center',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 14,
    },
    optionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: G.text,
    },
    cancelBtn: {
        marginTop: 14,
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
});
