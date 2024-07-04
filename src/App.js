import React, { useEffect } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './App.css';
import HomePage from './components/HomePage';
import ProjectsPage from './components/ProjectsPage';
import ExperiencePage from './components/ExperiencePage';
import CodingProfilesPage from './components/CodingProfilesPage';

// Import images using require
import linkedinIcon from './images/linkedin.png';
import gmailIcon from './images/Gmail.png';
import githubIcon from './images/github_title.png';

const App = () => {
  const [activePage, setActivePage] = React.useState('home');

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'projects':
        return <ProjectsPage />;
      case 'experience':
        return <ExperiencePage />;
      case 'codingProfiles':
        return <CodingProfilesPage />;
      default:
        return <HomePage />;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const app = document.querySelector('.app');
      const rect = app.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top;  // y position within the element
      const walk = 25; // Increased shadow distance

      const xWalk = (x / app.offsetWidth * walk - walk / 2).toFixed(2);
      const yWalk = (y / app.offsetHeight * walk - walk / 2).toFixed(2);

      app.style.boxShadow = `${xWalk}px ${yWalk}px 15px rgba(0, 255, 0, 0.5)`;
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="app">
      <div className="main-content">
        <div className="navbar">
          <div className="left">
            <ul>
              <li><a href="#home" onClick={() => setActivePage('home')}>DS.</a></li>
              <li><a href="#projects" onClick={() => setActivePage('projects')}>Projects</a></li>
              <li><a href="#experience" onClick={() => setActivePage('experience')}>Experience</a></li>
              <li><a href="#codingProfiles" onClick={() => setActivePage('codingProfiles')}>Coding Profiles</a></li>
            </ul>
          </div>
          <div className="right">
            <a href="https://www.linkedin.com/in/dheepaks33/" target="_blank" rel="noopener noreferrer">
              <img src={linkedinIcon} alt="LinkedIn" className="social-icon" />
            </a>
            <a href="mailto:dheepaks33@gmail.com">
              <img src={gmailIcon} alt="Mail" className="social-icon" />
            </a>
            <a href="https://github.com/dheepaks33/" target="_blank" rel="noopener noreferrer">
              <img src={githubIcon} alt="GitHub" className="social-icon" />
            </a>
          </div>
        </div>
        <TransitionGroup>
          <CSSTransition
            key={activePage}
            classNames="fade"
            timeout={600}
          >
            <div className="content">
              {renderPage()}
            </div>
          </CSSTransition>
        </TransitionGroup>
      </div>
    </div>
  );
};

export default App;
