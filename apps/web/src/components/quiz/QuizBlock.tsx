import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, CircleHelp } from "lucide-react";
import { useQuizQuery, useSubmitQuizMutation } from "../../api";

export function QuizBlock({ courseId }: { courseId: string }) {
  const { data, isError } = useQuizQuery(courseId);
  const [submit, state] = useSubmitQuizMutation();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correctCount: number;
    total: number;
  }>();

  if (isError || !data?.quiz) return null;

  const send = async () => {
    try {
      const response = await submit({ courseId, answers }).unwrap();
      setResult(response.attempt);
    } catch {
      /* mutation error surfaced via state.error */
    }
  };

  return (
    <div className="quiz-card">
      <div className="quiz-heading">
        <div className="quiz-badge">
          <CircleHelp size={17} />
        </div>
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> PAUSE & REFLECT
          </div>
          <h2>{data.quiz.title}</h2>
        </div>
        <span className="pass-mark">Pass mark {data.quiz.passPercent}%</span>
      </div>
      <div className="quiz-questions">
        {data.quiz.questions.map((question, index) => (
          <div className="quiz-question" key={question.id}>
            <h3>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {question.prompt}
            </h3>
            <div className="quiz-options">
              {question.options.map((option, optionIndex) => (
                <label
                  className={
                    answers[question.id] === optionIndex
                      ? "quiz-option selected"
                      : "quiz-option"
                  }
                  key={option}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === optionIndex}
                    onChange={() =>
                      setAnswers({ ...answers, [question.id]: optionIndex })
                    }
                  />
                  <span>{option}</span>
                  <i>
                    <Check size={12} />
                  </i>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="quiz-footer">
        <span>
          {result ? (
            <span className={result.passed ? "quiz-result passed" : "quiz-result"}>
              <CheckCircle2 size={15} /> {result.passed ? "You passed" : "Keep practicing"} ·{" "}
              {result.scorePercent}% ({result.correctCount}/{result.total})
            </span>
          ) : (
            "Try it when you’re ready."
          )}
        </span>
        <button
          className="button button-dark"
          onClick={send}
          disabled={
            Object.keys(answers).length < data.quiz.questions.length || state.isLoading
          }
        >
          {state.isLoading
            ? "Checking…"
            : result
            ? "Try again"
            : "Check my answers"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
