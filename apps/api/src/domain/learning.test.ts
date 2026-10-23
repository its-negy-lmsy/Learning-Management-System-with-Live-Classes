import { describe, expect, it } from "vitest";
import { courseCompletion, gradeQuiz, splitCommission, type Quiz } from "./learning.js";

describe("learning domain rules", () => {
  it("grades answers on the server and uses the configured pass mark", () => {
    const result = gradeQuiz([{ id: "q1", prompt: "Pick one", options: ["A", "B"], correctOptionIndex: 1 }], { q1: 1 }, 70);
    expect(result).toMatchObject({ correctCount: 1, scorePercent: 100, passed: true });
  });
  it("requires every lesson and the required quiz before completion", () => {
    const course = { sections: [{ lessons: [{ id: "a" }, { id: "b" }] }] };
    const quiz: Quiz = { id: "q", courseId: "c", title: "Quiz", passPercent: 70, required: true, questions: [] };
    const progress = [{ lessonId: "a", completedAt: "now" }, { lessonId: "b", completedAt: "now" }];
    expect(courseCompletion(course, quiz, progress, [{ passed: false }]).completed).toBe(false);
    expect(courseCompletion(course, quiz, progress, [{ passed: true }]).completed).toBe(true);
  });
  it("splits integer minor-unit sales without losing cents", () => {
    expect(splitCommission(2900)).toEqual({ grossMinor: 2900, platformMinor: 580, instructorNetMinor: 2320 });
  });
});
