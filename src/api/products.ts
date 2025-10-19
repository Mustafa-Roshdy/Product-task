import client from "./client";

export async function getAllProducts() {
  const { data } = await client.get("/products");
  return data.products;
}

export async function getCategories() {
  const { data } = await client.get("/products/categories");
  return data;
}

export async function getProductsByCategory(category: string) {
  const { data } = await client.get(`/products/category/${category}`);
  return data.products;
}

export async function deleteProduct(id: number) {
  const { data } = await client.delete(`/products/${id}`);
  return data;
}
