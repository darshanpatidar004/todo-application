import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { Shield, Server, Mail, Lock, User as UserIcon, AlertTriangle } from 'lucide-react-native';

export default function AuthScreen() {
  const { backendUrl, setBackendUrl, setAuth } = useAppStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Form fields
  const [urlInput, setUrlInput] = useState(backendUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Automatically migrate old persisted placeholder URL to the new deployed Render URL
  useEffect(() => {
    if (backendUrl === 'https://todo-backend.onrender.com/api/v1') {
      const correctUrl = 'https://todo-application-m8ah.onrender.com/api/v1';
      setBackendUrl(correctUrl);
      setUrlInput(correctUrl);
    }
  }, [backendUrl]);

  // Client-side validation
  const validateInputs = () => {
    setValidationError(null);

    if (!email.trim() || !password) {
      setValidationError('All credential fields are required.');
      return false;
    }

    // Email pattern validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError('Invalid email pattern. Please enter a valid email address.');
      return false;
    }

    // Password length validation (production-ready check)
    if (password.length < 6) {
      setValidationError('Passkey must be at least 6 characters long for security.');
      return false;
    }

    if (!isLogin && !fullName.trim()) {
      setValidationError('Agent full name is required for registry initialization.');
      return false;
    }

    return true;
  };

  const handleAuth = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    setBackendUrl(urlInput);

    try {
      if (isLogin) {
        // Login Flow (using OAuth2 Form Data)
        const formData = new URLSearchParams();
        formData.append('username', email.trim());
        formData.append('password', password);

        const response = await fetch(`${urlInput}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Incorrect credentials or unauthorized access.');
        }

        // Login success - fetch current user details
        const userResponse = await fetch(`${urlInput}/users/me`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to retrieve secure user profile.');
        }
        
        const userData = await userResponse.json();
        setAuth(data.access_token, data.refresh_token, userData);
        
        // Show success alert/toast
        Alert.alert('Authenticated', `Welcome back to Mission Control, Agent ${userData.full_name || 'User'}.`);
      } else {
        // Register Flow
        const response = await fetch(`${urlInput}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
            full_name: fullName.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Registry configuration failed on cloud.');
        }

        Alert.alert(
          'Vault Initialized',
          'Your secure credential profile has been saved. Please authenticate to enter.',
          [{ text: 'Authenticate Now', onPress: () => {
            setIsLogin(true);
            setValidationError(null);
          }}]
        );
      }
    } catch (error: any) {
      setValidationError(error.message || 'An error occurred during communication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-950"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12 justify-center">
        <View className="items-center mb-8">
          <View className="bg-blue-600/10 p-4 rounded-full border border-blue-500/20 mb-4">
            <Shield size={48} color="#3B82F6" />
          </View>
          <Text className="text-white text-3xl font-black tracking-widest text-center">
            ULTRATODO
          </Text>
          <Text className="text-slate-400 text-sm mt-1 tracking-wide text-center">
            Elite Mission Objectives Vault
          </Text>
        </View>

        {/* Auth Box */}
        <View className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
          <Text className="text-white text-xl font-bold mb-5 text-center">
            {isLogin ? 'AUTHENTICATE USER' : 'CREATE VAULT KEY'}
          </Text>

          {/* Validation Alert Box */}
          {validationError && (
            <View className="flex-row items-center bg-red-950/40 border border-red-500/20 p-3.5 rounded-xl mb-5">
              <AlertTriangle size={18} color="#EF4444" className="mr-2" />
              <Text className="text-red-400 text-xs font-semibold flex-1 leading-relaxed">
                {validationError}
              </Text>
            </View>
          )}

          {/* Form Fields */}
          {!isLogin && (
            <View className="mb-4">
              <Text className="text-slate-400 text-xs font-semibold mb-2 tracking-wide uppercase">
                Full Name
              </Text>
              <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                <UserIcon size={18} color="#64748B" />
                <TextInput
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Enter full name"
                  placeholderTextColor="#475569"
                  className="flex-1 text-white ml-3 text-base"
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-slate-400 text-xs font-semibold mb-2 tracking-wide uppercase">
              Email Address
            </Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <Mail size={18} color="#64748B" />
              <TextInput
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Enter email address"
                placeholderTextColor="#475569"
                className="flex-1 text-white ml-3 text-base"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-slate-400 text-xs font-semibold mb-2 tracking-wide uppercase">
              Secret Passkey
            </Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <Lock size={18} color="#64748B" />
              <TextInput
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (validationError) setValidationError(null);
                }}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                className="flex-1 text-white ml-3 text-base"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl py-4 items-center justify-center shadow-lg"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-bold tracking-widest uppercase">
                {isLogin ? 'ENTER VAULT' : 'REGISTER ACCESS'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Form Mode */}
          <TouchableOpacity
            onPress={() => {
              setIsLogin(!isLogin);
              setValidationError(null);
            }}
            className="mt-6 align-center"
          >
            <Text className="text-blue-400 text-sm text-center font-medium">
              {isLogin
                ? "Request Access key (Create Account)"
                : 'Already have credentials? Log In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Server Config Accordion */}
        <View className="mt-8 items-center">
          <TouchableOpacity
            onPress={() => setShowSettings(!showSettings)}
            className="flex-row items-center bg-slate-900 border border-slate-800/60 rounded-full px-4 py-2"
          >
            <Server size={14} color="#64748B" />
            <Text className="text-slate-400 text-xs font-semibold ml-2">
              {showSettings ? 'Hide Core Server Config' : 'Show Core Server Config'}
            </Text>
          </TouchableOpacity>

          {showSettings && (
            <View className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 mt-4">
              <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                Cloud Backend Server API URL
              </Text>
              <TextInput
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://your-api.onrender.com/api/v1"
                placeholderTextColor="#475569"
                className="bg-slate-950 border border-slate-800 text-blue-400 rounded-xl px-4 py-3 text-sm font-mono"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="text-slate-500 text-xs mt-2 leading-relaxed">
                Connects your client device to your personal FastAPI + SQLite Cloud server.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
