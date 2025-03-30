import React from 'react';

const Header = ({ toggled, setToggled }) => {
  return (
    <div className="chat-header">
      <h1>Career Navigation Chat App</h1>
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
  );
};

export default Header;