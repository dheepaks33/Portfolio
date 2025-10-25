import React from 'react';
import './HomePage.css'; // Import the CSS file
import avatar from '../images/avatar.png'; // Correct the image import path

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="content-container">
        <img src={avatar} alt="Dheepak S" className="avatar"/>
        <div className="text-container">
          <h1>Welcome, I'm Dheepak Selvakumar</h1>
          <p>
            I’m a Software Development Engineer passionate about bridging embedded systems and intelligent computing. With hands-on experience in C/C++, DSP algorithms, and cross-platform integration (Intel & ARM), I’m now exploring GPU and TPU acceleration for AI/ML development — optimizing models for real-time, edge, and cloud performance.
          </p>
          <p>
            If you’re working on projects involving AI frameworks, hardware optimization, or performance engineering, I’d love to collaborate.
          </p>
          <p>
            📩 Reach out to me at <a href="mailto:dheepaks33@gmail.com">dheepaks33@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
