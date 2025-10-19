import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function OfflineBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Offline — showing cached content</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f8fafc", padding: 8, borderBottomWidth: 1, borderBottomColor: '#e6e6e6' },
  text: { color: "#333", textAlign: "center", fontSize: 13 },
});
