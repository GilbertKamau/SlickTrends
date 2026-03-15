import mongoose, { Document, Schema } from 'mongoose';

export type ProductCategory =
    | 'robes'
    | 'onesies'
    | 'pajamas'
    | 'night-dresses'
    | 'baby-onesies'
    | 'pre-teen-robes'
    | 'baby-robes';

export type ProductCondition = 'excellent' | 'good' | 'fair';
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '0-3M' | '3-6M' | '6-12M' | '12-18M' | '2T' | '3T' | '4T' | '5T' | '6-8Y' | '9-12Y';

export interface IProduct extends Document {
    name: string;
    description: string;
    category: ProductCategory;
    size: ProductSize;
    condition: ProductCondition;
    price: number;
    originalPrice?: number;
    stock: number;
    images: string[];
    brand?: string;
    color?: string;
    material?: string;
    isFeatured: boolean;
    isActive: boolean;
    addedBy: mongoose.Types.ObjectId;
    tags: string[];
    isSold: boolean;
    soldAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: ['robes', 'onesies', 'pajamas', 'night-dresses', 'baby-onesies', 'pre-teen-robes', 'baby-robes'],
            required: true,
        },
        size: {
            type: String,
            enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '0-3M', '3-6M', '6-12M', '12-18M', '2T', '3T', '4T', '5T', '6-8Y', '9-12Y'],
            required: true,
        },
        condition: { type: String, enum: ['excellent', 'good', 'fair'], required: true },
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number },
        stock: { type: Number, required: true, default: 0, min: 0 },
        images: [{ type: String }],
        brand: { type: String },
        color: { type: String },
        material: { type: String },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        tags: [{ type: String }],
        isSold: { type: Boolean, default: false },
        soldAt: { type: Date },
    },
    { timestamps: true }
);

ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);
