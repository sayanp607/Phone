import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { deviceAPI, logAPI } from '../services/api';
import socket from '../services/socket';
import DeviceCard from '../components/DeviceCard';
import DeviceControl from '../components/DeviceControl';
import ActivityLog from '../components/ActivityLog';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
    setupSocketListeners();

    return () => {
      socket.off('device:status');
      socket.off('command:response');
    };
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadLogs(selectedDevice._id);
    }
  }, [selectedDevice]);

  const setupSocketListeners = () => {
    socket.on('device:status', (data) => {
      setDevices(prev => prev.map(device => 
        device.deviceId === data.deviceId 
          ? { ...device, ...data, lastSeen: new Date() }
          : device
      ));

      if (selectedDevice?.deviceId === data.deviceId) {
        setSelectedDevice(prev => ({ ...prev, ...data, lastSeen: new Date() }));
      }
    });

    socket.on('command:response', (data) => {
      console.log('Command response:', data);
      if (selectedDevice) {
        loadLogs(selectedDevice._id);
      }
    });
  };

  const loadDevices = async () => {
    try {
      const response = await deviceAPI.getDevices();
      if (response.success) {
        setDevices(response.devices || []);
        if (response.devices?.length > 0 && !selectedDevice) {
          setSelectedDevice(response.devices[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (deviceId) => {
    try {
      const response = await logAPI.getLogs(deviceId, 20);
      if (response.success) {
        setLogs(response.logs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const handleSendCommand = async (command, payload = {}) => {
    if (!selectedDevice) return;

    try {
      const response = await deviceAPI.sendCommand(selectedDevice._id, command, payload);
      if (response.success) {
        console.log('Command sent successfully');
        setTimeout(() => loadLogs(selectedDevice._id), 500);
      }
    } catch (error) {
      console.error('Failed to send command:', error);
      alert('Failed to send command: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📱 Device Control Panel</h1>
          <div className="header-actions">
            <span className="user-name">👤 {user?.name}</span>
            <button onClick={logout} className="btn btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Devices List */}
        <aside className="devices-sidebar">
          <h2>Your Devices ({devices.length})</h2>
          <div className="devices-list">
            {devices.length === 0 ? (
              <div className="empty-state">
                <p>No devices registered yet</p>
                <p className="hint">Install the mobile app and register your device</p>
              </div>
            ) : (
              devices.map(device => (
                <DeviceCard
                  key={device._id}
                  device={device}
                  isSelected={selectedDevice?._id === device._id}
                  onClick={() => setSelectedDevice(device)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Device Controls */}
        <main className="main-panel">
          {selectedDevice ? (
            <>
              <DeviceControl 
                device={selectedDevice} 
                onSendCommand={handleSendCommand}
              />
              <ActivityLog logs={logs} />
            </>
          ) : (
            <div className="empty-state">
              <h2>Select a device to control</h2>
              <p>Choose a device from the sidebar to view details and send commands</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
