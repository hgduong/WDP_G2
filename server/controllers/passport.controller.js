const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/user");

exports.ConfigPassport = () => {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:9999/auth/facebook/callback",
        profileFields: ["id", "displayName", "emails", "photos"],
      },
      async (accessToken, refreshToken, profile, done) => {
        // const user = {
        //   facebookId: profile.id,
        //   fullName: profile.displayName,
        //   email: profile.emails?.[0]?.value || null,
        //   avatarUrl: profile.photos?.[0]?.value || null,
        // };
        const email = profile.emails?.[0]?.value || null;
        const name = profile.displayName;
        const picture = profile.photos?.[0]?.value || null;
        if (!email) {
          return done(new Error("Không thể lấy email từ Facebook"), null);
        }
        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            email,
            fullName: name,
            avatarUrl: picture,
            status: "Active",
            authProvider: "facebook",
          });
          await user.save();
        } else if (user.authProvider !== "facebook") {
          return done(
            new Error("Email đã được đăng ký bằng phương thức khác"),
            null,
          );
        }
        return done(null, user);
      },
    ),
  );
};
