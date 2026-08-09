import axiosClient from './axiosClient';

export const listCustomers = (params) =>
  axiosClient.get('/customers', { params }).then((res) => res.data);

export const getCustomer = (id) =>
  axiosClient.get(`/customers/${id}`).then((res) => res.data.data);

export const createCustomer = (payload) =>
  axiosClient.post('/customers', payload).then((res) => res.data.data);

export const updateCustomer = (id, payload) =>
  axiosClient.put(`/customers/${id}`, payload).then((res) => res.data.data);

export const addFollowup = (id, payload) =>
  axiosClient.post(`/customers/${id}/followups`, payload).then((res) => res.data.data);
