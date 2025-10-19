import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  title: string;
  thumbnail: string;
  description?: string;
  category?: string;
  price?: number;
  rating?: number;
  isSuperAdmin?: boolean;
  onDelete?: () => void;
};

export default function ProductCard({ title, thumbnail, description, category, price, rating, isSuperAdmin, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: thumbnail }} style={styles.img} />
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      {description ? <Text style={styles.desc} numberOfLines={2}>{description}</Text> : null}
      <View style={styles.metaRow}>
        {category ? <Text style={styles.meta}>{category}</Text> : null}
        {typeof price === 'number' ? <Text style={styles.price}>${price}</Text> : null}
      </View>
      {typeof rating === 'number' ? <Text style={styles.rating}>★ {rating}</Text> : null}

      {isSuperAdmin && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, margin: 8, backgroundColor: "#fff", borderRadius: 12, width: 160, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  img: { width: "100%", height: 110, borderRadius: 8, backgroundColor: '#f3f4f6' },
  title: { marginTop: 8, fontWeight: "700", color: '#111', fontSize: 14 },
  desc: { marginTop: 4, color: '#6b7280', fontSize: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  meta: { fontSize: 12, color: '#374151' },
  price: { fontSize: 13, fontWeight: '700', color: '#111' },
  rating: { marginTop: 6, color: '#f59e0b', fontWeight: '600' },
  deleteBtn: { marginTop: 10, backgroundColor: '#fee2e2', paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  deleteText: { color: '#b91c1c', fontWeight: '700' },
});
