import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getAllProducts, deleteProduct } from "../api/products";
import ProductCard from "../components/ProductCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { storage, STORAGE_KEYS } from "../utils/mmkvPersister";
import Snackbar from '../components/Snackbar';
import { useState, useEffect } from 'react';

export default function AllProductsScreen() {
  const { isSuperAdmin } = useSelector((state: any) => state.auth);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const queryClient = useQueryClient();
  const [usingCache, setUsingCache] = useState(false);

  let initialProducts: any[] | undefined = undefined;
  try {
    const cached = storage.getString(STORAGE_KEYS.REACT_QUERY_CACHE);
    if (cached) {
      const parsed = JSON.parse(cached);
      initialProducts = parsed.products || undefined;
    }
  } catch (err) {

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
      // get the most up-to-date list: prefer react-query cache, then storage, then current data
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

      // Attempt server delete in background (best-effort)
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
    // if real data arrives, clear cached indicator
    if (!isFetching && data && initialProducts && data !== initialProducts) {
      setUsingCache(false);
    }
  }, [data, isFetching]);
  

  return (
    <>
    <SafeAreaView style={styles.container}>


      <Text style={styles.headerText}>All Products</Text>
  {usingCache && <Text style={styles.cachedBadge}>(showing cached data)</Text>}

      <FlatList
        data={data || []}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} 
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
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
          return <ProductCard {...cardProps} />;
        }}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isError
                ? "Failed to load products. Pull to retry."
                : "No products available."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
    <Snackbar visible={snackVisible} message={snackMessage} onDismiss={() => setSnackVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 10,
    marginLeft: 16,
    color: "#111827",
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
  },
  cachedBadge: {
    marginLeft: 16,
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 6,
  },
});
