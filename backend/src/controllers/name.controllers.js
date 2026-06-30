export const showName = (req, res) => {
  const { name } = req.body;

  res.status(200).json({
    success: true,
    message: `Hello ${name}, your backend is working`,
  });
};
