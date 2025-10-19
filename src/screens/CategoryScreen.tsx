import React, { useState, useEffect } from "react";
import { View, FlatList, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getProductsByCategory, getCategories } from "../api/products";
import ProductCard from "../components/ProductCard";

export default function CategoryScreen() {
  const { data: rawCategories, isError: categoriesError } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  // Normalize categories into objects { key, label, value }
  type Cat = { key: string; label: string; value: string };
  const normalized: Cat[] = (rawCategories && rawCategories.length ? rawCategories : ["smartphones"]).map((c: any, idx: number) => {
    if (typeof c === 'string') return { key: c, label: c, value: c };
    // handle object case { slug, name, url }
    const value = c.slug ?? c.name ?? String(idx);
    const label = c.name ?? c.slug ?? String(c);
    const key = `${value}-${idx}`;
    return { key, label, value };
  });

  const initial = normalized.length ? normalized[0].value : 'smartphones';
  const [selectedCategory, setSelectedCategory] = useState<string>(initial);

  useEffect(() => {
    if (normalized.length && !selectedCategory) setSelectedCategory(normalized[0].value);
  }, [rawCategories]);

  const { data: products, refetch, isFetching } = useQuery({
    queryKey: ["category", selectedCategory],
    queryFn: () => getProductsByCategory(selectedCategory),
    enabled: !!selectedCategory,
  });

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {normalized.map((cat: Cat) => {
          const active = cat.value === selectedCategory;
          const disabled = !!categoriesError;
          return (
            <TouchableOpacity key={cat.key} onPress={() => !disabled && setSelectedCategory(cat.value)} disabled={disabled} style={[styles.tabButton, active && styles.tabActive, disabled && styles.tabDisabled]}>
              <Text style={[styles.tabText, active && styles.tabTextActive, disabled && styles.tabTextDisabled]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={products || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ProductCard title={item.title} thumbnail={item.thumbnail} />}
        onRefresh={refetch}
        refreshing={isFetching}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={<Text style={styles.header}>{selectedCategory}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  tabs: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  tabButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  tabActive: { backgroundColor: '#111827' },
  tabText: { color: '#111', textTransform: 'capitalize' },
  tabTextActive: { color: '#fff' },
  tabDisabled: { opacity: 0.5 },
  tabTextDisabled: { color: '#9ca3af' },
  header: { fontSize: 18, fontWeight: '700', marginVertical: 10, marginLeft: 4 },
});
