import React, { useState, useEffect } from 'react';
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
  StatusBar
} from 'react-native';

export default function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photos, setPhotos] = useState([]);
  const [storageUsed, setStorageUsed] = useState(0); // in MB
  const maxStorage = 100; // 100 MB Limit

  const handleRegister = () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    setIsRegistered(true);
  };

  if (!isRegistered) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.authBox}>
          <Text style={styles.shieldLogo}>🛡️</Text>
          <Text style={styles.title}>My Data Safe</Text>
          <Text style={styles.subtitle}>Secure Vault Registration</Text>

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
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerShield}>🛡️</Text>
          <Text style={styles.headerTitle}>My Data Safe</Text>
        </View>
        <Text style={styles.storageText}>
          Storage: {storageUsed} MB / {maxStorage} MB
        </Text>
      </View>

      <View style={styles.galleryContainer}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your Vault is Empty</Text>
            <Text style={styles.emptySubtext}>Add photos to store them securely</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item, index) => index.toString()}
            numColumns={3}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.photo} />
            )}
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => Alert.alert('Add Photo', 'Image picker integration ready!')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
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
    marginBottom: 32,
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
    marginTop: 8,
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
  galleryContainer: {
    flex: 1,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  photo: {
    width: '31%',
    height: 100,
    margin: '1%',
    borderRadius: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
  },
});
