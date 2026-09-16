import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScaledSheet } from 'react-native-size-matters';

const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction} style={styles.sectionActionBtn} activeOpacity={0.7}>
        <Text style={styles.sectionAction}>{action}</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#2563EB" />
      </TouchableOpacity>
    )}
  </View>
);

const styles = ScaledSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6@vs',
    marginBottom: '12@vs',
  },
  sectionTitle: {
    fontSize: '15@ms',
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionAction: {
    fontSize: '12@ms',
    color: '#2563EB',
    fontWeight: '700',
  },
});

export default SectionHeader;