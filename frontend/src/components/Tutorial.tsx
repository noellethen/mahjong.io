import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Define each tutorial slide
interface Slide {
  title: string;
  description: string;
  tiles?: string[];
  extra?: string;
}

const slides: Slide[] = [
  { title: 'Win Conditions', description: 'A standard Mahjong winning hand consists of 4 melds and 1 pair, as well as 1 Tai.', tiles: ['1B','2B','3B','4B','5B','6B','7B','8B','9B','Red','Red','Red','White','White'] },
  { title: 'Win Conditions', description: '• A Pong is three of a kind.', tiles: ['1D','1D','1D'] },
  { title: 'Win Conditions', description: '• A Chi is a run of three consecutive suited tiles.', tiles: ['1C','2C','3C'] },
  { title: 'Win Conditions', description: '• The pair is two identical tiles.', tiles: ['9D','9D'] },
  { title: 'Win Conditions', description: "You can claim another player's discard to complete a Pong or Chi (only the next player for Chi). Otherwise, you draw from the wall and discard until you complete your hand." },
  { title: 'Scoring (Tai)', description: 'Each winning hand scores Tai based on special patterns and bonus tiles.', tiles: ['Flower1','Flower2','Flower3','Flower4','Season1','Season2','Season3','Season4','Cat','Mouse','Centipede','Chicken','Red','White','Green','East','South','West','North'] },
  { title: 'Scoring (Tai)', description: 'Triplet of Dragon or Seat/Prevailing Wind: 1 Tai each.', tiles: ['East','South','West','North','Red','White','Green'], extra: 'Seat Wind is based on your current seat; Prevailing Wind is the round wind in play.' },
  { title: 'Scoring (Tai)', description: 'Flower/Animal tiles: 1 Tai each (collect sets for extra Tai).', tiles: ['Flower1','Flower2','Flower3','Flower4','Season1','Season2','Season3','Season4','Cat','Mouse','Centipede','Chicken'] },
  { title: 'Scoring (Tai)', description: 'Many other special hands and events (Full Flush, Half Flush, Ping Hu etc.) each add Tai.' }
];

// Quiz data and selection
interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}
const allQuestions: Question[] = [
  { question: 'How many melds make up a standard winning hand?', options: ['3', '4', '5'], correctIndex: 1 },
  { question: 'A Pong consists of:', options: ['A pair', 'Three identical tiles', 'A run of three tiles'], correctIndex: 1 },
  { question: 'Which of these is a suited tile?', options: ['Red', '2C', 'East'], correctIndex: 1 },
  { question: 'How many tiles are in a complete Mahjong wall?', options: ['108', '136', '144'], correctIndex: 1 },
  { question: 'What is the composition of a Chi?', options: ['Three identical tiles', 'Run of three consecutive suited tiles', 'A pair'], correctIndex: 1 },
  { question: 'Which tile is an honor tile?', options: ['5B', 'East', '3C'], correctIndex: 1 },
  { question: 'A standard pair scores how many Tai?', options: ['1', '0', '2'], correctIndex: 1 },
  { question: 'Flower tiles give how many Tai each?', options: ['1', '2', '4'], correctIndex: 0 }
];
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const quizQuestions: Question[] = shuffleArray(allQuestions).slice(0, 5);

// Quiz component
function Quiz() {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const current = quizQuestions[qIndex];

  const handleSubmit = () => {
    if (selected === current.correctIndex) setScore(prev => prev + 1);
    setSelected(null);
    if (qIndex < quizQuestions.length - 1) setQIndex(prev => prev + 1);
    else setFinished(true);
  };

  return (
    <div className="full-screen-component bg-[url('/Homepage.png')] bg-cover bg-center text-white font-semibold text-xl flex flex-col items-center justify-center p-6">
      {finished ? (
        <div className="text-center">
          <h2 className="text-3xl mb-4">Quiz Complete!</h2>
          <p className="text-xl">Your score: {score} / {quizQuestions.length}</p>
        </div>
      ) : (
        <div className="max-w-lg w-full">
          <h2 className="text-2xl mb-4">Quiz: {current.question}</h2>
          <ul className="mb-4 space-y-2">
            {current.options.map((opt, idx) => (
              <li key={idx}>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="option"
                    checked={selected === idx}
                    onChange={() => setSelected(idx)}
                    className="accent-green-500"
                  />
                  <span>{opt}</span>
                </label>
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className="px-4 py-2 bg-darkgoldenrod rounded text-black disabled:opacity-50 hover:bg-blue-500"
          >{qIndex < quizQuestions.length - 1 ? 'Next' : 'Submit'}</button>
        </div>
      )}
      <div className="max-w-6xl mx-auto mt-6 flex items-end justify-end">
        <Link
          to="/homepage"
          className="!text-white visited:!text-white hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

function TutorialPage() {
  const [index, setIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const slide = slides[index];
  const last = slides.length - 1;

  if (showQuiz) return <Quiz />;

  return (
    <div className="full-screen-component bg-[url('/Homepage.png')] bg-cover bg-center text-white font-semibold text-xl flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <h2 className="text-3xl font-bold mb-4">{slide.title}</h2>
        <p className="mb-4 whitespace-pre-line">{slide.description}</p>
        {slide.tiles && (
          <div className="flex flex-wrap gap-2 mb-4 items-center justify-center">
            {slide.tiles.map((tile, idx) => (
              <img key={`${tile}-${idx}`} src={`/tiles/${tile}.png`} alt={tile} className="h-16 w-auto" />
            ))}
          </div>
        )}
        {slide.extra && <p className="italic mb-4">{slide.extra}</p>}
        <div className="flex justify-between">
          <button
            onClick={() => setIndex(prev => Math.max(0, prev - 1))}
            disabled={index === 0}
            className={`px-4 py-2 text-black rounded ${index === 0 ? 'bg-gray-700 opacity-50' : 'bg-gray-700 hover:bg-gray-600'}`}
            style={{ backgroundColor: 'darkgoldenrod' }}
          >Previous</button>
          {index < last ? (
            <button
              onClick={() => setIndex(prev => prev + 1)}
              className="px-4 py-2 text-black bg-gray-700 hover:bg-gray-600 rounded"
              style={{ backgroundColor: 'darkgoldenrod' }}
            >Next</button>
          ) : (
            <button
              onClick={() => setShowQuiz(true)}
              className="px-4 py-2 text-black rounded hover:bg-blue-500"
              style={{ backgroundColor: 'darkgoldenrod' }}
            >Start Quiz</button>
          )}
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-6 flex items-end justify-end">
        <Link
          to="/homepage"
          className="!text-white visited:!text-white hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default TutorialPage;
