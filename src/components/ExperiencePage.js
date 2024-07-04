import React from 'react';
import './ExperiencePage.css'; // Ensure you have a corresponding CSS file for styling

const ExperiencePage = () => {
  return (
    <div className="experience-page">
      <h1>Experience</h1>

      {/* Experience Details */}
      <div className="experience-details">
        <h2>Student Trainee - Bosch Global Software Technologies</h2>
        <ul>
          <li>
            Developed an automation tool using React.js, Electron.js, Flask, and various APIs to automate Pre-Delivery checks during software delivery.
          </li>
          <li>
            Successfully tested the APIs using Thunder Client and performed Unit testing for the tool.
          </li>
          <li>
            Collaborated closely with a team for a hackathon, working on real-time sensor data and specializing in formatting .tdfs files into various Excel formats.
          </li>
          <li>
            Participated in Fit Fest, achieving first place in "Wheel to Deals" and finishing as the 2nd runner-up in "Fit Debate."
          </li>
        </ul>
      </div>
  
      {/* Certificate Section */}
      <div className="certificate-section">
      <h2>Certificates</h2>
        <p>To view all my certifications</p>
        <a href="https://drive.google.com/drive/folders/14TsVLX3y6vDPqkamdZNvblZj5lZ3_1x8" target="_blank" rel="noopener noreferrer">Google Drive</a>
      </div>
    </div>
  );
}

export default ExperiencePage;
