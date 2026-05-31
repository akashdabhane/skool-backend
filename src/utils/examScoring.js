import { ExamQuestion } from "../models/exam.model.js";

const calculateMcqScore = async (examId, answers) => {
    const questions = await ExamQuestion.find({ exam: examId, questionType: "mcq" });
    const answerMap = answers || {};
    let score = 0;

    questions.forEach((question) => {
        const key = String(question._id);
        if (answerMap[key] === question.correctAnswer) {
            score += question.marks;
        }
    });

    return score;
};

export { calculateMcqScore };
