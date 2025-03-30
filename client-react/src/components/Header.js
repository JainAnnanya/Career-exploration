import React from 'react';
import logoduck from '../assets/logoduck.png';
 
const Header = ({ toggled, setToggled }) => {
  return (
    <div className="chat-header">
      <div className="header-titles">
      <div className="title-with-logo">
          <img
            src={logoduck} // Use the imported logo
            alt="Career Quacker logo" // Descriptive alt text
            className="header-logo" // Class for styling
          />
          <h1>The Career Quacker</h1>
        </div>
        <h2>Because even ducks need direction.</h2>
      </div>
      <div className="header-toggle-controls">
      <span className='toggle-text'>Stream Response</span>
      <button 
        className={`toggle-btn ${toggled ? "toggled": "stream response buttons"}`}
        onClick={() => setToggled(!toggled)}
      >
        <div className="toggle-hover">
          <div className='thumb'></div>
          {toggled === false ? (
            <span className="toggle-hover-text">Streaming response Off (send whole response at once)</span>
          ) : (
            <span className="toggle-hover-text">Streaming response On (send chucks of response at a time)</span>
          )}
        </div>
      </button>
      </div>
    </div>
  );
};

export default Header;