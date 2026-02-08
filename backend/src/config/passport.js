const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

const configurePassport = (passport) => {
  // JWT Strategy
  const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(jwtOpts, async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select('-password');
        if (user) {
          if (user.status === 'banned') {
            return done(null, false, { message: 'Account has been banned' });
          }
          return done(null, user);
        }
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
              user = await User.findOne({ email: profile.emails[0].value });
              if (user) {
                user.googleId = profile.id;
                if (!user.avatar) {
                  user.avatar = profile.photos[0]?.value;
                }
                await user.save();
              } else {
                user = await User.create({
                  googleId: profile.id,
                  email: profile.emails[0].value,
                  username: profile.emails[0].value.split('@')[0] + '_' + Date.now().toString(36),
                  displayName: profile.displayName,
                  avatar: profile.photos[0]?.value,
                  isVerified: true,
                });
              }
            }

            return done(null, user);
          } catch (err) {
            return done(err, false);
          }
        }
      )
    );
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: process.env.GITHUB_CALLBACK_URL,
          scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ githubId: profile.id });

            if (!user) {
              const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
              user = await User.findOne({ email });

              if (user) {
                user.githubId = profile.id;
                if (!user.avatar) {
                  user.avatar = profile.photos[0]?.value;
                }
                await user.save();
              } else {
                user = await User.create({
                  githubId: profile.id,
                  email,
                  username: profile.username + '_' + Date.now().toString(36),
                  displayName: profile.displayName || profile.username,
                  avatar: profile.photos[0]?.value,
                  isVerified: true,
                });
              }
            }

            return done(null, user);
          } catch (err) {
            return done(err, false);
          }
        }
      )
    );
  }
};

module.exports = configurePassport;
