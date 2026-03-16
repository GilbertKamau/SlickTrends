import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const ProductSchema = new mongoose.Schema({
    name: String,
    addedBy: mongoose.Types.ObjectId,
    isActive: Boolean
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ MongoDB connected');
        
        const products = await Product.find({});
        console.log(`Total products in DB: ${products.length}`);
        
        const owners = await Product.aggregate([
            { $group: { _id: "$addedBy", count: { $sum: 1 } } }
        ]);
        console.log('Product Ownership (Owner ID : Count):');
        owners.forEach(o => console.log(`${o._id} : ${o.count}`));
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ MongoDB check failed:', err);
    }
}

checkProducts();
