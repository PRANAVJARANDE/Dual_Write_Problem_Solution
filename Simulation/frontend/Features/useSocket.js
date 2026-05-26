import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { orderSocket1, orderSocket2, consumerSocket } from './socket.js';
import { setOrder1Connected, setOrder2Connected, setConsumerConnected } from '../Features/storeslice';

export const useSockets = () => {
  const dispatch = useDispatch();
  
  const statuses = useSelector((state) => state.socket);
  useEffect(() => {
    orderSocket1.connect();
    orderSocket2.connect();
    consumerSocket.connect();

    orderSocket1.on('connect', () => {
      console.log('🟢 Order Socket 1 connected! ID:', orderSocket1.id);
      dispatch(setOrder1Connected(true));
    });

    orderSocket1.on('disconnect', () => dispatch(setOrder1Connected(false)));

    orderSocket2.on('connect', () => {
      console.log('🟢 Order Socket 2 connected! ID:', orderSocket2.id);
      dispatch(setOrder2Connected(true));
    });
    orderSocket2.on('disconnect', () => dispatch(setOrder2Connected(false)));

    consumerSocket.on('connect', () => {
      console.log('🟢 Consumer Socket connected! ID:', consumerSocket.id);
      dispatch(setConsumerConnected(true));
    });
    consumerSocket.on('disconnect', () => dispatch(setConsumerConnected(false)));

    return () => {
      orderSocket1.disconnect();
      orderSocket2.disconnect();
      consumerSocket.disconnect();
      
      orderSocket1.off('connect').off('disconnect');
      orderSocket2.off('connect').off('disconnect');
      consumerSocket.off('connect').off('disconnect');
    };
  }, [dispatch]);

  return {orderSocket1,orderSocket2,consumerSocket,statuses};
};