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
import { useTheme } from '../app/context/ThemeContext';

const { height } = Dimensions.get('window');

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
    const { colors: G, isDark } = useTheme();
    const slideAnim = useRef(new Animated.Value(height)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
                Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
                Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const handleOptionPress = (option: ActionOption) => {
        onCancel();
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
                <Animated.View style={[styles.sheet, { backgroundColor: G.modalBg, transform: [{ translateY: slideAnim }] }]}>
                    {/* Drag Handle */}
                    <View style={[styles.handle, { backgroundColor: isDark ? '#4A4A4A' : '#E5E7EB' }]} />

                    {/* Title */}
                    <Text style={[styles.title, { color: G.text }]}>{title}</Text>

                    {/* Options */}
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionRow,
                                index < options.length - 1 && [styles.optionBorder, { borderBottomColor: G.divider }],
                            ]}
                            onPress={() => handleOptionPress(option)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: (option.iconColor || G.midGreen) + '15' }]}>
                                <Ionicons name={option.icon as any} size={22} color={option.iconColor || G.midGreen} />
                            </View>
                            <Text style={[styles.optionLabel, { color: G.text }]}>{option.label}</Text>
                            <Ionicons name="chevron-forward" size={16} color={G.sub} />
                        </TouchableOpacity>
                    ))}

                    {/* Cancel Button */}
                    <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: G.chipBg }]} onPress={onCancel} activeOpacity={0.7}>
                        <Text style={[styles.cancelText, { color: G.sub }]}>Cancel</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: {
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 14,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 24 },
            android: { elevation: 20 },
        }),
    },
    handle: { width: 36, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
    title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 16, textAlign: 'center' },
    optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 14 },
    optionBorder: { borderBottomWidth: 1 },
    optionIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    optionLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
    cancelBtn: { marginTop: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 },
    cancelText: { fontSize: 15, fontWeight: '600' },
});
