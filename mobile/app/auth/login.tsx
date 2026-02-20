// app/auth/login.tsx — Login Screen (RoadSafe Premium Theme)
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../services';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// ─── Theme ───
const G = {
  bg: '#F4F7F4',
  card: '#FFFFFF',
  darkGreen: '#1A4D2E',
  midGreen: '#2D7A4D',
  lightGreen: '#E8F5ED',
  text: '#1A1A1A',
  sub: '#6B7280',
  border: '#D1E8D9',
  inputBg: '#F9FBFA',
};

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login: loginContext } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const scrollToInput = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: y - 120, animated: true });
    }, 300);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      const user = {
        _id: response.user._id,
        name: response.user.name,
        email: response.user.email,
      };
      await authService.saveAuthCredentials(response.token, user);
      await loginContext(response.token, user);
      router.replace('/Tabs');
    } catch (error: any) {
      Alert.alert('Login failed', error?.msg || error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Hero Header ─── */}
          <LinearGradient
            colors={[G.darkGreen, G.midGreen]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + 40 }]}
          >
            <View style={styles.heroDeco1} />
            <View style={styles.heroDeco2} />
            <View style={styles.heroDeco3} />

            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="shield-check" size={36} color={G.midGreen} />
              </View>
            </View>
            <Text style={styles.heroTitle}>RoadSafe</Text>
            <Text style={styles.heroTagline}>Stay Safe, Stay Connected</Text>
          </LinearGradient>

          {/* ─── Form Card ─── */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue your journey</Text>

            {/* Email Input */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIconWrap}>
                  <Ionicons name="mail-outline" size={18} color={G.midGreen} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#B0B7C3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={(e) => {
                    (e.target as any)?.measureInWindow?.((x: number, y: number) => scrollToInput(y));
                  }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIconWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={G.midGreen} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#B0B7C3"
                  secureTextEntry={!showPassword}
                  onFocus={(e) => {
                    (e.target as any)?.measureInWindow?.((x: number, y: number) => scrollToInput(y));
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={G.sub}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
              style={{ marginTop: 8 }}
            >
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#6B7280'] : [G.darkGreen, G.midGreen]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.submitText}>Login</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity
              onPress={() => router.push('./Signup')}
              style={styles.altBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={18} color={G.midGreen} />
              <Text style={styles.altBtnText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            By logging in, you agree to our Terms & Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingBottom: 50,
    overflow: 'hidden',
  },
  heroDeco1: {
    position: 'absolute', top: -50, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroDeco2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroDeco3: {
    position: 'absolute', top: 30, left: 50,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  logoWrap: { marginBottom: 16 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  heroTitle: {
    fontSize: 30, fontWeight: '800', color: '#fff',
    letterSpacing: -0.5,
  },
  heroTagline: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },

  // Form Card
  formCard: {
    backgroundColor: G.card,
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#1A4D2E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  formTitle: {
    fontSize: 24, fontWeight: '800', color: G.text,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 14, color: G.sub, marginTop: 4, marginBottom: 28,
  },

  // Fields
  fieldWrap: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 13, fontWeight: '700', color: G.text,
    marginBottom: 8, letterSpacing: -0.1,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: G.inputBg,
    borderWidth: 1.5, borderColor: G.border,
    borderRadius: 16, paddingHorizontal: 4,
  },
  inputIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: G.lightGreen,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 4,
  },
  textInput: {
    flex: 1, fontSize: 15, color: G.text,
    paddingVertical: 14, paddingHorizontal: 12,
  },
  eyeBtn: { padding: 10 },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, paddingVertical: 16,
    ...Platform.select({
      ios: { shadowColor: G.darkGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  submitText: {
    fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 20, gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, fontWeight: '600', color: G.sub },

  // Alt Button
  altBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 16,
    backgroundColor: G.lightGreen, borderWidth: 1.5, borderColor: G.border,
  },
  altBtnText: {
    fontSize: 15, fontWeight: '700', color: G.midGreen,
  },

  // Footer
  footer: {
    textAlign: 'center', fontSize: 11, color: G.sub,
    marginTop: 24, marginBottom: 30, paddingHorizontal: 40,
    lineHeight: 16,
  },
});
