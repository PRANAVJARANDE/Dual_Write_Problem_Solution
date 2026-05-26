import { io } from 'socket.io-client';

const orderServiceURL1 = import.meta.env.VITE_ORDER_SERVICE_1_URL;
const orderServiceURL2 = import.meta.env.VITE_ORDER_SERVICE_2_URL;
const consumerServiceURL = import.meta.env.VITE_CONSUMER_SERVICE_URL;

export const orderSocket1 = io(orderServiceURL1, { autoConnect: false });
export const orderSocket2 = io(orderServiceURL2, { autoConnect: false });
export const consumerSocket = io(consumerServiceURL, { autoConnect: false });