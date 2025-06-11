const dayjs = require('dayjs');

exports.checkFutureDate = (req, res, next) => {
  const scheduleDate = dayjs(req.params.date || req.body.date).startOf('day');
  const today = dayjs().startOf('day');

  if (scheduleDate.isBefore(today)) {
    return res.status(403).json({
      success: false,
      message: "Ўтган сана учун иш режа киритиб бўлмайди"
    });
  }
  next();
};