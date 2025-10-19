import React, { useRef, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Animated,
  Dimensions,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getAllProducts, deleteProduct } from "../api/products";
import ProductCard from "../components/ProductCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { storage, STORAGE_KEYS } from "../utils/mmkvPersister";
import Snackbar from '../components/Snackbar';
import { useState } from 'react';


const { width } = Dimensions.get('window');

export default function AllProductsScreen() {
  const { isSuperAdmin } = useSelector((state: any) => state.auth);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const queryClient = useQueryClient();
  const [usingCache, setUsingCache] = useState(false);

  // Animation values
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer animation for header
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

  let initialProducts: any[] | undefined = undefined;
  try {
    const cached = storage.getString(STORAGE_KEYS.REACT_QUERY_CACHE);
    if (cached) {
      const parsed = JSON.parse(cached);
      initialProducts = parsed.products || undefined;
    }
  } catch (err) {
    // ignore
  }

  const { data, refetch, isFetching, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      setUsingCache(false);
      try {
        const fresh = await getAllProducts();
        try {
          storage.set(STORAGE_KEYS.REACT_QUERY_CACHE, JSON.stringify({ products: fresh }));
        } catch (e) {
          // ignore
        }
        return fresh;
      } catch (e) {
        try {
          const raw = storage.getString(STORAGE_KEYS.REACT_QUERY_CACHE);
          if (raw) {
            const parsed = JSON.parse(raw);
            setUsingCache(true);
            return parsed.products || [];
          }
        } catch (err) {
          // ignore
        }
        throw e;
      }
    },
    initialData: initialProducts,
    staleTime: 1000 * 60 * 5,
  });

  const handleDelete = async (id: number) => {
    try {
      const qData = queryClient.getQueryData<any[]>(["products"]);
      let products: any[] = Array.isArray(qData) ? qData : [];
      if (!products || products.length === 0) {
        const raw = storage.getString(STORAGE_KEYS.REACT_QUERY_CACHE);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            products = parsed.products || [];
          } catch (e) {
            products = data || [];
          }
        } else {
          products = data || [];
        }
      }

      const idNum = Number(id);
      const remaining = products.filter((p: any) => Number(p.id) !== idNum);
      try {
        storage.set(STORAGE_KEYS.REACT_QUERY_CACHE, JSON.stringify({ products: remaining }));
      } catch (e) {
        console.warn('[AllProducts] failed to persist delete locally', e);
      }

      queryClient.setQueryData(["products"], remaining);
      setSnackMessage('Item removed');
      setSnackVisible(true);

      (async () => {
        try {
          await deleteProduct(id);
        } catch (err) {
          console.warn('[AllProducts] background delete failed', err);
        }
      })();
    } catch (err) {
      console.warn('[AllProducts] delete flow failed', err);
      setSnackMessage('Delete failed');
      setSnackVisible(true);
    }
  };

  useEffect(() => {
    if (!isFetching && data && initialProducts && data !== initialProducts) {
      setUsingCache(false);
    }
  }, [data, isFetching]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          opacity: headerFadeAnim,
          transform: [{ translateY: headerSlideAnim }],
        },
      ]}
    >
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerTitle}>All Products</Text>
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
        </View>
        {usingCache && (
          <View style={styles.cachedBadge}>
            <View style={styles.cachedDot} />
            <Text style={styles.cachedText}>Cached</Text>
          </View>
        )}
      </View>
      {data && data.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{data.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAlt]}>
            <Text style={styles.statNumber}>
              {new Set(data.map((p: any) => p.category)).size}
            </Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.backgroundGradient}>
          <View style={styles.backgroundCircle1} />
          <View style={styles.backgroundCircle2} />
        </View>

        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader()}
          renderItem={({ item, index }) => {
            const cardProps: any = {
              title: item.title,
              thumbnail: item.thumbnail,
              description: item.description,
              category: item.category,
              price: item.price,
              rating: item.rating?.rate ?? item.rating,
              isSuperAdmin,
              onDelete: () => handleDelete(item.id),
            };
            return (
              <AnimatedProductCard
                {...cardProps}
                index={index}
                key={item.id}
              />
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#3b82f6"
              colors={["#3b82f6", "#8b5cf6"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <View style={styles.emptyIcon} />
              </View>
              <Text style={styles.emptyTitle}>
                {isError ? "Oops! Something went wrong" : "No products yet"}
              </Text>
              <Text style={styles.emptyText}>
                {isError
                  ? "Pull down to refresh and try again"
                  : "Check back later for new products"}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
      <Snackbar
        visible={snackVisible}
        message={snackMessage}
        onDismiss={() => setSnackVisible(false)}
      />
    </>
  );
}

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
      <View style={styles.cardWrapper}>
        <ProductCard {...props} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  backgroundGradient: {
    position: 'absolute',
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    top: -150,
    right: -100,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    top: 50,
    left: -50,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: "#111827",
    letterSpacing: -0.5,
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
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  cachedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
    marginRight: 6,
  },
  cachedText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardAlt: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    color: "#6b7280",
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardWrapper: {
    flex: 1,
    width: '100%',
  },
});