import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryManager } from '@/components/CategoryManager';

export default function CategoriesScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCategoriesChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <CategoryManager 
        key={refreshKey}
        onCategoriesChange={handleCategoriesChange} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
});