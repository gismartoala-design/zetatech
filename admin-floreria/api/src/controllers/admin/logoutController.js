exports.logout = (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie('session', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
  return res.status(200).json({
    status: "success",
    message: "Logout exitoso"
  });
};
