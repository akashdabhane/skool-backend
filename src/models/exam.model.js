import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
	classroom: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Classroom",
		required: true,
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	title: {
		type: String,
		required: true,
		minlength: 2,
		maxlength: 150,
	},
	description: {
		type: String,
		default: "",
	},
	durationMinutes: {
		type: Number,
		required: true,
		min: 1,
	},
	scheduleStart: {
		type: Date,
		required: true,
	},
	scheduleEnd: {
		type: Date,
		required: true,
	},
	totalMarks: {
		type: Number,
		default: 0,
	},
	status: {
		type: String,
		enum: ["draft", "published", "completed"],
		default: "draft",
	},
	proctoringEnabled: {
		type: Boolean,
		default: false,
	},
	autoTerminate: {
		type: Boolean,
		default: false,
	},
	maxViolations: {
		type: Number,
		default: 5,
		min: 1,
	},
	maxTabSwitches: {
		type: Number,
		default: 3,
		min: 0,
	},
	maxCopyPaste: {
		type: Number,
		default: 2,
		min: 0,
	},
	riskScoreThreshold: {
		type: Number,
		default: 10,
		min: 1,
	}
}, { timestamps: true });

const examQuestionSchema = new mongoose.Schema({
	exam: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Exam",
		required: true,
	},
	question: {
		type: String,
		required: true,
	},
	questionType: {
		type: String,
		enum: ["mcq", "subjective"],
		required: true,
	},
	options: {
		type: [String],
		default: [],
	},
	correctAnswer: {
		type: String,
		default: "",
	},
	marks: {
		type: Number,
		default: 1,
		min: 0,
	}
}, { timestamps: true });

const examAttemptSchema = new mongoose.Schema({
	exam: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Exam",
		required: true,
	},
	student: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	answers: {
		type: mongoose.Schema.Types.Mixed,
		default: {},
	},
	startedAt: {
		type: Date,
		required: true,
	},
	endsAt: {
		type: Date,
		required: true,
	},
	submittedAt: {
		type: Date,
		default: null,
	},
	terminatedAt: {
		type: Date,
		default: null,
	},
	terminationReason: {
		type: String,
		default: "",
	},
	mcqScore: {
		type: Number,
		default: 0,
	},
	subjectiveScore: {
		type: Number,
		default: 0,
	},
	subjectiveScores: {
		type: mongoose.Schema.Types.Mixed,
		default: {},
	},
	score: {
		type: Number,
		default: null,
	},
	gradedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		default: null,
	},
	gradedAt: {
		type: Date,
		default: null,
	},
	status: {
		type: String,
		enum: ["in-progress", "submitted"],
		default: "in-progress",
	}
}, { timestamps: true });

export const Exam = mongoose.model("Exam", examSchema);
export const ExamQuestion = mongoose.model("ExamQuestion", examQuestionSchema);
export const ExamAttempt = mongoose.model("ExamAttempt", examAttemptSchema);
