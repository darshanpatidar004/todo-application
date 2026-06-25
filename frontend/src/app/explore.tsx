import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import {
  FolderPlus,
  Bell,
  Trash2,
  Check,
  CheckCircle,
  AlertCircle,
  Database,
  BarChart3,
  User as UserIcon,
  Lock,
  FileKey,
  ShieldCheck,
} from 'lucide-react-native';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  category_id?: number;
}

export default function ExploreScreen() {
  const { backendUrl, token, user, updateUser } = useAppStore();

  const [activeTab, setActiveTab] = useState<'categories' | 'notifications' | 'profile' | 'diagnostics'>('categories');
  const [loading, setLoading] = useState(false);

  // Categories states
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // Default Blue

  // Notifications states
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Diagnostics & Stats
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });

  // Profile update states
  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Preset Colors for Categories
  const colorPresets = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#E2E8F0', // Slate
  ];

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${backendUrl}/categories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${backendUrl}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Tasks for dynamic statistics
  const fetchTasksForStats = async () => {
    try {
      // 1. Fetch Summary
      const summaryResponse = await fetch(`${backendUrl}/tasks/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setStats(summaryData);
      }

      // 2. Fetch Tasks list for category breakdowns
      const listResponse = await fetch(`${backendUrl}/tasks/?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (listResponse.ok) {
        const listData = await listResponse.json();
        setTasks(listData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchNotifications(), fetchTasksForStats()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [backendUrl, token, activeTab]);

  // Create Category
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert('Required Name', 'Please specify a category name.');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/categories/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCatName.trim(),
          color: selectedColor,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create category');
      }

      setCategories(prev => [...prev, data]);
      setNewCatName('');
      Alert.alert('Initialized', `Category '${data.name}' initialized successfully.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not communicate with server.');
    }
  };

  // Delete Category
  const handleDeleteCategory = (catId: number, name: string) => {
    Alert.alert(
      'Purge Category',
      `Are you sure you want to delete '${name}'? Objectives linked to this category will remain, but will lose their categorization.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: async () => {
            const originalCats = [...categories];
            setCategories(prev => prev.filter(c => c.id !== catId));

            try {
              const response = await fetch(`${backendUrl}/categories/${catId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!response.ok) {
                throw new Error('Delete failed');
              }
            } catch (error) {
              setCategories(originalCats);
              Alert.alert('Purge Failed', 'Could not delete category.');
            }
          },
        },
      ]
    );
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    try {
      const response = await fetch(`${backendUrl}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to update notifications');
      }
    } catch (e) {
      fetchNotifications();
      Alert.alert('Error', 'Could not resolve notifications status.');
    }
  };

  // Update Profile Name
  const handleUpdateProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert('Required Input', 'Full Name cannot be empty.');
      return;
    }

    setUpdatingProfile(true);
    try {
      const response = await fetch(`${backendUrl}/users/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: profileName.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update details');
      }

      updateUser(data); // Sync store local state
      Alert.alert('Success', 'Profile details updated successfully.');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Error sync with server.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Reset / Change Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Required Fields', 'Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Passkey must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Match Error', 'New passkey fields do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await fetch(`${backendUrl}/users/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Password update failed.');
      }

      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Vault passkey has been successfully reset.');
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Error communicating password update.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Stats calculation
  const getTasksByCategory = (catId: number) => {
    return tasks.filter(t => t.category_id === catId).length;
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header Bar */}
      <View className="px-6 py-4 border-b border-slate-900">
        <Text className="text-white text-lg font-black tracking-widest uppercase">
          VAULT PROTOCOLS
        </Text>
        <Text className="text-slate-500 text-xs font-medium">
          ADMINISTRATION & TELEMETRY LOGS
        </Text>
      </View>

      {/* Selector Tabs */}
      <View className="flex-row px-6 mt-4 gap-2">
        <TouchableOpacity
          onPress={() => setActiveTab('categories')}
          className={`flex-1 py-3 px-1 rounded-xl items-center border ${
            activeTab === 'categories'
              ? 'bg-blue-600/10 border-blue-500/40'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <FolderPlus size={15} color={activeTab === 'categories' ? '#3B82F6' : '#64748B'} />
          <Text
            className={`text-[9px] font-bold mt-1.5 uppercase tracking-wide ${
              activeTab === 'categories' ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            Categories
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('notifications')}
          className={`flex-1 py-3 px-1 rounded-xl items-center border ${
            activeTab === 'notifications'
              ? 'bg-blue-600/10 border-blue-500/40'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <View className="relative">
            <Bell size={15} color={activeTab === 'notifications' ? '#3B82F6' : '#64748B'} />
            {notifications.some(n => !n.is_read) && (
              <View className="absolute -top-1.5 -right-1.5 bg-blue-500 w-2 h-2 rounded-full border border-slate-950" />
            )}
          </View>
          <Text
            className={`text-[9px] font-bold mt-1.5 uppercase tracking-wide ${
              activeTab === 'notifications' ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            Security Log
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('profile')}
          className={`flex-1 py-3 px-1 rounded-xl items-center border ${
            activeTab === 'profile'
              ? 'bg-blue-600/10 border-blue-500/40'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <UserIcon size={15} color={activeTab === 'profile' ? '#3B82F6' : '#64748B'} />
          <Text
            className={`text-[9px] font-bold mt-1.5 uppercase tracking-wide ${
              activeTab === 'profile' ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('diagnostics')}
          className={`flex-1 py-3 px-1 rounded-xl items-center border ${
            activeTab === 'diagnostics'
              ? 'bg-blue-600/10 border-blue-500/40'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <BarChart3 size={15} color={activeTab === 'diagnostics' ? '#3B82F6' : '#64748B'} />
          <Text
            className={`text-[9px] font-bold mt-1.5 uppercase tracking-wide ${
              activeTab === 'diagnostics' ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            Diagnostics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Loader */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <View className="flex-1 mt-6">
          {/* TAB 1: CATEGORIES CONFIG */}
          {activeTab === 'categories' && (
            <FlatList
              data={categories}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
              ListHeaderComponent={
                <View className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 mb-6">
                  <Text className="text-white text-base font-bold mb-4 uppercase">
                    Initialize New Category
                  </Text>
                  
                  <View className="mb-4">
                    <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                      Category Tag Name
                    </Text>
                    <TextInput
                      value={newCatName}
                      onChangeText={setNewCatName}
                      placeholder="e.g. Infiltration, Recon, Base"
                      placeholderTextColor="#475569"
                      className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm"
                    />
                  </View>

                  <View className="mb-5">
                    <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                      Aura Beacon Color
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                      {colorPresets.map(color => (
                        <TouchableOpacity
                          key={color}
                          onPress={() => setSelectedColor(color)}
                          className="w-8 h-8 rounded-full border border-slate-950 items-center justify-center"
                          style={{ backgroundColor: color }}
                        >
                          {selectedColor === color && (
                            <Check size={14} color={color === '#E2E8F0' ? '#000000' : '#FFFFFF'} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleCreateCategory}
                    className="bg-blue-600 rounded-xl py-3 items-center justify-center"
                  >
                    <Text className="text-white text-xs font-bold tracking-widest uppercase">
                      INITIALIZE CATEGORY
                    </Text>
                  </TouchableOpacity>
                </View>
              }
              renderItem={({ item }) => (
                <View className="bg-slate-900/60 border border-slate-900/80 rounded-2xl p-4 flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View
                      className="w-3.5 h-3.5 rounded-full mr-3.5"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-white text-base font-semibold">{item.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(item.id, item.name)}
                    className="p-2 bg-slate-950/40 rounded-xl border border-slate-800/40"
                  >
                    <Trash2 size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {/* TAB 2: SYSTEM NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <FlatList
              data={notifications}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
              ListHeaderComponent={
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Recent Vault Operations
                  </Text>
                  {notifications.some(n => !n.is_read) && (
                    <TouchableOpacity
                      onPress={handleMarkAllRead}
                      className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
                    >
                      <Text className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        Acknowledge All
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
              ListEmptyComponent={
                <View className="py-12 items-center justify-center bg-slate-900/20 border border-slate-900 rounded-3xl p-6">
                  <Bell size={48} color="#334155" />
                  <Text className="text-white text-base font-bold mt-4 text-center">
                    System log clear
                  </Text>
                  <Text className="text-slate-500 text-xs mt-1 text-center max-w-[200px]">
                    No recent objective alerts or security updates logged.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View
                  className={`bg-slate-900/50 border border-slate-900/80 rounded-2xl p-4 mb-3 flex-row items-start ${
                    item.is_read ? 'opacity-50' : ''
                  }`}
                >
                  <View className="mt-0.5 mr-3">
                    {item.title.includes('Success') ? (
                      <CheckCircle size={18} color="#10B981" />
                    ) : (
                      <AlertCircle size={18} color="#3B82F6" />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between flex-wrap gap-1">
                      <Text className="text-white text-sm font-semibold">{item.title}</Text>
                      {!item.is_read && (
                        <View className="bg-blue-600/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                          <Text className="text-blue-400 text-[8px] font-black tracking-widest uppercase">
                            New
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {item.message}
                    </Text>
                    <Text className="text-slate-500 text-[9px] mt-2 font-medium">
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

          {/* TAB 3: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              {/* User overview card */}
              <View className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 mb-5 items-center">
                <View className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-full items-center justify-center mb-3">
                  <UserIcon size={32} color="#3B82F6" />
                </View>
                <Text className="text-white text-lg font-bold">{user?.full_name || 'Agent'}</Text>
                <Text className="text-slate-400 text-xs mt-0.5">{user?.email}</Text>
              </View>

              {/* Edit Details */}
              <View className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 mb-5">
                <Text className="text-white text-sm font-bold uppercase tracking-wider mb-4">
                  Update Agent Profile
                </Text>
                
                <View className="mb-4">
                  <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Full Name
                  </Text>
                  <TextInput
                    value={profileName}
                    onChangeText={setProfileName}
                    placeholder="Enter full name"
                    placeholderTextColor="#475569"
                    className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleUpdateProfile}
                  disabled={updatingProfile}
                  className="bg-blue-600 rounded-xl py-3 items-center justify-center"
                >
                  {updatingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-xs font-bold tracking-widest uppercase">
                      Update Details
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Reset Password */}
              <View className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5">
                <View className="flex-row items-center mb-4">
                  <FileKey size={16} color="#3B82F6" />
                  <Text className="text-white text-sm font-bold uppercase tracking-wider ml-2">
                    Reset Vault Passkey
                  </Text>
                </View>

                <View className="mb-3">
                  <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    New Passkey
                  </Text>
                  <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                    <Lock size={16} color="#475569" />
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry
                      className="flex-1 text-white ml-2.5 text-sm"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Confirm New Passkey
                  </Text>
                  <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                    <Lock size={16} color="#475569" />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry
                      className="flex-1 text-white ml-2.5 text-sm"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={updatingPassword}
                  className="bg-blue-600 rounded-xl py-3 items-center justify-center"
                >
                  {updatingPassword ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-xs font-bold tracking-widest uppercase">
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* TAB 4: SYSTEM DIAGNOSTICS & DETAILS */}
          {activeTab === 'diagnostics' && (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              <View className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 mb-5">
                <View className="flex-row items-center mb-4">
                  <Database size={20} color="#3B82F6" />
                  <Text className="text-white text-base font-bold ml-2.5 uppercase">
                    Core Server Info
                  </Text>
                </View>
                
                <View className="bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-3.5 mb-2">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-500 text-xs">Node Server URL</Text>
                    <Text className="text-blue-400 text-xs font-mono">{backendUrl}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-500 text-xs">Database Provider</Text>
                    <Text className="text-white text-xs font-semibold">SQLite Cloud (Secure)</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-500 text-xs">Encryption Standard</Text>
                    <Text className="text-white text-xs font-semibold">HS256 JWT Tokens</Text>
                  </View>
                </View>
              </View>

              <View className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 mb-5">
                <View className="flex-row items-center mb-4">
                  <BarChart3 size={20} color="#3B82F6" />
                  <Text className="text-white text-base font-bold ml-2.5 uppercase">
                    Vault Telemetry
                  </Text>
                </View>

                <View className="bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-3.5">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-slate-500 text-xs">Total Tracked Tasks</Text>
                    <Text className="text-white text-sm font-black">{stats.total}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-slate-500 text-xs">Completed Operations</Text>
                    <Text className="text-emerald-400 text-sm font-black">{stats.completed}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-slate-500 text-xs">Pending Milestones</Text>
                    <Text className="text-amber-400 text-sm font-black">{stats.pending}</Text>
                  </View>
                </View>
              </View>

              {/* Category-wise Breakdowns (Dynamic) */}
              <View className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5">
                <View className="flex-row items-center mb-4">
                  <ShieldCheck size={20} color="#3B82F6" />
                  <Text className="text-white text-base font-bold ml-2.5 uppercase">
                    Objective Sectors Breakdown
                  </Text>
                </View>

                <View className="bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-3.5">
                  {categories.length === 0 ? (
                    <Text className="text-slate-500 text-xs text-center py-2">
                      No sectors initialized yet.
                    </Text>
                  ) : (
                    categories.map(cat => {
                      const count = getTasksByCategory(cat.id);
                      return (
                        <View key={cat.id} className="flex-row justify-between items-center">
                          <View className="flex-row items-center">
                            <View
                              className="w-2.5 h-2.5 rounded-full mr-2"
                              style={{ backgroundColor: cat.color }}
                            />
                            <Text className="text-slate-400 text-xs">{cat.name}</Text>
                          </View>
                          <Text className="text-white text-xs font-bold">{count} logged</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
