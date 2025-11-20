import * as trackerModel from '../models/trackerModel.js';

export const createNewFoodLog = async (req, res, next) => {
  try {
    const userId = req.params.user_id || 1;
    const { food } = req.body;

    for (let i = 0; i < food.length; i++) {
      await trackerModel.insertNewFoodLog(userId, food[0].variation, food[0].calories);
    }

    

  } catch (error) {
    console.error("Error in speechToText controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process audio",
      error: error.message,
    });
  }
}