import React, { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Define colors
  const theme = {
    isDarkMode,
    colors: isDarkMode ? {
      // Dark Mode Colors
      background: '#111827',
      card: '#1F2937',
      text: '#F9FAFB',
      primaryText: '#F9FAFB',
      secondaryText: '#9CA3AF',
      border: '#374151',
      primary: '#0047BB',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      notification: '#EF4444',
      statusBar: 'light-content',
      iconDefault: '#E5E7EB',
      working: '#EEF2FF',
      completed: '#ECFDF5',
      off: '#F3F4F6',
      workingText: '#4F46E5',
      completedText: '#059669',
      offText: '#6B7280',
      buttonBackground: 'rgba(255, 255, 255, 0.1)',
      shadow: '#000000',
    } : {
      // Light Mode Colors
      background: '#F3F4F6',
      card: '#FFFFFF',
      text: '#0F172A',
      primaryText: '#0F172A',
      secondaryText: '#64748B',
      border: '#E2E8F0',
      primary: '#0047BB',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      notification: '#EF4444',
      statusBar: 'dark-content',
      iconDefault: '#1E293B',
      buttonBackground: '#F1F5F9',
      shadow: '#64748B',
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
