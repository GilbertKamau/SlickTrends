import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'admin' | 'superadmin';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    address?: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
    };
    avatar?: string;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    otp?: string;
    otpExpire?: Date;
    isVerified: boolean;
    googleId?: string;
    microsoftId?: string;
    isActive: boolean;
    paymentDetails?: {
        bankAccount?: string;
        mpesaNumber?: string;
        pochiNumber?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, minlength: 6 },
        role: { type: String, enum: ['customer', 'admin', 'superadmin'], default: 'customer' },
        phone: { type: String },
        address: {
            street: String,
            city: String,
            country: String,
            postalCode: String,
        },
        avatar: { type: String },
        resetPasswordToken: { type: String },
        resetPasswordExpire: { type: Date },
        otp: { type: String },
        otpExpire: { type: Date },
        isVerified: { type: Boolean, default: false },
        googleId: { type: String, unique: true, sparse: true },
        microsoftId: { type: String, unique: true, sparse: true },
        isActive: { type: Boolean, default: true },
        paymentDetails: {
            bankAccount: String,
            mpesaNumber: String,
            pochiNumber: String,
        },
    },
    { timestamps: true }
);

UserSchema.pre('save', async function (this: any) {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
