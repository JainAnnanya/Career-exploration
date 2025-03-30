import React, { useState, useMemo } from 'react';
import './Questionnaire.css'; 

function Questionnaire({ questions, onSubmit }) {
  const [answers, setAnswers] = useState({}); // Store answers as { questionId: optionValue }

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const allAnswered = useMemo(() => {
    return questions.length === Object.keys(answers).length;
  }, [questions, answers]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (allAnswered) {
      onSubmit(answers);
    } else {
      alert("Please answer all questions."); 
    }
  };

  return (
    <form className="questionnaire-form" onSubmit={handleSubmit}>
      <h2>Career Preferences Questionnaire</h2>
      {questions.map((q, index) => (
        <div key={q.id} className="question-block">
          <p><strong>{index + 1}. {q.text}</strong></p>
          <div className="options">
            {Object.keys(q).filter(key => key.startsWith('option')).map((optionKey, optIndex) => {
              const optionValue = String(optIndex + 1); // e.g., "1", "2"
              const optionText = q[optionKey];
              const inputId = `${q.id}-${optionKey}`;
              return (
                <label key={optionKey} htmlFor={inputId} className="option-label">
                  <input
                    type="radio"
                    id={inputId}
                    name={q.id} // Group radios by question id
                    value={optionValue}
                    checked={answers[q.id] === optionValue}
                    onChange={() => handleAnswerChange(q.id, optionValue)}
                    required // Ensures selection within the group
                  />
                  {optionText}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <button type="submit" disabled={!allAnswered}>
        Submit Answers
      </button>
    </form>
  );
}

export default Questionnaire;