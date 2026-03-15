import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Promotion from './src/models/Promotion';

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        
        // Remove existing test promos if any
        await Promotion.deleteMany({ title: 'Back to School Special' });

        await Promotion.create({
            title: 'Back to School Special',
            subtitle: 'Get 25% off all kids onesies and pre-teen robes. Limited time offer!',
            imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=2075&auto=format&fit=crop', // Fallback high qual image
            link: '/products?category=pre-teen-robes',
            type: 'seasonal',
            isActive: true
        });

        console.log('✅ Simulation promotion seeded!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
