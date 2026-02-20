import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT, FONT_SIZE, RADIUS, SHADOWS, SPACING } from '../../constants/globalStyles';

// ─── Floating Label Input ───
function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  const [focused, setFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(labelAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  };

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 4],
  });
  const labelSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  return (
    <View
      style={[
        styles.floatingWrapper,
        focused && styles.floatingWrapperFocused,
      ]}
    >
      <Animated.Text
        style={[
          styles.floatingLabel,
          { top: labelTop, fontSize: labelSize },
          focused && { color: COLORS.emerald },
        ]}
      >
        {label}
      </Animated.Text>
      <TextInput
        style={styles.floatingInput}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

// ─── Signup Screen ───
export default function Signup() {
  const router = useRouter();
  const { login: loginContext } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    setLoading(true);
    try {
      const response = await authService.signup({ name, email, password });
      const user = {
        _id: (response.user as any).id || response.user._id,
        name: response.user.name,
        email: response.user.email,
      };
      await authService.saveAuthCredentials(response.token, user);
      await loginContext(response.token, user);
      Alert.alert('Success', 'Account created!');
      router.replace('/Tabs');
    } catch (error: any) {
      const message = error?.msg || error?.message || 'Network error';
      Alert.alert('Signup failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.bgScreen, '#E8F5E9']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="shield-check" size={50} color={COLORS.emerald} />
          </View>
          <Text style={styles.appName}>RoadSafe</Text>
          <Text style={styles.tagline}>Stay Safe, Stay Connected</Text>
        </View>

        {/* Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create Account</Text>
          <Text style={styles.formSubtitle}>Join the RoadSafe community</Text>

          <FloatingInput
            label="Full Name"
            value={name}
            onChangeText={setName}
          />
          <FloatingInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FloatingInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <FloatingInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={COLORS.gradientEmerald}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.signupBtn, loading && { opacity: 0.7 }]}
            >
              <Text style={styles.signupBtnText}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('./login')}
            style={styles.linkRow}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },

  // Logo
  logoContainer: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.cardHeavy,
    marginBottom: SPACING.lg,
  },
  appName: {
    fontSize: FONT_SIZE.hero,
    fontWeight: FONT.extraBold,
    color: COLORS.emerald,
  },
  tagline: {
    fontSize: FONT_SIZE.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Form Card
  formCard: {
    width: '100%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    ...SHADOWS.card,
  },
  formTitle: {
    fontSize: FONT_SIZE.title,
    fontWeight: FONT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  formSubtitle: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
  },

  // Floating Input
  floatingWrapper: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  floatingWrapperFocused: {
    borderColor: COLORS.emerald,
    backgroundColor: '#FAFFF9',
  },
  floatingLabel: {
    position: 'absolute',
    left: SPACING.lg,
    color: COLORS.textSecondary,
    fontWeight: FONT.medium,
  },
  floatingInput: {
    fontSize: FONT_SIZE.bodyLg,
    color: COLORS.textPrimary,
    paddingVertical: 0,
    marginTop: 2,
  },

  // Button
  signupBtn: {
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  signupBtnText: {
    color: COLORS.textWhite,
    fontSize: FONT_SIZE.bodyLg,
    fontWeight: FONT.bold,
    letterSpacing: 0.5,
  },

  // Link
  linkRow: { marginTop: SPACING.xl, alignItems: 'center' },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.body,
  },
  linkBold: {
    color: COLORS.emerald,
    fontWeight: FONT.bold,
  },
});
