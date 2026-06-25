const { pool } = require("../config/db");
const {
  fetchUserProfile,
  fetchUserRepos,
  computeInsights,
} = require("../services/githubService");

const analyzeProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    if (!username || !/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub username format",
      });
    }

    let profile;
    try {
      profile = await fetchUserProfile(username);
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).json({
          success: false,
          message: `GitHub user '${username}' not found`,
        });
      }
      if (err.response?.status === 403) {
        return res.status(429).json({
          success: false,
          message: "GitHub API rate limit exceeded. Provide a GITHUB_TOKEN in .env to increase limits.",
        });
      }
      throw err;
    }

    const repos = await fetchUserRepos(username);
    const insights = computeInsights(profile, repos);

    const upsertQuery = `
      INSERT INTO github_profiles (
        username, name, bio, location, email, blog, company,
        avatar_url, github_url, public_repos, public_gists,
        followers, following, total_stars, total_forks,
        most_used_language, top_repos, account_created_at, last_analyzed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        bio = VALUES(bio),
        location = VALUES(location),
        email = VALUES(email),
        blog = VALUES(blog),
        company = VALUES(company),
        avatar_url = VALUES(avatar_url),
        github_url = VALUES(github_url),
        public_repos = VALUES(public_repos),
        public_gists = VALUES(public_gists),
        followers = VALUES(followers),
        following = VALUES(following),
        total_stars = VALUES(total_stars),
        total_forks = VALUES(total_forks),
        most_used_language = VALUES(most_used_language),
        top_repos = VALUES(top_repos),
        account_created_at = VALUES(account_created_at),
        last_analyzed_at = VALUES(last_analyzed_at)
    `;

    await pool.execute(upsertQuery, [
      insights.username,
      insights.name,
      insights.bio,
      insights.location,
      insights.email,
      insights.blog,
      insights.company,
      insights.avatar_url,
      insights.github_url,
      insights.public_repos,
      insights.public_gists,
      insights.followers,
      insights.following,
      insights.total_stars,
      insights.total_forks,
      insights.most_used_language,
      insights.top_repos,
      insights.account_created_at,
      insights.last_analyzed_at,
    ]);

    const [rows] = await pool.execute(
      "SELECT * FROM github_profiles WHERE username = ?",
      [insights.username]
    );

    const result = rows[0];
    if (result.top_repos && typeof result.top_repos === "string") {
      result.top_repos = JSON.parse(result.top_repos);
    }

    return res.status(200).json({
      success: true,
      message: `Profile for '${username}' analyzed and stored successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllProfiles = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const sortBy = ["followers", "total_stars", "public_repos", "last_analyzed_at", "created_at"].includes(req.query.sort_by)
      ? req.query.sort_by
      : "last_analyzed_at";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) as total FROM github_profiles"
    );

    const [rows] = await pool.query(
      `SELECT id, username, name, bio, location, avatar_url, github_url,
              public_repos, followers, following, total_stars, total_forks,
              most_used_language, last_analyzed_at, created_at
       FROM github_profiles
       ORDER BY ${sortBy} ${order}
       LIMIT ${limit} OFFSET ${offset}`
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProfileByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;

    const [rows] = await pool.execute(
      "SELECT * FROM github_profiles WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Profile for '${username}' not found. Use POST /api/analyze/${username} to analyze it first.`,
      });
    }

    const result = rows[0];
    if (result.top_repos && typeof result.top_repos === "string") {
      result.top_repos = JSON.parse(result.top_repos);
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const [result] = await pool.execute(
      "DELETE FROM github_profiles WHERE username = ?",
      [username]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Profile for '${username}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Profile for '${username}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
};
