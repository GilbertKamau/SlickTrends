import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon } from 'lucide-react-native';
import Logo from '@/components/Logo';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Logo size={40} />
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon color="#b8a9d0" size={20} />
          <TextInput 
            placeholder="Search robes, onesies..." 
            placeholderTextColor="#5a4b7a"
            style={styles.input}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Popular Categories</Text>
        <View style={styles.categories}>
          {['Robes', 'Onesies', 'Pajamas', 'Night Dresses', 'Baby Wear'].map((cat) => (
            <View key={cat} style={styles.categoryItem}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '800',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    marginLeft: 10,
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: Colors.dark.accent,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  categoryText: {
    color: '#f5f0ff',
    fontSize: 14,
    fontWeight: '500',
  }
});
