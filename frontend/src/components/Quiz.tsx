import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
}

const difficulties = [1, 2, 3, 4, 5];

const questionList: Question[] = [
  { questionText: "Difficulty 1, Question 1", difficulty: 1, options: ["1", "0"], correctAnswer: "1" },
  { questionText: "Difficulty 1, Question 2", difficulty: 1, options: ["2", "0"], correctAnswer: "2" },
  { questionText: "Difficulty 1, Question 3", difficulty: 1, options: ["3", "0"], correctAnswer: "3" },

  { questionText: "Difficulty 2, Question 1", difficulty: 2, options: ["1", "0"], correctAnswer: "1" },
  { questionText: "Difficulty 2, Question 2", difficulty: 2, options: ["2", "0"], correctAnswer: "2" },
  { questionText: "Difficulty 2, Question 3", difficulty: 2, options: ["3", "0"], correctAnswer: "3" },
  
  { questionText: "Difficulty 3, Question 1", difficulty: 3, options: ["1", "0"], correctAnswer: "1" },
  { questionText: "Difficulty 3, Question 2", difficulty: 3, options: ["2", "0"], correctAnswer: "2" },
  { questionText: "Difficulty 3, Question 3", difficulty: 3, options: ["3", "0"], correctAnswer: "3" },
  
  { questionText: "Difficulty 4, Question 1", difficulty: 4, options: ["1", "0"], correctAnswer: "1" },
  { questionText: "Difficulty 4, Question 2", difficulty: 4, options: ["2", "0"], correctAnswer: "2" },
  { questionText: "Difficulty 4, Question 3", difficulty: 4, options: ["3", "0"], correctAnswer: "3" },
  
  { questionText: "Difficulty 5, Question 1", difficulty: 5, options: ["1", "0"], correctAnswer: "1" },
  { questionText: "Difficulty 5, Question 2", difficulty: 5, options: ["2", "0"], correctAnswer: "2" },
  { questionText: "Difficulty 5, Question 3", difficulty: 5, options: ["3", "0"], correctAnswer: "3" },
];

const questionsByDifficulty: Record<number, Question[]> = {
  1: questionList.filter((q) => q.difficulty === 1),
  2: questionList.filter((q) => q.difficulty === 2),
  3: questionList.filter((q) => q.difficulty === 3),
  4: questionList.filter((q) => q.difficulty === 4),
  5: questionList.filter((q) => q.difficulty === 5),
};

const Quiz: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [status, setStatus] = useState<"question" | "correct" | "wrong" | "finished">("question");

  useEffect(() => {
    const lvl = difficulties[levelIndex];
    const pool = questionsByDifficulty[lvl];
    const rand = Math.floor(Math.random() * pool.length);
    setCurrentQuestion(pool[rand]);
    setStatus("question");
  }, [levelIndex]);

  const handleSelect = (opt: string) => {
    if (status !== "question" || !currentQuestion) return;
    setStatus(opt === currentQuestion.correctAnswer ? "correct" : "wrong");
  };

  const goToNext = () => {
    if (levelIndex < difficulties.length - 1) {
      setLevelIndex(levelIndex + 1);
    } else {
      setStatus("finished");
    }
  };

  const renderQuestion = () => (
    <>
      <h2 className="text-3xl font-semibold">{currentQuestion?.questionText}</h2>
      <div className="mt-4 flex flex-row justify-center gap-6">
        {currentQuestion?.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className="w-32 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-xl"
          >
            {opt}
          </button>
        ))}
      </div>
    </>
  );

  const renderCorrect = () => (
    <>
      <h2 className="text-4xl font-bold text-green-400">Correct!</h2>
      <button
        onClick={goToNext}
        className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 rounded text-xl"
      >
        Next
      </button>
    </>
  );

  const renderWrong = () => (
    <>
      <h2 className="text-4xl font-bold text-red-500">Wrong!</h2>
      <div className="max-w-6xl mx-auto mt-6 flex justify-end">
        <Link
          to="/homepage"
          className="!text-white visited:!text-white hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </>
  );

  const renderFinished = () => (
    <h2 className="text-4xl font-bold">Quiz Complete!</h2>
  );

  return (
    <div className="fixed inset-0 bg-zinc-900 flex flex-col items-center justify-center text-white p-4">
      {status === "question" && currentQuestion && renderQuestion()}
      {status === "correct" && renderCorrect()}
      {status === "wrong" && renderWrong()}
      {status === "finished" && renderFinished()}
    </div>
  );
};

export default Quiz;
