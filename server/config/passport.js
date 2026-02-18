const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/user");

// Local Strategy (email + password)
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: "Không tìm thấy người dùng" });
        }

        if (user.authProvider !== "local") {
          return done(null, false, {
            message: `Email đã đăng ký bằng ${user.authProvider}`,
          });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: "Sai mật khẩu" });
        }

        if (user.status === "Pending") {
          return done(null, false, {
            message: "Tài khoản đang Pending, cần xác thực OTP",
            requireOtp: true,
          });
        }

        if (user.status !== "Active") {
          return done(null, false, {
            message: "Tài khoản chưa được kích hoạt",
          });
        }

        // Đăng nhập thành công
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            fullName: profile.displayName,
            avatarUrl: profile.photos[0].value,
            status: "Active",
            authProvider: "google",
          });
        } else if (user.authProvider !== "google") {
          return done(null, false, {
            message: "Email đã đăng ký bằng phương thức khác",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);
// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["id", "displayName", "emails", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
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

module.exports = passport;
