import QuizResult from "../models/quizResult.js";

// Add result for a quiz session
export const saveQuizResult = async (req, res) => {
  try {
    const {
      quizSessionId,
      receiverId,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      answers,
    } = req.body;

    const userId = req.user._id; // get userId from token payload

    const existing = await QuizResult.findOne({ quizSessionId, userId });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Result already submitted by this user." });
    }

    const result = await QuizResult.create({
      quizSessionId,
      userId,
      receiverId,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      answers,
    });

    res.status(201).json({ status: true, result });
  } catch (err) {
    console.error("Error saving quiz result:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get Results by Quiz Session ID
export const getQuizResultsBySession = async (req, res) => {
  try {
    const { quizSessionId } = req.params;

    const results = await QuizResult.find({ quizSessionId })
      .populate("userId", "name")
      .populate("receiverId", "name");

    res.status(200).json({ status: true, results });
  } catch (err) {
    console.error("Error fetching quiz results:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
