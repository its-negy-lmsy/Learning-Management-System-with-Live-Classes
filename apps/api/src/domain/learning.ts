export interface QuizQuestion { id: string; prompt: string; options: string[]; correctOptionIndex: number }
export interface Quiz { id: string; courseId: string; title: string; passPercent: number; required: boolean; questions: QuizQuestion[] }

export function gradeQuiz(questions: QuizQuestion[], answers: Record<string, number>, passPercent: number) {
  const scored = questions.map((question) => ({
    questionId: question.id,
    selectedOptionIndex: answers[question.id] ?? -1,
    correct: answers[question.id] === question.correctOptionIndex,
    correctOptionIndex: question.correctOptionIndex,
  }));
  const correctCount = scored.filter((answer) => answer.correct).length;
  const scorePercent = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  return { correctCount, total: questions.length, scorePercent, passed: scorePercent >= passPercent, answers: scored };
}

export function courseCompletion(course: { sections: Array<{ lessons: Array<{ id: string }> }> }, quiz: Quiz | undefined, progress: Array<{ lessonId: string; completedAt?: string }>, attempts: Array<{ passed: boolean }>) {
  const requiredLessonIds = course.sections.flatMap((section) => section.lessons.map((lesson) => lesson.id));
  const completeLessonIds = new Set(progress.filter((item) => item.completedAt).map((item) => item.lessonId));
  const lessonsComplete = requiredLessonIds.length > 0 && requiredLessonIds.every((lessonId) => completeLessonIds.has(lessonId));
  const quizComplete = !quiz?.required || attempts.some((attempt) => attempt.passed);
  return { lessonsComplete, quizComplete, completed: lessonsComplete && quizComplete, completedLessons: completeLessonIds.size, totalLessons: requiredLessonIds.length };
}

export function splitCommission(grossMinor: number, commissionPercent = 20) {
  const platformMinor = Math.round(grossMinor * commissionPercent / 100);
  return { grossMinor, platformMinor, instructorNetMinor: grossMinor - platformMinor };
}
