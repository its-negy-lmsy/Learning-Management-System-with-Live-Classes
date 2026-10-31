import { useEffect, useState, type FormEvent } from "react";
import { Check, ChevronDown, CircleHelp, Plus } from "lucide-react";
import { useInstructorQuizQuery, useSaveInstructorQuizMutation } from "../../api";
import { ErrorPanel, friendlyError } from "../common/UIComponents";

export function InstructorQuizBuilder({
  courseId,
  locked,
}: {
  courseId: string;
  locked: boolean;
}) {
  const { data } = useInstructorQuizQuery(courseId);
  const [save, state] = useSaveInstructorQuizMutation();
  const [title, setTitle] = useState("Quick knowledge check");
  const [passPercent, setPassPercent] = useState(70);
  const [questions, setQuestions] = useState<
    Array<{ prompt: string; optionsText: string; correctOptionIndex: number }>
  >([{ prompt: "", optionsText: "", correctOptionIndex: 0 }]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const quiz = data?.quiz;
    if (!quiz) return;
    setTitle(quiz.title);
    setPassPercent(quiz.passPercent);
    setQuestions(
      quiz.questions.map((question) => ({
        prompt: question.prompt,
        optionsText: question.options.join("\n"),
        correctOptionIndex: question.correctOptionIndex,
      }))
    );
  }, [data?.quiz]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const mapped = questions.map((question) => ({
      prompt: question.prompt,
      options: question.optionsText
        .split("\n")
        .map((option) => option.trim())
        .filter(Boolean),
      correctOptionIndex: question.correctOptionIndex,
    }));
    try {
      await save({
        courseId,
        body: { title, passPercent, required: true, questions: mapped },
      }).unwrap();
      setNotice("Your quiz is saved. Correct answers stay private until grading.");
    } catch (reason) {
      setError(friendlyError(reason));
    }
  };

  return (
    <details className="quiz-builder" open={!locked}>
      <summary>
        <span>
          <CircleHelp size={15} /> Course assessment
        </span>
        <ChevronDown size={15} />
      </summary>
      <div className="quiz-builder-body">
        <p>
          Add questions learners can use to check what stuck. This quiz is required for
          a certificate.
        </p>
        {error && <ErrorPanel message={error} compact />}
        {notice && (
          <div className="quiz-save-notice">
            <Check size={13} /> {notice}
          </div>
        )}
        <form onSubmit={handleSave}>
          <div className="quiz-builder-top">
            <label>
              Quiz title
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={locked}
              />
            </label>
            <label>
              Pass mark
              <select
                value={passPercent}
                onChange={(event) => setPassPercent(Number(event.target.value))}
                disabled={locked}
              >
                <option value={60}>60%</option>
                <option value={70}>70%</option>
                <option value={80}>80%</option>
                <option value={90}>90%</option>
              </select>
            </label>
          </div>
          {questions.map((question, index) => (
            <div className="quiz-builder-question" key={index}>
              <div className="quiz-builder-q-head">
                <strong>Question {index + 1}</strong>
                {questions.length > 1 && !locked && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions(questions.filter((_, item) => item !== index))
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
              <label>
                Prompt
                <input
                  required
                  value={question.prompt}
                  onChange={(event) =>
                    setQuestions(
                      questions.map((item, i) =>
                        i === index ? { ...item, prompt: event.target.value } : item
                      )
                    )
                  }
                  placeholder="Ask one clear question"
                  disabled={locked}
                />
              </label>
              <label>
                Answer options <small>One option per line. Add at least two.</small>
                <textarea
                  required
                  rows={3}
                  value={question.optionsText}
                  onChange={(event) =>
                    setQuestions(
                      questions.map((item, i) =>
                        i === index ? { ...item, optionsText: event.target.value } : item
                      )
                    )
                  }
                  placeholder={"First answer\nSecond answer"}
                  disabled={locked}
                />
              </label>
              <label>
                Correct answer
                <select
                  value={question.correctOptionIndex}
                  onChange={(event) =>
                    setQuestions(
                      questions.map((item, i) =>
                        i === index
                          ? { ...item, correctOptionIndex: Number(event.target.value) }
                          : item
                      )
                    )
                  }
                  disabled={locked}
                >
                  {question.optionsText
                    .split("\n")
                    .map((option, optionIndex) =>
                      option.trim() ? (
                        <option key={optionIndex} value={optionIndex}>
                          {optionIndex + 1}. {option.trim()}
                        </option>
                      ) : null
                    )}
                </select>
              </label>
            </div>
          ))}
          <div className="quiz-builder-actions">
            {!locked && (
              <button
                className="button button-cream"
                type="button"
                onClick={() =>
                  setQuestions([
                    ...questions,
                    { prompt: "", optionsText: "", correctOptionIndex: 0 },
                  ])
                }
              >
                <Plus size={13} /> Add question
              </button>
            )}
            {!locked && (
              <button className="button button-dark" disabled={state.isLoading}>
                {state.isLoading ? "Saving…" : "Save quiz"}
              </button>
            )}
          </div>
        </form>
        {locked && (
          <small className="quiet-note">Unpublish this course to edit its quiz.</small>
        )}
      </div>
    </details>
  );
}
