const User = require("../../models/user");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { client_id, client_secret, redirect_uri } = require("../../config/google");

exports.loginWithGoogle = (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=email profile`;
  res.redirect(url);
};

exports.googleCallback = async (req, res) => {
  const { code } = req.query;
  const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
    code,
    client_id,
    client_secret,
    redirect_uri,
    grant_type: "authorization_code",
  });
  const { access_token } = tokenRes.data;
  const userRes = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    },
  );
  const { email, name, picture } = userRes.data;
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      email,
      fullName: name,
      avatarUrl: picture,
      status: "Active",
      authProvider: "google",
    });
    await user.save();
    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.redirect(`http://localhost:3000/?token=${token}`);
  } else if (user.authProvider !== "google") {
    return res.redirect(
      `http://localhost:3000/login?error=Email%20đã%20được%20đăng%20ký%20bằng%20phương%20thức%20khác`,
    );
  } else if (user.authProvider == "google") {
    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.redirect(`http://localhost:3000/?token=${token}`);
  }
};
