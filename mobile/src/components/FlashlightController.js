import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { flashlightEmitter } from '../services/commandService';

// Hidden camera component for real flashlight control
export default function FlashlightController() {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashlightOn, setFlashlightOn] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }

    // Listen for flashlight toggle events
    const toggleListener = (enabled) => {
      console.log('Flashlight toggle:', enabled);
      setFlashlightOn(enabled);
    };

    flashlightEmitter.on('toggleFlashlight', toggleListener);

    return () => {
      flashlightEmitter.off('toggleFlashlight', toggleListener);
    };
  }, []);

  if (!permission?.granted || !flashlightOn) {
    return null;
  }

  return (
    <View style={styles.hidden}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    top: -1000,
  },
  camera: {
    width: 1,
    height: 1,
  },
});
