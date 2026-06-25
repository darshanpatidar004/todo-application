import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import {
  Plus,
  Search,
  LogOut,
  CheckCircle2,
  Circle,
  Trash2,
  FolderDot,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  FileText,
  Bookmark,
} from 'lucide-react-native';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: number;
  category_id?: number;
  due_date?: string;
  created_at: string;
}

export default function HomeScreen() {
  const { backendUrl, token, clearAuth, user } = useAppStore();

  // State lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Loading & UX state
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortByPriority, setSortByPriority] = useState(false); // Toggle priority sorting

  // Form states for creating a new task
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState(2); // Default to Tactical (2)
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial categories and tasks
  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      // 1. Fetch Categories
      const catResponse = await fetch(`${backendUrl}/categories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (catResponse.ok) {
        const catData = await catResponse.json();
        setCategories(catData);
      }

      // 2. Fetch Tasks
      let taskUrl = `${backendUrl}/tasks/?limit=100`;
      const tasksResponse = await fetch(taskUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tasksResponse.ok) {
        const taskData = await tasksResponse.json();
        setTasks(taskData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [backendUrl, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  // Log out flow
  const handleLogout = async () => {
    Alert.alert(
      'System Log Out',
      'Are you sure you want to exit the mission control vault?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit Vault',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${backendUrl}/auth/logout`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: token }),
              });
            } catch (e) {
              // Ignore logout network failure, force log out locally
            }
            clearAuth();
          },
        },
      ]
    );
  };

  // Toggle completion of task
  const toggleTaskCompletion = async (task: Task) => {
    const updatedStatus = !task.is_completed;
    
    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, is_completed: updatedStatus } : t))
    );
    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask(prev => prev ? { ...prev, is_completed: updatedStatus } : null);
    }

    try {
      const response = await fetch(`${backendUrl}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_completed: updatedStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task.');
      }
    } catch (error) {
      // Revert if error
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, is_completed: !updatedStatus } : t))
      );
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask(prev => prev ? { ...prev, is_completed: !updatedStatus } : null);
      }
      Alert.alert('Sync Error', 'Could not sync objective update with cloud database.');
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: number) => {
    Alert.alert(
      'Purge Objective',
      'Are you sure you want to permanently delete this objective from the cloud database?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: async () => {
            // Optimistic UI update
            const originalTasks = [...tasks];
            setTasks(prev => prev.filter(t => t.id !== taskId));
            if (selectedTask && selectedTask.id === taskId) {
              setDetailModalVisible(false);
              setSelectedTask(null);
            }

            try {
              const response = await fetch(`${backendUrl}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!response.ok) {
                throw new Error('Delete failed');
              }
            } catch (error) {
              setTasks(originalTasks);
              Alert.alert('Purge Failed', 'Could not complete objective deletion.');
            }
          },
        },
      ]
    );
  };

  // Add new task
  const handleAddTask = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required Field', 'Objective title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${backendUrl}/tasks/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          priority: newPriority,
          category_id: newCategoryId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Could not log task');
      }

      setTasks(prev => [data, ...prev]);
      
      // Reset form
      setNewTitle('');
      setNewDesc('');
      setNewPriority(2);
      setNewCategoryId(null);
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Deployment Error', error.message || 'Could not save task to cloud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Sort tasks based on states
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === null || task.category_id === selectedCategory;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !task.is_completed) ||
      (statusFilter === 'completed' && task.is_completed);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Apply sorting
  const processedTasks = [...filteredTasks].sort((a, b) => {
    if (sortByPriority) {
      // Priority 3 (Critical) first, then 2 (Tactical), then 1 (Routine)
      return b.priority - a.priority;
    }
    // Default: Sort by created_at (Newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getPriorityInfo = (level: number) => {
    switch (level) {
      case 3:
        return { label: 'CRITICAL', color: 'text-red-400 bg-red-950/40 border-red-500/20' };
      case 2:
        return { label: 'TACTICAL', color: 'text-amber-400 bg-amber-950/40 border-amber-500/20' };
      case 1:
      default:
        return { label: 'ROUTINE', color: 'text-slate-400 bg-slate-900/60 border-slate-800/40' };
    }
  };

  const getCategoryColor = (catId?: number) => {
    if (!catId) return '#64748B'; // slate
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.color : '#64748B';
  };

  const getCategoryName = (catId?: number) => {
    if (!catId) return null;
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : null;
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.is_completed).length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header Bar */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-900">
        <View>
          <Text className="text-white text-lg font-black tracking-widest uppercase">
            MISSION CONTROL
          </Text>
          <Text className="text-slate-500 text-xs font-medium">
            LOGGED AS: {user?.full_name || user?.email}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-slate-900 p-2.5 rounded-xl border border-slate-800"
        >
          <LogOut size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Hero Stats Card */}
      <View className="px-6 mt-4">
        <View className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-base font-bold">Progress Efficiency</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {completedTasksCount} of {totalTasksCount} objectives completed
              </Text>
            </View>
            <Text className="text-blue-400 text-3xl font-black">{progressPercent}%</Text>
          </View>
          <View className="w-full bg-slate-950 h-2 rounded-full mt-4 overflow-hidden">
            <View
              className="bg-blue-500 h-full rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>
      </View>

      {/* Search and Advanced Filters */}
      <View className="px-6 mt-4">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
            <Search size={18} color="#64748B" />
            <TextInput
              placeholder="Search objectives..."
              placeholderTextColor="#475569"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white ml-3 text-sm"
            />
          </View>
          
          {/* Sorting Toggle Button */}
          <TouchableOpacity
            onPress={() => setSortByPriority(!sortByPriority)}
            className={`p-3 rounded-xl border ${
              sortByPriority ? 'bg-blue-600/10 border-blue-500/40' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <ArrowUpDown size={18} color={sortByPriority ? '#3B82F6' : '#64748B'} />
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <View className="flex-row mt-3 bg-slate-900/60 p-1 rounded-xl border border-slate-900">
          {(['all', 'pending', 'completed'] as const).map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => setStatusFilter(status)}
              className={`flex-1 py-2 items-center rounded-lg ${
                statusFilter === status ? 'bg-blue-600' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${
                  statusFilter === status ? 'text-white' : 'text-slate-400'
                }`}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Categories chips (Horizontal Scroll) */}
      <View className="mt-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full border ${
              selectedCategory === null
                ? 'bg-blue-600/10 border-blue-500/45'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedCategory === null ? 'text-blue-400' : 'text-slate-400'
              }`}
            >
              All Categories
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full border flex-row items-center ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 border-blue-500/45'
                  : 'bg-slate-900/40 border-slate-900'
              }`}
              style={selectedCategory === cat.id ? { borderColor: cat.color + '66' } : {}}
            >
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: cat.color }}
              />
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === cat.id ? 'text-white' : 'text-slate-400'
                }`}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sorting indicator */}
      {sortByPriority && (
        <View className="px-6 mt-3 flex-row items-center">
          <Text className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
            🛡️ Sorted by Priority (Critical First)
          </Text>
        </View>
      )}

      {/* Tasks List */}
      {loading ? (
        <View className="flex-grow items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={processedTasks}
          keyExtractor={item => item.id.toString()}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={{ padding: 24, paddingBottom: 100, gap: 12 }}
          ListEmptyComponent={
            <View className="py-12 items-center justify-center bg-slate-900/20 border border-slate-900 rounded-3xl p-6">
              <FolderDot size={48} color="#334155" />
              <Text className="text-white text-base font-bold mt-4 text-center">
                No active objectives logged
              </Text>
              <Text className="text-slate-500 text-xs mt-1 text-center max-w-[200px]">
                Create a new mission plan or adjust filters.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const prioInfo = getPriorityInfo(item.priority);
            const catName = getCategoryName(item.category_id);
            const catColor = getCategoryColor(item.category_id);

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openTaskDetail(item)}
                className={`bg-slate-900/60 border border-slate-900/80 rounded-2xl p-4 flex-row items-start justify-between shadow-md ${
                  item.is_completed ? 'opacity-50' : ''
                }`}
              >
                <View className="flex-row items-start flex-1 pr-3">
                  <TouchableOpacity
                    onPress={() => toggleTaskCompletion(item)}
                    className="mt-1 mr-3.5"
                  >
                    {item.is_completed ? (
                      <CheckCircle2 size={22} color="#3B82F6" />
                    ) : (
                      <Circle size={22} color="#475569" />
                    )}
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className={`text-white text-base font-semibold ${
                        item.is_completed ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text
                        numberOfLines={1}
                        className={`text-slate-400 text-xs mt-1 leading-relaxed ${
                          item.is_completed ? 'text-slate-600' : ''
                        }`}
                      >
                        {item.description}
                      </Text>
                    )}

                    {/* Metadata tags */}
                    <View className="flex-row flex-wrap items-center mt-3 gap-2">
                      <View className={`border rounded px-2 py-0.5 ${prioInfo.color}`}>
                        <Text className="text-[9px] font-black tracking-widest">{prioInfo.label}</Text>
                      </View>

                      {catName && (
                        <View
                          className="border rounded px-2 py-0.5 bg-slate-950/60"
                          style={{ borderColor: catColor + '30' }}
                        >
                          <Text
                            className="text-[9px] font-bold"
                            style={{ color: catColor }}
                          >
                            {catName.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Delete button */}
                <TouchableOpacity
                  onPress={() => handleDeleteTask(item.id)}
                  className="p-2 bg-slate-950/40 rounded-xl border border-slate-800/40 hover:bg-red-950/30"
                >
                  <Trash2 size={16} color="#64748B" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg border border-blue-500/20"
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Task Details Dossier Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View className="flex-1 bg-slate-950/90 justify-center items-center px-6">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl w-full p-6 shadow-2xl">
            {/* Modal header */}
            <View className="flex-row items-center mb-5 border-b border-slate-800/60 pb-3 justify-between">
              <View className="flex-row items-center">
                <FileText size={18} color="#3B82F6" />
                <Text className="text-white text-sm font-bold ml-2 uppercase tracking-wider">
                  Objective Dossier
                </Text>
              </View>
              <View className="bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                <Text className="text-[10px] text-slate-500 font-mono">ID: #{selectedTask?.id}</Text>
              </View>
            </View>

            {/* Details Content */}
            <ScrollView className="max-h-[350px] mb-6" showsVerticalScrollIndicator={false}>
              <Text className="text-white text-xl font-bold mb-3">{selectedTask?.title}</Text>
              
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Detailed Specifications
              </Text>
              <View className="bg-slate-950 border border-slate-800/65 rounded-2xl p-4 mb-4">
                <Text className="text-slate-300 text-sm leading-relaxed">
                  {selectedTask?.description || 'No tactical details logged for this objective.'}
                </Text>
              </View>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-slate-500 text-xs">Priority Classification</Text>
                {selectedTask && (
                  <View className={`border rounded px-2.5 py-1 ${getPriorityInfo(selectedTask.priority).color}`}>
                    <Text className="text-[10px] font-black tracking-widest">
                      {getPriorityInfo(selectedTask.priority).label}
                    </Text>
                  </View>
                )}
              </View>

              {selectedTask?.category_id && (
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-slate-500 text-xs">Assigned Category</Text>
                  <View
                    className="border rounded px-2.5 py-1 bg-slate-950"
                    style={{ borderColor: getCategoryColor(selectedTask.category_id) + '40' }}
                  >
                    <Text
                      className="text-[10px] font-black tracking-wider"
                      style={{ color: getCategoryColor(selectedTask.category_id) }}
                    >
                      {getCategoryName(selectedTask.category_id)?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-slate-500 text-xs">Completion Status</Text>
                <Text
                  className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded ${
                    selectedTask?.is_completed
                      ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-500/20'
                      : 'text-blue-400 bg-blue-950/20 border border-blue-500/20'
                  }`}
                >
                  {selectedTask?.is_completed ? 'RESOLVED (SUCCESS)' : 'ACTIVE (PENDING)'}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 text-xs">Logged Timestamp</Text>
                <Text className="text-slate-400 text-xs font-mono">
                  {selectedTask && new Date(selectedTask.created_at).toLocaleString()}
                </Text>
              </View>
            </ScrollView>

            {/* dossier actions */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => selectedTask && toggleTaskCompletion(selectedTask)}
                className={`flex-1 py-3.5 items-center justify-center rounded-xl border ${
                  selectedTask?.is_completed
                    ? 'bg-slate-950 border-slate-800 text-slate-400'
                    : 'bg-blue-600 border-blue-500/10 text-white'
                }`}
              >
                <Text className="text-[11px] font-black tracking-wider uppercase text-center text-white">
                  {selectedTask?.is_completed ? 'REACTIVATE' : 'MARK SUCCESS'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectedTask && handleDeleteTask(selectedTask.id)}
                className="bg-red-950/20 border border-red-500/20 px-4 py-3.5 rounded-xl items-center justify-center"
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                className="bg-slate-950 border border-slate-800 px-4 py-3.5 rounded-xl items-center justify-center"
              >
                <Text className="text-slate-400 text-xs font-semibold">CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-slate-950/90 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-[32px] p-6 pb-12 shadow-2xl">
            {/* Modal header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-lg font-bold">NEW OBJECTIVE CONFIG</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full"
              >
                <Text className="text-slate-400 text-xs font-semibold">CLOSE</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <ScrollView className="max-h-[500px]" showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Title
                </Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Enter objective title"
                  placeholderTextColor="#475569"
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-base"
                />
              </View>

              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Description (Optional)
                </Text>
                <TextInput
                  value={newDesc}
                  onChangeText={setNewDesc}
                  placeholder="Enter detailed description"
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={3}
                  className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-base min-h-[80px]"
                />
              </View>

              {/* Priority Select */}
              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Priority
                </Text>
                <View className="flex-row gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {([1, 2, 3] as const).map(prio => {
                    const label = prio === 3 ? 'CRITICAL (P3)' : prio === 2 ? 'TACTICAL (P2)' : 'ROUTINE (P1)';
                    const isSelected = newPriority === prio;
                    return (
                      <TouchableOpacity
                        key={prio}
                        onPress={() => setNewPriority(prio)}
                        className={`flex-grow py-2.5 items-center rounded-lg ${
                          isSelected ? 'bg-blue-600' : ''
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Category Select */}
              <View className="mb-6">
                <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    onPress={() => setNewCategoryId(null)}
                    className={`px-3 py-2 rounded-xl border ${
                      newCategoryId === null
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                        : 'bg-slate-950 border-slate-800/60'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        newCategoryId === null ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setNewCategoryId(cat.id)}
                      className={`px-3 py-2 rounded-xl border flex-row items-center ${
                        newCategoryId === cat.id
                          ? 'bg-slate-950 border-blue-500/40'
                          : 'bg-slate-950/40 border-slate-950'
                      }`}
                      style={newCategoryId === cat.id ? { borderColor: cat.color + '88' } : {}}
                    >
                      <View
                        className="w-1.5 h-1.5 rounded-full mr-2"
                        style={{ backgroundColor: cat.color }}
                      />
                      <Text
                        className={`text-xs font-semibold ${
                          newCategoryId === cat.id ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Launch Action */}
            <TouchableOpacity
              onPress={handleAddTask}
              disabled={isSubmitting}
              className="bg-blue-600 rounded-xl py-4 items-center justify-center shadow-lg border border-blue-500/20"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold tracking-widest uppercase">
                  DEPLOY OBJECTIVE
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
