import React, { useState, useEffect, useRef } from "react";
import { View, FlatList, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getProductsByCategory, getCategories } from "../api/products";
import ProductCard from "../components/ProductCard";

const { width } = Dimensions.get('window');

export default function CategoryScreen() {
  const { data: rawCategories, isError: categoriesError } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  // Animation values
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerScaleAnim = useRef(new Animated.Value(0.9)).current;
  const tabSlideAnim = useRef(new Animated.Value(-50)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(tabSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const { data: products, refetch, isFetching } = useQuery({
    queryKey: ["category", selectedCategory],
    queryFn: () => getProductsByCategory(selectedCategory),
    enabled: !!selectedCategory,
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // Trigger header animation on category change
    Animated.sequence([
      Animated.timing(headerScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(headerScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      {/* Animated Tab Bar */}
      <Animated.View
        style={[
          styles.tabsContainer,
          {
            transform: [{ translateY: tabSlideAnim }],
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabs}
          contentContainerStyle={styles.tabsContent}
        >
          {normalized.map((cat: Cat, index: number) => {
            const active = cat.value === selectedCategory;
            const disabled = !!categoriesError;
            return (
              <AnimatedTab
                key={cat.key}
                cat={cat}
                active={active}
                disabled={disabled}
                onPress={() => !disabled && handleCategoryChange(cat.value)}
                index={index}
              />
            );
          })}
        </ScrollView>
      </Animated.View>

      <FlatList
        data={products || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <AnimatedProductCard
            title={item.title}
            thumbnail={item.thumbnail}
            index={index}
          />
        )}
        onRefresh={refetch}
        refreshing={isFetching}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Animated.View
            style={[
              styles.headerContainer,
              {
                opacity: headerFadeAnim,
                transform: [{ scale: headerScaleAnim }],
              },
            ]}
          >
            <View style={styles.headerContent}>
              <Text style={styles.header}>{selectedCategory}</Text>
              {products && products.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{products.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerUnderline}>
              <Animated.View
                style={[
                  styles.shimmerLine,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              />
            </View>
          </Animated.View>
        }
        ListEmptyComponent={
          isFetching ? null : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <View style={styles.emptyIcon} />
              </View>
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptyText}>
                Try selecting a different category
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

// Animated Tab Component
const AnimatedTab = ({ cat, active, disabled, onPress, index }: any) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.tabButton,
          active && styles.tabActive,
          disabled && styles.tabDisabled,
        ]}
      >
        <Text
          style={[
            styles.tabText,
            active && styles.tabTextActive,
            disabled && styles.tabTextDisabled,
          ]}
        >
          {cat.label}
        </Text>
        {active && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Product Card Wrapper
const AnimatedProductCard = ({ index, ...props }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        flex: 1,
        margin: 6,
      }}
    >
      <ProductCard {...props} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: 400,
    overflow: 'hidden',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    top: -100,
    right: -50,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    top: 100,
    left: -60,
  },
  backgroundCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
    top: 200,
    right: 40,
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabs: {
    paddingVertical: 12,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    color: '#374151',
    textTransform: 'capitalize',
    fontWeight: '600',
    fontSize: 15,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabTextDisabled: {
    color: '#9ca3af',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textTransform: 'capitalize',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  countText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },
  headerUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  shimmerLine: {
    width: 60,
    height: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  listContent: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});