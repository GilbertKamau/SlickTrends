import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { X } from 'lucide-react-native';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Information</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X color={Colors.dark.text} size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.text}>
          Welcome to Slick Trends! We provide premium second-hand robes and onesies.
        </Text>
        
        <Link href="/" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Go to Shop</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    color: Colors.dark.accent,
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.dark.text,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  button: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  buttonText: {
    color: Colors.dark.background,
    fontWeight: '700',
    fontSize: 16,
  }
});
