
import React from 'react';
import './HomePage.css';
import avatar from '../images/avatar.png';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import { SiGmail } from 'react-icons/si';


const HomePage = () => {
  return (
    <div className="home-page">
      <div className="card-home">
        <img src={avatar} alt="Dheepak S" className="avatar" />
        <h1 className="home-title">Welcome, I'm Dheepak Selvakumar</h1>
        <div className="home-desc">
          I’m a Software Development Engineer passionate about bridging embedded systems and intelligent computing. With hands-on experience in C/C++, DSP algorithms, and cross-platform integration, I’m now exploring GPU and TPU acceleration for AI/ML development — optimizing models for real-time, edge, and cloud performance.
        </div>
        <div className="home-desc">
          If you’re working on projects involving AI frameworks, hardware optimization, or performance engineering, I’d love to collaborate.
        </div>
        <div className="home-contact">
          <span className="contact-icon"><SiGmail /></span>
          <a href="mailto:dheepaks33@gmail.com">dheepaks33@gmail.com</a>
          <a href="https://www.linkedin.com/in/dheepaks33/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
            <span className="contact-icon"><FaLinkedin /></span>
          </a>
          <a href="https://github.com/dheepaks33/" target="_blank" rel="noopener noreferrer" title="GitHub">
            <span className="contact-icon"><FaGithub /></span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
