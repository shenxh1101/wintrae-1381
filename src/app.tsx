import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { AppProvider } from './store/AppContext';
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] initialized');
  }, []);

  useDidShow(() => {
    console.log('[App] didShow');
  });

  useDidHide(() => {
    console.log('[App] didHide');
  });

  return (
    <AppProvider>
      {props.children}
    </AppProvider>
  );
}

export default App;
