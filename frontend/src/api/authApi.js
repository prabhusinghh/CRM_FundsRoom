import axiosClient from './axiosClient';

export const login = (email, password) =>
  axiosClient.post('/auth/login', { email, password }).then((res) => res.data.data);

export const fetchMe = () => axiosClient.get('/auth/me').then((res) => res.data.data);
