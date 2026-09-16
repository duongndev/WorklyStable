import React, { memo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

import SplashScreen from '../screens/splash/SplashScreen';
import AuthNavigator from './AuthNavigator';
import EmployeeNavigator from './EmployeeNavigator';
import AdminNavigator from './AdminNavigator';

import { navigationRef } from './NavigationService';

const AppNavigator = memo(() => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Employee" component={EmployeeNavigator} />
        <Stack.Screen name="Admin" component={AdminNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default AppNavigator;