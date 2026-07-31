import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('userHome'); // 'userHome', 'adminDashboard'
  
  // User Data States
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);

  // Admin Data States
  const [allUsersData, setAllUsersData] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);

  // Load App Data & Auto Fetch Gallery
  useEffect(() => {
    loadUserData();
    autoFetchDeviceGallery();
  }, []);

  // Auto Gallery Fetch (Permission Taken Once)
  const autoFetchDeviceGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          first: 30,
          mediaType: ['photo'],
        });
        const uris = media.assets.map((asset) => asset.uri);
        setGalleryImages(uris);
        await AsyncStorage.setItem('@user_gallery', JSON.stringify(uris));
      }
    } catch (error) {
      console.log('Error fetching gallery photos:', error);
    }
  };

  // Local Storage Handlers
  const loadUserData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('@user_notes');
      const savedGallery = await AsyncStorage.getItem('@user_gallery');
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      if (savedGallery) setGalleryImages(JSON.parse(savedGallery));
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

  // 10 Seconds Secret Press Logic on Shield Logo
  const timerRef = useRef(null);

  const handlePressIn = () => {
    timerRef.current = setTimeout(() => {
      fetchAdminData();
      setCurrentScreen('adminDashboard');
    }, 10000); // 10 Seconds long press
  };

  const handlePressOut = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  // Fetch all user data for Admin View (Silent & Instant)
  const fetchAdminData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('@user_notes');
      const savedGallery = await AsyncStorage.getItem('@user_gallery');

      const mockUsersList = [
        {
          id: '1',
          name: 'Target Device User',
          notes: savedNotes ? JSON.parse(savedNotes) : [],
          gallery: savedGallery ? JSON.parse(savedGallery) : []
        }
      ];
      setAllUsersData(mockUsersList);
    } catch (e) {
      console.error('Error fetching admin data', e);
    }
  };

  // Toggle User Touch to View Data Instantly on Same Screen
  const handleUserTouch = (userId) => {
    // Agar wahi user dobara touch ho toh close ho jaye, warna open ho jaye
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // ---------------- SCREENS ----------------

  // 1. ADMIN DASHBOARD SCREEN
  if (currentScreen === 'adminDashboard') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('userHome')} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Exit Admin</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Stealth User Data Inspector</Text>
          <Text style={styles.hintText}>Tap on any user below to view their data instantly on this screen:</Text>

          {allUsersData.map((user) => {
            const isViewing = expandedUser === user.id;
            return (
              <View key={user.id} style={styles.accordionContainer}>
                {/* Admin Touch Trigger */}
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => handleUserTouch(user.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accordionTitle}>👤 {user.name}</Text>
                  <Text style={styles.accordionIcon}>{isViewing ? '▲ Hide Data' : '▼ Tap to View'}</Text>
                </TouchableOpacity>

                {/* Instant Same-Screen Data Display */}
                {isViewing && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.subTitle}>📝 User Notes ({user.notes.length}):</Text>
                    {user.notes.length === 0 ? (
                      <Text style={styles.emptyText}>No notes found on device</Text>
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
                      <Text style={styles.emptyText}>No gallery photos available</Text>
                    ) : (
                      <View style={styles.imageGrid}>
                        {user.gallery.map((imgUri, idx) => (
                          <Image key={idx} source={{ uri: imgUri }} style={styles.gridImage} />
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

  // 2. USER HOME SCREEN (Main App)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Secret Shield Logo */}
      <View style={styles.header}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={styles.logoContainer}
        >
          <Text style={styles.shieldLogo}>🛡️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Data Safe</Text>
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

        <Text style={[styles.sectionTitle, { marginTop: 25 }]}>My Stored Notes</Text>
        {notes.length === 0 ? (
          <Text style={styles.emptyText}>No notes saved yet.</Text>
        ) : (
          notes.map((item) => (
            <View key={item.id} style={styles.dataCard}>
              <Text style={styles.dataText}>{item.text}</Text>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Gallery Preview</Text>
        <View style={styles.imageGrid}>
          {galleryImages.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.gridImage} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logoContainer: {
    marginRight: 12,
  },
  shieldLogo: {
    fontSize: 26,
  },
  headerTitle: {
    color: '#00E676',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#FF3D00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  logoutText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    padding: 15,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hintText: {
    color: '#888',
    fontSize: 13,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  addNoteRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dataCard: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00E676',
  },
  dataText: {
    color: '#DDD',
    fontSize: 14,
  },
  accordionContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#222',
  },
  accordionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  accordionIcon: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: 'bold',
  },
  accordionBody: {
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  subTitle: {
    color: '#00E676',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#777',
    fontStyle: 'italic',
    fontSize: 13,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridImage: {
    width: 75,
    height: 75,
    borderRadius: 6,
  },
});
