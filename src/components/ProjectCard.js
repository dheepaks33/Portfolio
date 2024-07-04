import React from 'react';
import './ProjectCard.css';
import githubIcon from '../images/github.png'; // Adjust the path based on where you saved the image

const ProjectCard = ({ project }) => {
  return (
    <div className="project-card">
      <div className="project-content">
        <h3 className="project-title">{project.title}</h3>
        <p className="project-description">{project.description}</p>
        <a href={project.link} className="project-link">
          <img src={githubIcon} alt="GitHub Link" className="github-icon" />
        </a>
      </div>
    </div>
  );
};

export default ProjectCard;
