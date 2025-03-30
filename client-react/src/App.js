/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useRef, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { flushSync } from 'react-dom';
import './App.css';

import ConversationDisplayArea from './components/ConversationDisplayArea.js';
import Header from './components/Header.js';
import MessageInput from './components/MessageInput.js';
import Questionnaire from './components/Questionnare.js';
import { questionnaireData } from './questionnare.js';

function App() {
  const inputRef = useRef();
  const host = "http://localhost:9000"
  const url = host + "/chat";
  const streamUrl = host + "/stream";

  /** State variable for message history. */
  const [data, setData] = useState([]);
  /** State variable for Temporary streaming block. */
  const [answer, setAnswer] = useState("")
  /** State variable to show/hide temporary streaming block. */
  const [streamdiv, showStreamdiv] = useState(false);
  /** State variable to toggle between streaming and non-streaming response. */
  const [toggled, setToggled] = useState(false); 
  /**  State variable used to block the user from inputting the next message until the previous conversation is completed.*/
  const [waiting, setWaiting] = useState(false);

  /** State variable for the application phase */
  const [appState, setAppState] = useState('initial'); // 'initial', 'questionnaire', 'chatting'

  useEffect(() => {
    if (appState === 'initial' && data.length === 0) {
      // Use flushSync to ensure the state update is processed synchronously if needed,
      // though for initial message it might not be strictly necessary.
      flushSync(() => {
          setData([
            { "role": "model", "parts": [{ "text": "Welcome! Would you like to take a quick questionnaire to help me understand your preferences, or start chatting directly?" }] }
          ]);
      });
    }
  }, [appState, data.length]); // Run only when appState or data.length changes


  /** Function to scroll smoothly to the top of the mentioned checkpoint. */
  function executeScroll() {
    // Debounce or throttle this if called too frequently in streaming
    setTimeout(() => {
        const element = document.getElementById('checkpoint');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, 100); // Small delay allows DOM updates
  }

  function validationCheck(str) {
    return str === null || str.match(/^\s*$/) !== null;
  }

  /** Handle form submission (only when in 'chatting' state). */
  const handleClick = () => {
    if (appState !== 'chatting' || waiting) return; // Only allow sending in chat mode and when not waiting

    const userMessage = inputRef.current.value;
    if (validationCheck(userMessage)) {
      console.log("Empty or invalid entry");
    } else {
      // Call the appropriate handler, passing null message means read from inputRef
      if (!toggled) {
        handleNonStreamingChat(null); 
      } else {
        handleStreamingChat(null);
      }
    }
  };

  const handleInitialChoice = (choice) => {
    if (waiting) return; // Don't allow choice while waiting for something else

    let choiceText = "";
    let nextState = "";
    let followUpBotMessage = null;

    if (choice === 'questionnaire') {
      choiceText = "Take Questionnaire";
      nextState = 'questionnaire';
    } else {
      choiceText = "Start Chatting";
      nextState = 'chatting';
      followUpBotMessage = { "role": "model", "parts": [{ "text": "Great! If you would like to learn about salaries from our database, provide a prompt in this format: (job) Salaries in (city). For example: Software Developer Salaries in New York" }] };
    }

    // Add user's choice to history
    const ndata = [...data, { "role": "user", "parts": [{ "text": choiceText }] }];

    // Add bot follow-up if needed
    const finalData = followUpBotMessage ? [...ndata, followUpBotMessage] : ndata;

    flushSync(() => {
      setData(finalData);
      setAppState(nextState); // Change state after adding messages
    });
    executeScroll();
  };


   const handleQuestionnaireSubmit = async (submittedAnswers) => {
      setWaiting(true); 

      // Optional: Add a system message to chat history
      const submissionMessage = "Questionnaire completed. Generating personalized response...";
      const ndata_submission = [...data, { "role": "user", "parts": [{ "text": submissionMessage }] }]; // Treat submission action as user input for history
      flushSync(() => {
          setData(ndata_submission);
      });
      executeScroll();

      // Construct the Prompt
      let prompt = "Based on the user's questionnaire answers:\n";
      questionnaireData.career_questions.forEach((q) => {
          const answerValue = submittedAnswers[q.id]; // e.g., "1" or "2"
          const answerKey = `option${answerValue}`; // e.g., "option1" or "option2"
          if (q[answerKey]) { // Ensure the option exists
              const selectedOptionText = q[answerKey];
              // Include question text for clarity in the prompt 
              const questionText = q.text || `Question ${q.id}`;
              prompt += `- ${questionText}: ${selectedOptionText}\n`;
          }
      });
      prompt += "\nSuggest some suitable careers based on these preferences.";

      console.log("Constructed Prompt:", prompt); // For debugging

      // Call the appropriate chat handler, passing the constructed prompt
      // and the current data state *including* the submission message.
      if (!toggled) {
          await handleNonStreamingChat(prompt, ndata_submission);
      } else {
          await handleStreamingChat(prompt, ndata_submission);
      }

      // Set state to chatting *after* the AI response is handled
      setAppState('chatting');
      // Note: 'waiting' state is reset within the chat handlers.
   };


  const handleNonStreamingChat = async (messageToSend = null, baseData = null) => {
    const userMessage = messageToSend ?? inputRef.current?.value; 
    const currentHistory = baseData ?? data; 

    // If messageToSend is null, it means it came from user input, so add it now.
    let ndata = currentHistory;
    if (messageToSend === null) {
        ndata = [...currentHistory, { "role": "user", "parts": [{ "text": userMessage }] }];
        flushSync(() => {
            setData(ndata);
            if (inputRef.current) {
                inputRef.current.value = "";
                inputRef.current.placeholder = "Waiting for model's response";
            }
            setWaiting(true);
        });
        executeScroll();
    } else {
        // If messageToSend is provided (from questionnaire), 'waiting' is already true,
        // and the triggering message is already in baseData.
        // We just need to ensure ndata points to the correct history for the API call.
        ndata = currentHistory;
    }

    /** Prepare POST request data. */
    const chatData = {
      chat: userMessage, // Send the specific message (input or prompt)
      history: ndata // Send the history *including* the latest user part
    };

    /** Headers for the POST request. */
    let headerConfig = {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        "Access-Control-Allow-Origin": "*",
      }
    };

    /** Function to perform POST request. */
    const fetchData = async () => {
      var modelResponse = "";
      try {
        const response = await axios.post(url, chatData, headerConfig);
        modelResponse = response.data.text;
      } catch (error) {
        console.error("Non-streaming fetch error:", error);
        modelResponse = "Sorry, an error occurred while getting the response.";
      } finally {
        /** Add model response to the history. */
        // Important: Use 'ndata' which contains the user message/prompt triggering this response
        const updatedData = [...ndata, { "role": "model", "parts": [{ "text": modelResponse }] }];

        /** Re-render DOM with updated history. Enable input. */
        flushSync(() => {
          setData(updatedData);
          if (inputRef.current) { // Only update placeholder if input exists
            inputRef.current.placeholder = "Enter a message.";
          }
          setWaiting(false); // Allow new input
        });
        /** Scroll to the new model response. */
        executeScroll();
      }
    };

    await fetchData(); // Ensure we wait for fetch to complete if called from questionnaire
  };

  /**
   * Handle streaming chat.
   */
  const handleStreamingChat = async (messageToSend = null, baseData = null) => {
    const userMessage = messageToSend ?? inputRef.current?.value;
    const currentHistory = baseData ?? data;

    let ndata = currentHistory;
    if (messageToSend === null) {
        ndata = [...currentHistory, { "role": "user", "parts": [{ "text": userMessage }] }];
        flushSync(() => {
            setData(ndata);
            if (inputRef.current) {
                inputRef.current.value = "";
                inputRef.current.placeholder = "Waiting for model's response";
            }
            setWaiting(true);
        });
        executeScroll();
    } else {
        ndata = currentHistory;
    }

    /** Prepare POST request data. */
    const chatData = {
      chat: userMessage,
      history: ndata
    };

    /** Headers for the POST request. */
    let headerConfig = {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    };

    /** Function to perform POST request. */
    const fetchStreamData = async () => {
      var modelResponse = ""; 
      try {
        setAnswer(""); 
        showStreamdiv(true); 

        const response = await fetch(streamUrl, {
          method: "post",
          headers: headerConfig,
          body: JSON.stringify(chatData),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP error! status: ${response.status}`); 
        }

        const reader = response.body.getReader();
        const txtdecoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          const decodedTxt = txtdecoder.decode(value, { stream: true });

          // Update temporary streaming display AND accumulate full response
          setAnswer((prevAnswer) => prevAnswer + decodedTxt);
          modelResponse += decodedTxt;

          executeScroll(); 
        }
      } catch (err) {
        console.error("Streaming fetch error:", err);
        modelResponse = "Sorry, an error occurred during streaming.";
        // Ensure stream div is updated with error if needed, or cleared
        setAnswer("Error occurred.");
      } finally {
        showStreamdiv(false); 
        setAnswer(""); 

        /** Add the complete model response to the history. */
        // Use 'ndata' to base the update correctly
        const updatedData = [...ndata, { "role": "model", "parts": [{ "text": modelResponse || "Stream ended unexpectedly." }] }]; // Ensure some text is added

        /** Re-render DOM with updated history. Enable input. */
        flushSync(() => {
          setData(updatedData);
          if (inputRef.current) { // Only update placeholder if input exists
            inputRef.current.placeholder = "Enter a message.";
          }
          setWaiting(false); // Allow new input
        });
        /** Scroll to the final model response position. */
        executeScroll();
      }
    };
    await fetchStreamData(); // Ensure we wait
  };


  return (
    <center>
      <div className="chat-app">
        {/* Header is always visible */}
        <Header toggled={toggled} setToggled={setToggled} />

        {/* Conversation area is always visible */}
        <ConversationDisplayArea data={data} streamdiv={streamdiv} answer={answer} />

        {appState === 'initial' && !waiting && (
          <div className="initial-choices">
            <button onClick={() => handleInitialChoice('questionnaire')}>
              Take Questionnaire
            </button>
            <button onClick={() => handleInitialChoice('chatting')}>
              Start Chatting
            </button>
          </div>
        )}

        {appState === 'questionnaire' && !waiting && (
          <Questionnaire
            questions={questionnaireData.career_questions}
            onSubmit={handleQuestionnaireSubmit}
          />
        )}

        {appState === 'chatting' && (
          <MessageInput inputRef={inputRef} waiting={waiting} handleClick={handleClick} />
        )}

        {waiting && (appState === 'initial' || appState === 'questionnaire') && (
            <div className="loading-indicator">Processing...</div> 
        )}


      </div>
    </center>
  );
}

export default App;