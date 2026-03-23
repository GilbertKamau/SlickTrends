import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/theme';
import { ShoppingCart, Heart } from 'lucide-react-native';

interface ProductCardProps {
    product: any;
    onPress?: () => void;
}

export const ProductCard = ({ product, onPress }: ProductCardProps) => {
    const imageUrl = product.images?.[0] || 'https://via.placeholder.com/150';

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.category}>{product.category}</Text>
                <View style={styles.footer}>
                    <Text style={styles.price}>${product.price.toLocaleString()}</Text>
                    <TouchableOpacity style={styles.addButton}>
                        <ShoppingCart size={18} color={Colors.dark.background} />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity style={styles.wishlistButton}>
                <Heart size={20} color={Colors.dark.accent} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.dark.background,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        marginBottom: 16,
        width: '48%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 150,
        backgroundColor: '#1a0533',
    },
    content: {
        padding: 12,
    },
    name: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    category: {
        color: '#b8a9d0',
        fontSize: 11,
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        color: Colors.dark.accent,
        fontSize: 16,
        fontWeight: '800',
    },
    addButton: {
        backgroundColor: Colors.dark.accent,
        padding: 6,
        borderRadius: 8,
    },
    wishlistButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 6,
        borderRadius: 20,
    }
});
