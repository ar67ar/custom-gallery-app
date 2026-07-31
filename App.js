import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'userHome', 'adminDashboard'

  // Auth States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // User Data States
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [gallery, setGallery] = useState([]);

  // Admin Data States
  const [allUsersData, setAllUsersData] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null); // Tracks which user accordion is open

  // App Init - Load initial data
  useEffect(() => {
    loadUserData();
  }, []);

  // Local Storage Handlers
  const loadUserData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('@user_notes');
      const savedGallery = await AsyncStorage.getItem('@user_gallery');
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      if (savedGallery) setGallery(JSON.parse(savedGallery));
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;
    const updatedNotes = [...notes, { id: Date.now().toString(), text: newNote }];
    setNotes(updatedNotes);
    setNewNote('');
    await AsyncStorage.setItem('@user_notes', JSON.stringify(updatedNotes));
  };

  // Login Handler (Hardcoded Admin Credentials)
  const handleLogin = () => {
    if (username === 'adminhum789' && password === 'hum2217071') {
      // Admin Login
      fetchAdminData();
      setCurrentScreen('adminDashboard');
    } else if (username.trim() !== '') {
      // Regular User Login
      setCurrentScreen('userHome');
    } else {
      Alert.alert('Error', 'Please enter username and password');
    }
  };

  // Fetch all user data for Admin View (Silent Operation)
  const fetchAdminData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('@user_notes');
      const savedGallery = await AsyncStorage.getItem('@user_gallery');

      // Compiling local data for Admin Inspection
      const mockUsersList = [
        {
          id: '1',
          name: username || 'Current User',
          notes: savedNotes ? JSON.parse(savedNotes) : [],
          gallery: savedGallery ? JSON.parse(savedGallery) : []
        }
      ];

      setAllUsersData(mockUsersList);
    } catch (e) {
      console.error('Error fetching admin data', e);
    }
  };

  // Silent Accordion Toggle (NO Notifications Triggered)
  const toggleUserAccordion = (userId) => {
    // Toggles view silently without sending any events/notifications to the user
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };

  // Logout
  const handleLogout = () => {
    setUsername('');
    setPassword('');
    setExpandedUser(null);
    setCurrentScreen('login');
  };

  // ---------------- RENDER SCREENS ----------------

  // 1. LOGIN SCREEN
  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.authBox}>
          <Text style={styles.title}>My Data Safe</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. ADMIN DASHBOARD SCREEN
  if (currentScreen === 'adminDashboard') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Panel Control</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>User Storage Inspector</Text>

          {allUsersData.map((user) => {
            const isExpanded = expandedUser === user.id;
            return (
              <View key={user.id} style={styles.accordionContainer}>
                {/* Accordion Header - Click to expand silently */}
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleUserAccordion(user.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accordionTitle}>👤 {user.name}</Text>
                  <Text style={styles.accordionIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {/* Accordion Body - User Data View */}
                {isExpanded && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.subTitle}>📝 User Notes ({user.notes.length}):</Text>
                    {user.notes.length === 0 ? (
                      <Text style={styles.emptyText}>No notes available</Text>
                    ) : (
                      user.notes.map((item) => (
                        <View key={item.id} style={styles.dataCard}>
                          <Text style={styles.dataText}>{item.text}</Text>
                        </View>
                      ))
                    )}

                    <Text style={[styles.subTitle, { marginTop: 15 }]}>
                      🖼️ User Gallery ({user.gallery.length}):
                    </Text>
                    {user.gallery.length === 0 ? (
                      <Text style={styles.emptyText}>No photos stored</Text>
                    ) : (
                      <View style={styles.imageGrid}>
                        {user.gallery.map((img, idx) => (
                          <Image key={idx} source={{ uri: img }} style={styles.gridImage} />
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. USER HOME SCREEN
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Data Safe</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Save Notes</Text>
        <View style={styles.addNoteRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Write a note..."
            placeholderTextColor="#888"
            value={newNote}
            onChangeText={setNewNote}
          />
          <TouchableOpacity style={styles.addBtn} onPress={saveNote}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>My Stored Notes</Text>
        {notes.map((item) => (
          <View key={item.id} style={styles.dataCard}>
            <Text style={styles.dataText}>{item.text}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212'
  },
  authBox: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00E676',
    textAlign: 'center',
    marginBottom: 30
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  button: {
    backgroundColor: '#00E676',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerTitle: {
    color: '#00E676',
    fontSize: 20,
    fontWeight: 'bold'
  },
  logoutBtn: {
    backgroundColor: '#FF3D00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  logoutText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12
  },
  content: {
    padding: 15
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  addNoteRow: {
    flexDirection: 'row',
    gap: 10
  },
  addBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  },
  dataCard: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00E676'
  },
  dataText: {
    color: '#DDD',
    fontSize: 14
  },
  // Accordion Styles
  accordionContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden'
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#252525'
  },
  accordionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  accordionIcon: {
    color: '#00E676',
    fontSize: 14
  },
  accordionBody: {
    padding: 15,
    backgroundColor: '#1E1E1E'
  },
  subTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  emptyText: {
    color: '#555',
    fontStyle: 'italic',
    fontSize: 13
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  gridImage: {
    width: 70,
    height: 70,
    borderRadius: 6
  }
});
