import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotion extends Document {
    title: string;
    subtitle: string;
    imageUrl: string;
    link: string;
    isActive: boolean;
    type: 'holiday' | 'seasonal' | 'flash';
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
    {
        title: { type: String, required: true },
        subtitle: { type: String },
        imageUrl: { type: String, required: true },
        link: { type: String, default: '#' },
        isActive: { type: Boolean, default: true },
        type: { type: String, enum: ['holiday', 'seasonal', 'flash'], default: 'holiday' },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);
