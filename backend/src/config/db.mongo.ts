import mongoose from 'mongoose';

const connectMongoDB = async (): Promise<void> => {
    try {
        const uri = process.env.MONGODB_URI as string;
        await mongoose.connect(uri);
        console.log('✅ MongoDB Atlas connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectMongoDB;
