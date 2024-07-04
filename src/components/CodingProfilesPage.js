import React from 'react';
import './CodingProfilesPage.css';

const CodingProfilesPage = () => {
  return (
    <div className="coding-profiles-page">
      <h1 className="page-title">My Coding Profiles</h1>
      <div className="profiles-grid">
        <a href="https://leetcode.com/dheepaks33/" target="_blank" rel="noopener noreferrer" className="profile-box leetcode">
          LeetCode
        </a>
        <a href="https://www.naukri.com/code360/profile/dheepaks" target="_blank" rel="noopener noreferrer" className="profile-box coding-ninjas">
          Coding Ninjas
        </a>
        <a href="https://www.codechef.com/users/dheepaks33" target="_blank" rel="noopener noreferrer" className="profile-box codechef">
          CodeChef
        </a>
        <a href="https://www.hackerrank.com/profile/dheepaks33" target="_blank" rel="noopener noreferrer" className="profile-box hackerrank">
          HackerRank
        </a>
      </div>
    </div>
  );
};

export default CodingProfilesPage;
