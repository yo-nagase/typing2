'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactCanvasConfetti from 'react-canvas-confetti';

const canvasStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 50
} as const;

const sentences = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "How vexingly quick daft zebras jump!",
  "Sphinx of black quartz, judge my vow.",
  "Two driven jocks help fax my big quiz."
];

const difficultyLevels = {
  easy: { timeLimit: 60, multiplier: 1 },
  medium: { timeLimit: 45, multiplier: 1.5 },
  hard: { timeLimit: 30, multiplier: 2 }
};

export default function Home() {
  const [currentSentence, setCurrentSentence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'finished'
  const [difficulty, setDifficulty] = useState('easy');
  const [feedback, setFeedback] = useState('');
  const refAnimationInstance = useRef(null);
  const audioContext = useRef<AudioContext | null>(null);

  const getInstance = useCallback((instance) => {
    refAnimationInstance.current = instance;
  }, []);

  const makeShot = useCallback((particleRatio, opts) => {
    refAnimationInstance.current &&
      refAnimationInstance.current({
        ...opts,
        origin: { y: 0.7 },
        particleCount: Math.floor(200 * particleRatio),
      });
  }, []);

  const fire = useCallback(() => {
    makeShot(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    makeShot(0.2, {
      spread: 60,
    });

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [makeShot]);

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setGameState('finished');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing' && currentSentence === '') {
      const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
      setCurrentSentence(randomSentence);
    }
  }, [gameState, currentSentence]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(difficultyLevels[difficulty].timeLimit);
    setGameState('playing');
    setCurrentSentence('');
    setUserInput('');
    setFeedback('');
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setUserInput(inputValue);

    if (inputValue === currentSentence) {
      const newScore = score + (currentSentence.length * difficultyLevels[difficulty].multiplier);
      setScore(newScore);
      setCurrentSentence('');
      setUserInput('');
      fire();
      playSound('correct');
      setFeedback('正解！');
      setTimeout(() => setFeedback(''), 1000);
    } else if (currentSentence.startsWith(inputValue)) {
      setFeedback('');
    } else {
      playSound('incorrect');
      setFeedback('間違い');
      setTimeout(() => setFeedback(''), 1000);
    }
  };

  const playSound = (type: 'correct' | 'incorrect') => {
    if (!audioContext.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    if (type === 'correct') {
      oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.current.currentTime + 0.1);
    } else {
      oscillator.frequency.setValueAtTime(300, audioContext.current.currentTime);
      oscillator.frequency.setValueAtTime(150, audioContext.current.currentTime + 0.1);
    }

    gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + 0.5);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">タイピングゲーム</CardTitle>
        </CardHeader>
        <CardContent>
          {gameState === 'idle' && (
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                {Object.keys(difficultyLevels).map((level) => (
                  <Button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    variant={difficulty === level ? "default" : "outline"}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
              <Button onClick={startGame} className="w-full">
                ゲームスタート
              </Button>
            </div>
          )}
          {gameState === 'playing' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xl font-semibold">{currentSentence}</p>
                <p className="text-sm text-gray-500">上の文章を入力してください</p>
              </div>
              <Input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="ここにタイプしてください..."
                className="w-full"
                autoFocus
              />
              <div className="flex justify-between items-center">
                <p>スコア: {score}</p>
                <p className={`text-lg font-bold ${feedback === '正解！' ? 'text-green-500' : feedback === '間違い' ? 'text-red-500' : ''}`}>
                  {feedback}
                </p>
                <p>残り時間: {timeLeft}秒</p>
              </div>
            </div>
          )}
          {gameState === 'finished' && (
            <div className="space-y-4 text-center">
              <p className="text-2xl font-bold">ゲーム終了！</p>
              <p className="text-xl">最終スコア: {score}</p>
              <Button onClick={startGame} className="w-full">
                もう一度プレイ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <ReactCanvasConfetti refConfetti={getInstance} style={canvasStyles} />
    </div>
  );
}