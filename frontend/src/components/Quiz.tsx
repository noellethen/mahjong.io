import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
  setTiles?: string[];
}

const OptionTile: React.FC<{ opt: string }> = ({ opt }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return <span className="text-xl">{opt}</span>;
  }
  return (
    <img
      src={`/tiles/${opt}.png`}
      alt={opt}
      className="h-16 w-auto mx-auto"
      onError={() => setImgError(true)}
    />
  );
};

const difficulties = [1, 2, 3, 4, 5];

const questionList: Question[] = [
  { questionText: "Which tile completes the set?", difficulty: 1, setTiles: ["2B","3B","5B","6B","7B"], options: ["1B","1D","2B","8B"], correctAnswer: "1B" },
  { questionText: "Which tile always gives +1 Tai?", difficulty: 1, options: ["Flower2","Cat","East","Green"], correctAnswer: "Cat" },
  { questionText: "Which tile is not an animal tile?", difficulty: 1, options: ["Cat","1B","Centipede","Mouse"], correctAnswer: "1B" },

  { questionText: "If this is your hand, which tile should you choose to win?", difficulty: 2, setTiles: ["5B","6B","7B","8B"], options: ["4B","5B","6B","7B"], correctAnswer: "5B" },
  { questionText: "Which tile gives the best hand after discarding", difficulty: 2, setTiles: ["1D","1D","3D","3D","4D","5D"], options: ["1D","3D","4D","5D"], correctAnswer: "3D" },
  { questionText: "Which tile should you find for the most Tai given the following hand", difficulty: 2, setTiles: ["Red","Red","Red","White","White","White"], options: ["North","East","9C","Green"], correctAnswer: "Green" },

  { questionText: "Which of these tiles is a dragon tile", difficulty: 3, options: ["North","South","White","East"], correctAnswer: "White" },
  { questionText: "Which hand gives the most tai", difficulty: 3, options: ["Ping Hu","Pong Pong","Man Se","Tian Hu"], correctAnswer: "Tian Hu" },
  { questionText: "If you have a flower that is yours, can you win by Ping Hu?", difficulty: 3, options: ["Yes","No"], correctAnswer: "No" },

  { questionText: "If this is your hand, can you win by Ping Hu?", difficulty: 4, setTiles: ["1C","2C","3C","4C"], options: ["Yes","No"], correctAnswer: "Yes" },
  { questionText: "How many ways can you win with this hand", difficulty: 4, setTiles: ["3D","4D","5D","6D","7D","8D","9D"], options: ["1","2","3","4"], correctAnswer: "3" },
  { questionText: "How many tiles are there in a Singaporean Mahjong Game", difficulty: 4, options: ["146","147","148","149"], correctAnswer: "148" },

  { questionText: "How many ways can you win with this hand", difficulty: 5, setTiles: ["1B","1B","1B","2B","3B","4B","5B","6B","7B","8B","9B","9B","9B"], options: ["1","4","7","9"], correctAnswer: "9" },
  { questionText: "How many Tai does this revealed hand give", difficulty: 5, setTiles: ["Cat","Chicken","Centipede","Mouse"], options: ["4","5"], correctAnswer: "5" },
  { questionText: "Guess the lucky number", difficulty: 5, options: ["1273","7682","4096","9"], correctAnswer: "9" },
];

const questionsByDifficulty: Record<number, Question[]> = {
  1: questionList.filter((q) => q.difficulty === 1),
  2: questionList.filter((q) => q.difficulty === 2),
  3: questionList.filter((q) => q.difficulty === 3),
  4: questionList.filter((q) => q.difficulty === 4),
  5: questionList.filter((q) => q.difficulty === 5),
};

const Quiz: React.FC = () => {
  const navigate = useNavigate();
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

  const restartQuiz = () => {
    setLevelIndex(0);
  };

  const renderQuestion = () => (
    <>
      <h2 className="text-3xl font-semibold">{currentQuestion?.questionText}</h2>
      <div className="mt-4 flex flex-row justify-center gap-4">
        {currentQuestion?.setTiles?.map((tile) => (
          <img key={tile} src={`/tiles/${tile}.png`} alt={tile} className="h-16 w-auto" />
        ))}
      </div>
      <div className="mt-4 flex flex-row justify-center gap-6">
        {currentQuestion?.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className="w-32 h-20 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded"
          >
            <OptionTile opt={opt} />
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
        className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 rounded text-xl text-white"
      >
        Next
      </button>
    </>
  );

  const renderWrong = () => (
    <>
      <h2 className="text-4xl font-bold text-red-500">Wrong!</h2>
      <p className="mt-2 text-2xl">Your score: {levelIndex} / {difficulties.length}</p> {/* ⬅️ UPDATED: show score */}
      <div className="mt-6 flex gap-4">
        <button onClick={() => navigate("/homepage")}>
          Home
        </button>
        <button
          onClick={restartQuiz}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-xl text-white"
        >
          Restart
        </button>
      </div>
    </>
  );

  const renderFinished = () => (
    <>
      <h2 className="text-4xl font-bold">Quiz Complete!</h2>
      <div className="mt-6 flex gap-4">
        <button onClick={() => navigate("/homepage")}>
          Home
        </button>
        <button
          onClick={restartQuiz}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-xl text-white"
        >
          Restart
        </button>
      </div>
    </>
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
