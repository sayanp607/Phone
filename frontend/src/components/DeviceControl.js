import React, { useState } from 'react';
import './DeviceControl.css';

export default function DeviceControl({ device, onSendCommand }) {
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmMessage, setAlarmMessage] = useState('');

  const handleRing = () => {
    onSendCommand('ring');
  };

  const handleFlashlight = (state) => {
    onSendCommand(state ? 'flashlight_on' : 'flashlight_off');
  };

  const handleLocation = () => {
    onSendCommand('location_request');
  };

  const handleSetAlarm = () => {
    if (!alarmTime) {
      alert('Please select a time for the alarm');
      return;
    }

    onSendCommand('set_alarm', {
      time: new Date(alarmTime).toISOString(),
      message: alarmMessage || 'Alarm from web dashboard'
    });

    setAlarmTime('');
    setAlarmMessage('');
  };

  const isOnline = device.status === 'online';

  return (
    <div className="device-control">
      <div className="control-header">
        <h2>{device.deviceName}</h2>
        <span className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '● Online' : '○ Offline'}
        </span>
      </div>

      <div className="device-details">
        <div className="detail-item">
          <span className="detail-label">Device ID:</span>
          <span className="detail-value">{device.deviceId}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Battery Level:</span>
          <span className="detail-value">
            {device.batteryLevel !== null ? (
              <span className={`battery ${getBatteryClass(device.batteryLevel)}`}>
                🔋 {device.batteryLevel}%
              </span>
            ) : 'N/A'}
          </span>
        </div>
        {device.location?.latitude && (
          <div className="detail-item">
            <span className="detail-label">Location:</span>
            <span className="detail-value">
              <a 
                href={`https://www.google.com/maps?q=${device.location.latitude},${device.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="location-link"
              >
                📍 View on Map
              </a>
            </span>
          </div>
        )}
      </div>

      <div className="control-section">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            onClick={handleRing} 
            className="action-btn ring-btn"
            disabled={!isOnline}
          >
            🔔 Ring Phone
          </button>
          <button 
            onClick={() => handleFlashlight(true)} 
            className="action-btn flashlight-btn"
            disabled={!isOnline}
          >
            💡 Flashlight ON
          </button>
          <button 
            onClick={() => handleFlashlight(false)} 
            className="action-btn flashlight-off-btn"
            disabled={!isOnline}
          >
            🌑 Flashlight OFF
          </button>
          <button 
            onClick={handleLocation} 
            className="action-btn location-btn"
            disabled={!isOnline}
          >
            📍 Get Location
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3>Set Alarm</h3>
        <div className="alarm-form">
          <input
            type="datetime-local"
            value={alarmTime}
            onChange={(e) => setAlarmTime(e.target.value)}
            className="alarm-input"
            disabled={!isOnline}
          />
          <input
            type="text"
            value={alarmMessage}
            onChange={(e) => setAlarmMessage(e.target.value)}
            placeholder="Alarm message (optional)"
            className="alarm-input"
            disabled={!isOnline}
          />
          <button 
            onClick={handleSetAlarm} 
            className="action-btn alarm-btn"
            disabled={!isOnline}
          >
            ⏰ Set Alarm
          </button>
        </div>
      </div>

      {!isOnline && (
        <div className="offline-notice">
          ⚠️ Device is offline. Connect your device to send commands.
        </div>
      )}
    </div>
  );
}

function getBatteryClass(level) {
  if (level > 50) return 'high';
  if (level > 20) return 'medium';
  return 'low';
}
