import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import User from '../models/User';

export const configurePassport = () => {
    // Google Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
                callbackURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/callback/google`,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let user = await User.findOne({ googleId: profile.id });

                    if (!user) {
                        // Check if email already exists
                        user = await User.findOne({ email: profile.emails?.[0].value });

                        if (user) {
                            // Link Google ID to existing account
                            user.googleId = profile.id;
                            if (!user.avatar) user.avatar = profile.photos?.[0].value;
                            await user.save();
                        } else {
                            // Create new user
                            user = await User.create({
                                name: profile.displayName,
                                email: profile.emails?.[0].value,
                                googleId: profile.id,
                                avatar: profile.photos?.[0].value,
                                role: 'customer',
                                isVerified: true, // Google emails are already verified
                            });
                        }
                    }
                    return done(null, user);
                } catch (err) {
                    return done(err as Error, undefined);
                }
            }
        )
    );

    // Microsoft Strategy
    passport.use(
        new MicrosoftStrategy(
            {
                clientID: process.env.MICROSOFT_CLIENT_ID || 'placeholder',
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'placeholder',
                callbackURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/microsoft/callback`,
                scope: ['user.read'],
            },
            async (accessToken: string, refreshToken: string, profile: any, done: any) => {
                try {
                    let user = await User.findOne({ microsoftId: profile.id });

                    if (!user) {
                        const email = profile.emails?.[0]?.value || profile.userPrincipalName;
                        user = await User.findOne({ email });

                        if (user) {
                            user.microsoftId = profile.id;
                            await user.save();
                        } else {
                            user = await User.create({
                                name: profile.displayName,
                                email: email,
                                microsoftId: profile.id,
                                role: 'customer',
                                isVerified: true,
                            });
                        }
                    }
                    return done(null, user);
                } catch (err) {
                    return done(err as Error, undefined);
                }
            }
        )
    );
};
