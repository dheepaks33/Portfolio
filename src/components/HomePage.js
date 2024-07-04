import React from 'react';
import './HomePage.css'; // Import the CSS file
import avatar from '../images/avatar.png'; // Correct the image import path

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="content-container">
        <img src={avatar} alt="Dheepak S" className="avatar"/>
        <div className="text-container">
          <h1>Welcome, I'm Dheepak</h1>
          <p>
            An aspiring software engineer and recent graduate from PSG Institute of Technology and Applied Research in the ECE domain.
            I am seeking a dynamic role in a forward-thinking organization where I can enhance my technical, communication, interpersonal, 
            and management skills, while contributing to the company's growth and innovation in future technologies.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
