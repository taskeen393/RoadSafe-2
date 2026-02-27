// app/auth/Signup.tsx — Sign Up Screen (RoadSafe Premium Theme)
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useToast } from '../../components/ToastContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function Signup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login: loginContext } = useAuth();
  const { showToast } = useToast();
  const { colors: G, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const scrollToInput = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: y - 100, animated: true });
    }, 300);
  };
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return showToast({ type: 'warning', title: 'Missing Fields', message: 'Please fill all fields' });
    }
    if (password !== confirmPassword) {
      return showToast({ type: 'error', title: 'Mismatch', message: 'Passwords do not match' });
    }
    if (password.length < 6) {
      return showToast({ type: 'warning', title: 'Weak Password', message: 'Password must be at least 6 characters' });
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
      showToast({ type: 'success', title: 'Account Created!', message: 'Welcome to RoadSafe' });
      router.replace('/Tabs');
    } catch (error: any) {
      const message = error?.msg || error?.message || 'Network error';
      showToast({ type: 'error', title: 'Signup Failed', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: G.bg }]}>
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
            colors={G.gradientHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + 30 }]}
          >
            <View style={styles.heroDeco1} />
            <View style={styles.heroDeco2} />
            <View style={styles.heroDeco3} />

            {/* Back Button */}
            <TouchableOpacity
              style={[styles.backBtn, { top: insets.top + 10 }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.logoWrap}>
              <View style={[styles.logoCircle, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
                <MaterialCommunityIcons name="shield-check" size={32} color={G.midGreen} />
              </View>
            </View>
            <Text style={styles.heroTitle}>Join RoadSafe</Text>
            <Text style={styles.heroTagline}>Create your account to get started</Text>
          </LinearGradient>

          {/* ─── Form Card ─── */}
          <View style={[styles.formCard, {
            backgroundColor: G.card,
            ...Platform.select({
              ios: { shadowColor: isDark ? '#000' : '#1A4D2E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 20 },
              android: { elevation: 8 },
            }),
          }]}>
            <Text style={[styles.formTitle, { color: G.text }]}>Create Account</Text>
            <Text style={[styles.formSubtitle, { color: G.sub }]}>Join the road safety community</Text>

            {/* Name Input */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: G.text }]}>Full Name</Text>
              <View style={[styles.inputRow, { backgroundColor: G.inputBg, borderColor: G.border }]}>
                <View style={[styles.inputIconWrap, { backgroundColor: G.lightGreen }]}>
                  <Ionicons name="person-outline" size={18} color={G.midGreen} />
                </View>
                <TextInput
                  style={[styles.textInput, { color: G.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={G.sub}
                  autoCapitalize="words"
                  onFocus={(e) => {
                    (e.target as any)?.measureInWindow?.((x: number, y: number) => scrollToInput(y));
                  }}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: G.text }]}>Email Address</Text>
              <View style={[styles.inputRow, { backgroundColor: G.inputBg, borderColor: G.border }]}>
                <View style={[styles.inputIconWrap, { backgroundColor: G.lightGreen }]}>
                  <Ionicons name="mail-outline" size={18} color={G.midGreen} />
                </View>
                <TextInput
                  style={[styles.textInput, { color: G.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={G.sub}
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
              <Text style={[styles.fieldLabel, { color: G.text }]}>Password</Text>
              <View style={[styles.inputRow, { backgroundColor: G.inputBg, borderColor: G.border }]}>
                <View style={[styles.inputIconWrap, { backgroundColor: G.lightGreen }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={G.midGreen} />
                </View>
                <TextInput
                  style={[styles.textInput, { color: G.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={G.sub}
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

            {/* Confirm Password Input */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: G.text }]}>Confirm Password</Text>
              <View style={[
                styles.inputRow,
                { backgroundColor: G.inputBg, borderColor: G.border },
                confirmPassword.length > 0 && password !== confirmPassword && { borderColor: '#EF4444' },
                confirmPassword.length > 0 && password === confirmPassword && { borderColor: G.midGreen },
              ]}>
                <View style={[
                  styles.inputIconWrap,
                  { backgroundColor: G.lightGreen },
                  confirmPassword.length > 0 && password === confirmPassword && { backgroundColor: G.lightGreen },
                  confirmPassword.length > 0 && password !== confirmPassword && { backgroundColor: isDark ? '#3A1A1A' : '#FEE2E2' },
                ]}>
                  <Ionicons
                    name={confirmPassword.length > 0 && password === confirmPassword ? 'checkmark-circle' : 'lock-closed-outline'}
                    size={18}
                    color={confirmPassword.length > 0 && password !== confirmPassword ? '#EF4444' : G.midGreen}
                  />
                </View>
                <TextInput
                  style={[styles.textInput, { color: G.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={G.sub}
                  secureTextEntry={!showConfirm}
                  onFocus={(e) => {
                    (e.target as any)?.measureInWindow?.((x: number, y: number) => scrollToInput(y));
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={G.sub}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorHint}>Passwords don't match</Text>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.88}
              style={{ marginTop: 4 }}
            >
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#6B7280'] as [string, string] : [G.darkGreen, G.midGreen] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color="#fff" />
                    <Text style={styles.submitText}>Create Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: G.divider }]} />
              <Text style={[styles.dividerText, { color: G.sub }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: G.divider }]} />
            </View>

            {/* Login Link */}
            <TouchableOpacity
              onPress={() => router.push('./login')}
              style={[styles.altBtn, { backgroundColor: G.lightGreen, borderColor: G.border }]}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={18} color={G.midGreen} />
              <Text style={[styles.altBtnText, { color: G.midGreen }]}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: G.sub }]}>
            By signing up, you agree to our Terms & Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  // Hero
  hero: { alignItems: 'center', paddingBottom: 45, overflow: 'hidden' },
  heroDeco1: { position: 'absolute', top: -50, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroDeco2: { position: 'absolute', bottom: -30, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroDeco3: { position: 'absolute', top: 40, left: 50, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.03)' },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 10, width: 38, height: 38, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  logoWrap: { marginBottom: 14 },
  logoCircle: {
    width: 68, height: 68, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroTagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },

  // Form Card
  formCard: { marginHorizontal: 20, marginTop: -26, borderRadius: 24, padding: 22 },
  formTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  formSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 24 },

  // Fields
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: -0.1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 4 },
  inputIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  textInput: { flex: 1, fontSize: 15, paddingVertical: 13, paddingHorizontal: 12 },
  eyeBtn: { padding: 10 },
  errorHint: { fontSize: 11, color: '#EF4444', fontWeight: '600', marginTop: 6, marginLeft: 4 },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 16,
    ...Platform.select({
      ios: { shadowColor: '#1A4D2E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '600' },

  // Alt Button
  altBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5 },
  altBtnText: { fontSize: 14, fontWeight: '700' },

  // Footer
  footer: { textAlign: 'center', fontSize: 11, marginTop: 20, marginBottom: 30, paddingHorizontal: 40, lineHeight: 16 },
});
