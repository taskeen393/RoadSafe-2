import Report from '../models/Report1.js';


// Get all reports
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ _id: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Get reports error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
export const addReport = async (req, res) => {
  try {
    const report = await Report.create({
      title: req.body.title,
      description: req.body.description,
      user: req.user.name,
      userId: req.user._id,
      location: req.body.location,
      lat: req.body.lat,
      lon: req.body.lon,
      imageUris: req.body.imageUris || [],
      videoUris: req.body.videoUris || [],
    });

    res.status(201).json(report);
  } catch (error) {
    console.error("Add report error:", error.message);
    res.status(500).json({ message: error.message });
  }
};


