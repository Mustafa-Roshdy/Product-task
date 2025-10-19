import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';

export default function Snackbar({ visible, message, duration = 3000, onDismiss }: {
  visible: boolean;
  message: string;
  duration?: number;
  onDismiss?: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      const t = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => onDismiss && onDismiss());
      }, duration);
      return () => clearTimeout(t);
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => onDismiss && onDismiss());
    }
  }, [visible]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
  const opacity = anim;

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={() => { Animated.timing(anim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => onDismiss && onDismiss()); }}>
      <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]} pointerEvents="box-none">
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
