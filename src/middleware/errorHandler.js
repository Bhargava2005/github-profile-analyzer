const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`);

  if (err.code === "ECONNREFUSED" || err.code === "PROTOCOL_CONNECTION_LOST") {
    return res.status(503).json({
      success: false,
      message: "Database connection failed. Please try again later.",
    });
  }

  if (err.response?.status) {
    return res.status(err.response.status).json({
      success: false,
      message: err.response.data?.message || "GitHub API error",
    });
  }

  return res.status(500).json({
    success: false,
    message: "An unexpected internal server error occurred",
  });
};

module.exports = errorHandler;
