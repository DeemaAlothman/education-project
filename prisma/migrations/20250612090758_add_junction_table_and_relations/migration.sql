-- CreateTable
CREATE TABLE "Departments" (
    "department_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "Users" (
    "user_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "academic_year" INTEGER,
    "department_id" INTEGER NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Subjects" (
    "subject_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "department_id" INTEGER NOT NULL,
    "academic_year" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Subjects_pkey" PRIMARY KEY ("subject_id")
);

-- CreateTable
CREATE TABLE "UserSubjects" (
    "user_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,

    CONSTRAINT "UserSubjects_pkey" PRIMARY KEY ("user_id","subject_id")
);

-- CreateTable
CREATE TABLE "Questions" (
    "question_id" SERIAL NOT NULL,
    "question_text" TEXT NOT NULL,
    "option1" TEXT NOT NULL,
    "option2" TEXT NOT NULL,
    "option3" TEXT NOT NULL,
    "option4" TEXT NOT NULL,
    "correct_option" INTEGER NOT NULL DEFAULT 1,
    "subject_id" INTEGER NOT NULL,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "Exams" (
    "exam_id" SERIAL NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "exam_type" TEXT NOT NULL DEFAULT 'theoretical',

    CONSTRAINT "Exams_pkey" PRIMARY KEY ("exam_id")
);

-- CreateTable
CREATE TABLE "Exam_Answers" (
    "answer_id" SERIAL NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "selected_option" TEXT NOT NULL,

    CONSTRAINT "Exam_Answers_pkey" PRIMARY KEY ("answer_id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "message_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "message_text" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "Results" (
    "result_id" SERIAL NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "promotion_status" TEXT NOT NULL DEFAULT 'not_promoted',

    CONSTRAINT "Results_pkey" PRIMARY KEY ("result_id")
);

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubjects" ADD CONSTRAINT "UserSubjects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubjects" ADD CONSTRAINT "UserSubjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subjects"("subject_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subjects"("subject_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subjects"("subject_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Answers" ADD CONSTRAINT "Exam_Answers_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exams"("exam_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Answers" ADD CONSTRAINT "Exam_Answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Results" ADD CONSTRAINT "Results_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exams"("exam_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Results" ADD CONSTRAINT "Results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
