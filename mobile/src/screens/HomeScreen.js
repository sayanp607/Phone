import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import { getDeviceName } from '../utils/deviceId';
import FlashlightController from '../components/FlashlightController';

export default function HomeScreen() {
  const { user, logout, deviceId } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    setDeviceName(getDeviceName());

    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(socketService.getConnectionStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setIsConnected(socketService.getConnectionStatus());
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <FlashlightController />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.header}>
        <Text style={styles.title}>📱 Device Control</Text>
        <Text style={styles.subtitle}>Welcome, {user?.name}!</Text>
      </View>

      {/* Connection Status Card */}
      <View style={[styles.card, isConnected ? styles.cardOnline : styles.cardOffline]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isConnected ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.statusText}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>
        <Text style={styles.statusSubtext}>
          {isConnected
            ? 'Ready to receive commands from web dashboard'
            : 'Connecting to server...'}
        </Text>
      </View>

      {/* Device Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device Name:</Text>
          <Text style={styles.infoValue}>{deviceName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device ID:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {deviceId ? deviceId.substring(0, 20) + '...' : 'Loading...'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
      </View>

      {/* Instructions Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>How to Use</Text>
        <Text style={styles.instructionText}>
          1. Keep this app running in the background{'\n'}
          2. Open the web dashboard on your laptop{'\n'}
          3. Login with the same account{'\n'}
          4. Send commands to control this device{'\n'}
          {'\n'}
          <Text style={styles.instructionBold}>Available Commands:</Text>{'\n'}
          • Ring Phone 📱{'\n'}
          • Toggle Flashlight 🔦{'\n'}
          • Set Alarm ⏰{'\n'}
          • Get Location 📍
        </Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Pull down to refresh connection status
      </Text>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardOnline: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  cardOffline: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  dotOnline: {
    backgroundColor: '#34C759',
  },
  dotOffline: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
    marginLeft: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  instructionBold: {
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
});
