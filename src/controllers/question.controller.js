import { Question } from "../models/question.model.js";
import { Classroom } from "../models/classroom.model.js";
import { MediaReference } from "../models/mediaReference.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateMongodbId } from "../utils/validateMongodbId.js";

const createQuestion = asyncHandler(async (req, res) => {
    const { classroom, question, questionType, dueDate } = req.body;
    const { link } = req.body;         // for media reference
    const createdBy = req.user._id;
    // console.log(typeof(dueDate));    // validation is not working giving an error message
    // console.log(typeof(classroom), typeof(question), typeof(questionType), typeof(dueDate))
    // if ([createdBy, classroom, question, questionType, dueDate].some((field) => 
    //     field?.trim() === "" || field?.trim() === undefined
    // )) {
    //     throw new ApiError(400, "All fields are required");
    // }
    validateMongodbId(classroom);

    const classroomExists = await Classroom.findById(classroom);
    if (!classroomExists) throw new ApiError(404, "Classroom not found");

    const mediaReference = await MediaReference.create({
        link
    })

    const createQuestion = await Question.create({
        createdBy,
        classroom,
        question,
        instruction: req?.body?.instruction,
        questionType,
        dueDate,
        mediaReference: mediaReference._id
    })

    return res
        .status(201)
        .json(
            new ApiResponse(201, createQuestion, "Question created successfully")
        );
})

const updateQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;  // question id
    // const { classroom, question, instruction, questionType, dueDate } = req.body;
    const { link } = req.body; //for media references

    validateMongodbId(id);
    const question = await Question.findById(id);
    if (!question) throw new ApiError(404, "Question not found");

    if (!question.createdBy.equals(req.user._id)) {
        throw new ApiError(401, "Unauthorized to update this question");
    }

    const updatedQuestionInfo = await Question.findByIdAndUpdate(id,
        {
            $set: {
                classroom: req?.body?.classroom,
                question: req?.body?.question,
                instruction: req?.body?.instruction,
                questionType: req?.body?.questionType,
                dueDate: req?.body?.dueDate && new Date(req?.body?.dueDate),
            }
        },
        { new: true, runValidators: true }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedQuestionInfo, "Question updated successfully")
        );
})

const deleteQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;  // question id
    validateMongodbId(id);

    const question = await Question.findById(id);
    if (!question) throw new ApiError(404, "Question not found");

    if (!question.createdBy.equals(req.user._id)) {
        throw new ApiError(401, "Unauthorized to delete this question");
    }

    await Question.findByIdAndDelete(id);

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Question deleted successfully")
        );
})

const getQuestionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    const question = await Question.findById(id);
    if (!question) throw new ApiError(404, "Question not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, question, "Question fetched successfully")
        );
})

const getAllQuestionsOfClassroom = asyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    validateMongodbId(classroomId);

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) throw new ApiError(404, "Classroom not found");

    const questions = await Question.find({ classroom: classroomId });
    if (!questions) throw new ApiError(404, "No questions found for this classroom");

    return res
        .status(200)
        .json(
            new ApiResponse(200, questions, "Questions fetched successfully")
        );
})

export {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionById,
    getAllQuestionsOfClassroom,
}

