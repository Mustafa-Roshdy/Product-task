import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";

export default function LockOverlay({
  visible,
  onBiometric,
  onPassword,
}: {
  visible: boolean;
  onBiometric?: () => void;
  onPassword?: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [visible]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const opacity = anim;

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.backdrop} pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <Text style={styles.title}>Locked</Text>
          <Text style={styles.subtitle}>Authenticate to continue</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={onBiometric}>
              <Text style={[styles.actionText, styles.primaryText]}>Use Biometrics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.ghost]} onPress={onPassword}>
              <Text style={[styles.actionText, styles.ghostText]}>Use Password</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 18, textAlign: 'center' },
  actions: { width: '100%' },
  actionButton: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  primary: { backgroundColor: '#111827' },
  ghost: { backgroundColor: '#f3f4f6' },
  actionText: { fontSize: 15, fontWeight: '600' },
  primaryText: { color: '#fff' },
  ghostText: { color: '#111' },
});
