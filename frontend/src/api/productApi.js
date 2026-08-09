import axiosClient from './axiosClient';

export const listProducts = (params) =>
  axiosClient.get('/products', { params }).then((res) => res.data);

export const getProduct = (id) => axiosClient.get(`/products/${id}`).then((res) => res.data.data);

export const createProduct = (payload) =>
  axiosClient.post('/products', payload).then((res) => res.data.data);

export const updateProduct = (id, payload) =>
  axiosClient.put(`/products/${id}`, payload).then((res) => res.data.data);

export const getStockLog = (id, params) =>
  axiosClient.get(`/products/${id}/stock-log`, { params }).then((res) => res.data);

export const addStockMovement = (id, payload) =>
  axiosClient.post(`/products/${id}/stock-movement`, payload).then((res) => res.data.data);
