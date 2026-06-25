const axios = require("axios");

const GITHUB_API_BASE = "https://api.github.com";

const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    Accept: "application/vnd.github.v3+json",
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
  timeout: 15000,
});

const fetchUserProfile = async (username) => {
  const response = await githubClient.get(`/users/${username}`);
  return response.data;
};

const fetchUserRepos = async (username) => {
  const allRepos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await githubClient.get(`/users/${username}/repos`, {
      params: {
        per_page: perPage,
        page,
        sort: "updated",
        type: "owner",
      },
    });

    const repos = response.data;
    allRepos.push(...repos);

    if (repos.length < perPage) break;
    page++;
  }

  return allRepos;
};

const computeInsights = (profile, repos) => {
  const totalStars = repos.reduce(
    (sum, repo) => sum + repo.stargazers_count,
    0
  );
  const totalForks = repos.reduce(
    (sum, repo) => sum + repo.forks_count,
    0
  );

  const languageCounts = {};
  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });
  const mostUsedLanguage =
    Object.keys(languageCounts).sort(
      (a, b) => languageCounts[b] - languageCounts[a]
    )[0] || null;

  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((repo) => ({
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      topics: repo.topics || [],
    }));

  return {
    username: profile.login,
    name: profile.name || null,
    bio: profile.bio || null,
    location: profile.location || null,
    email: profile.email || null,
    blog: profile.blog || null,
    company: profile.company || null,
    avatar_url: profile.avatar_url,
    github_url: profile.html_url,
    public_repos: profile.public_repos,
    public_gists: profile.public_gists,
    followers: profile.followers,
    following: profile.following,
    total_stars: totalStars,
    total_forks: totalForks,
    most_used_language: mostUsedLanguage,
    top_repos: JSON.stringify(topRepos),
    account_created_at: new Date(profile.created_at),
    last_analyzed_at: new Date(),
  };
};

module.exports = { fetchUserProfile, fetchUserRepos, computeInsights };
