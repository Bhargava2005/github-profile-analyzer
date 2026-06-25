CREATE DATABASE IF NOT EXISTS github_analyzer;
USE github_analyzer;

CREATE TABLE IF NOT EXISTS github_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE COMMENT 'GitHub login username',
  name VARCHAR(255) COMMENT 'Display name on GitHub',
  bio TEXT COMMENT 'User bio',
  location VARCHAR(255) COMMENT 'User reported location',
  email VARCHAR(255) COMMENT 'Public email',
  blog VARCHAR(500) COMMENT 'Website/blog URL',
  company VARCHAR(255) COMMENT 'Company affiliation',
  avatar_url VARCHAR(500) COMMENT 'URL to profile avatar image',
  github_url VARCHAR(500) COMMENT 'URL to GitHub profile page',
  public_repos INT DEFAULT 0 COMMENT 'Number of public repositories',
  public_gists INT DEFAULT 0 COMMENT 'Number of public gists',
  followers INT DEFAULT 0 COMMENT 'Number of followers',
  following INT DEFAULT 0 COMMENT 'Number of users followed',
  total_stars INT DEFAULT 0 COMMENT 'Total stars received across all public repos',
  total_forks INT DEFAULT 0 COMMENT 'Total forks received across all public repos',
  most_used_language VARCHAR(100) COMMENT 'Most frequently used programming language',
  top_repos JSON COMMENT 'Top 5 repositories by star count (JSON array)',
  account_created_at DATETIME COMMENT 'When the GitHub account was created',
  last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When this record was last refreshed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When this record was first inserted'
);
