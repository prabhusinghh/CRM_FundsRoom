import axiosClient from './axiosClient';

export const listChallans = (params) =>
  axiosClient.get('/challans', { params }).then((res) => res.data);

export const getChallan = (id) => axiosClient.get(`/challans/${id}`).then((res) => res.data.data);

export const createChallan = (payload) =>
  axiosClient.post('/challans', payload).then((res) => res.data.data);

export const updateChallan = (id, payload) =>
  axiosClient.put(`/challans/${id}`, payload).then((res) => res.data.data);

export const confirmChallan = (id) =>
  axiosClient.post(`/challans/${id}/confirm`).then((res) => res.data.data);

export const cancelChallan = (id) =>
  axiosClient.post(`/challans/${id}/cancel`).then((res) => res.data.data);
