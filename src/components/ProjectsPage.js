// src/components/ProjectsPage.js
import React from 'react';
import ProjectCard from './ProjectCard';
import './ProjectsPage.css';

const projects = [
  {
    title: 'Cardiovascular Disease Classification',
    description: 'Cardiovascular disease identification using MRI images',
    link: 'https://github.com/dheepaks33/Cardiovascular-Disease-Classification'
  },
  {
    title: 'Sentence Saliency System',
    description: 'For a custom dataset we performed a sentence saliency and profanity checks using Classifiers',
    link: 'https://github.com/dheepaks33/Sentence-Saliency-System'
  },
  {
    title: 'Drowsiness Detection System',
    description: "Drowsiness detection system that uses computer vision techniques to monitor a person's eyes and detect signs of drowsiness",
    link: "https://github.com/dheepaks33/Drowsiness-Detection-System"
  },
  {
    title: 'Fraud Detection',
    description: "Anonymized credit card transactions labeled as fraudulent or genuine",
    link: "https://github.com/dheepaks33/Credit-Card-Fraud-Detection"
  },
  {
    title: 'Disaster Tweets',
    description: "Classification of disaster from tweets",
    link: "https://github.com/dheepaks33/NLP-with-Disaster-Tweets"
  },
  {
    title: 'Feel Tweets',
    description: "Sentiment analysis of tweets",
    link: "https://github.com/dheepaks33/Feel-Tweets"
  },
  {
    title: 'Snake and Ladders',
    description: "Snake and ladder game using Python Tkinter library",
    link: "https://github.com/dheepaks33/Snake-and-Ladder-Game"
  },
];

const ProjectsPage = () => {
  return (
    <div className="projects-page">
      <h1 className="page-title">Projects</h1>
      <div className="projects-grid">
        {projects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
