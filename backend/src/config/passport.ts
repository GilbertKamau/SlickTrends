import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { query } from './db.postgres';
import { v4 as uuidv4 } from 'uuid';

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
                    let userRes = await query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
                    let user = userRes.rows[0];

                    if (!user) {
                        const email = profile.emails?.[0].value;
                        userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
                        user = userRes.rows[0];

                        if (user) {
                            // Link Google ID to existing account
                            await query(
                                'UPDATE users SET google_id = $1, avatar = COALESCE(avatar, $2), updated_at = NOW() WHERE id = $3',
                                [profile.id, profile.photos?.[0].value || null, user.id]
                            );
                        } else {
                            // Create new user
                            const id = uuidv4();
                            await query(
                                `INSERT INTO users (id, name, email, google_id, avatar, role, is_verified) 
                                 VALUES ($1, $2, $3, $4, $5, 'customer', true)`,
                                [id, profile.displayName, email, profile.id, profile.photos?.[0].value || null]
                            );
                            userRes = await query('SELECT * FROM users WHERE id = $1', [id]);
                            user = userRes.rows[0];
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
                    let userRes = await query('SELECT * FROM users WHERE microsoft_id = $1', [profile.id]);
                    let user = userRes.rows[0];

                    if (!user) {
                        const email = profile.emails?.[0]?.value || profile.userPrincipalName;
                        userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
                        user = userRes.rows[0];

                        if (user) {
                            await query('UPDATE users SET microsoft_id = $1, updated_at = NOW() WHERE id = $2', [profile.id, user.id]);
                        } else {
                            const id = uuidv4();
                            await query(
                                `INSERT INTO users (id, name, email, microsoft_id, role, is_verified) 
                                 VALUES ($1, $2, $3, $4, 'customer', true)`,
                                [id, profile.displayName, email, profile.id]
                            );
                            userRes = await query('SELECT * FROM users WHERE id = $1', [id]);
                            user = userRes.rows[0];
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
