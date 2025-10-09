const Follow = require("../models/follow");
const User = require("../models/user");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const toObjectId = (id) => {
  if (isValidObjectId(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

const ensureFollowTargetExists = async (userId) => {
  console.log("🔍 Verificando si existe el usuario con ID:", userId);
  console.log("🔍 Tipo de ID recibido:", typeof userId);
  console.log("🔍 ID es válido como ObjectId:", isValidObjectId(userId));
  
  const user = await User.findById(userId);
  console.log("🔍 Usuario encontrado:", user ? "✅ Sí" : "❌ No");
  
  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const followUser = async (followerId, followedId) => {
  console.log("📌 followUser llamado con:");
  console.log("   - followerId:", followerId, "(tipo:", typeof followerId, ")");
  console.log("   - followedId:", followedId, "(tipo:", typeof followedId, ")");
  
  if (String(followerId) === String(followedId)) {
    const error = new Error("No puedes seguirte a ti mismo");
    error.statusCode = 400;
    throw error;
  }

  await ensureFollowTargetExists(followedId);

  const existingFollow = await Follow.findOne({
    user: toObjectId(followerId),
    followed: toObjectId(followedId),
  });

  if (existingFollow) {
    return {
      alreadyFollowing: true,
      follow: existingFollow,
    };
  }

  const follow = new Follow({
    user: toObjectId(followerId),
    followed: toObjectId(followedId),
  });

  await follow.save();

  return {
    alreadyFollowing: false,
    follow,
  };
};

const unfollowUser = async (followerId, followedId) => {
  const followRelation = await Follow.findOneAndDelete({
    user: toObjectId(followerId),
    followed: toObjectId(followedId),
  });

  return {
    followRelation,
  };
};

const getFollowing = async ({ userId, page = 1, limit = 10 }) => {
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const skip = (parsedPage - 1) * limit;

  const follows = await Follow.find({ user: toObjectId(userId) })
    .skip(skip)
    .limit(limit)
    .populate("followed", "_id name lastname nickname avatar bio")
    .exec();

  const total = await Follow.countDocuments({ user: toObjectId(userId) });
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    following: follows.map((follow) => follow.followed),
    follows,
    total,
    pages: totalPages,
    currentPage: parsedPage,
  };
};

const getFollowers = async ({ userId, page = 1, limit = 10 }) => {
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const skip = (parsedPage - 1) * limit;

  const follows = await Follow.find({ followed: toObjectId(userId) })
    .skip(skip)
    .limit(limit)
    .populate("user", "_id name lastname nickname avatar bio")
    .exec();

  const total = await Follow.countDocuments({ followed: toObjectId(userId) });
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    followers: follows.map((follow) => follow.user),
    follows,
    total,
    pages: totalPages,
    currentPage: parsedPage,
  };
};

const getCounters = async (userId) => {
  const followersCount = await Follow.countDocuments({
    followed: toObjectId(userId),
  });

  const followingCount = await Follow.countDocuments({
    user: toObjectId(userId),
  });

  return {
    followers: followersCount,
    following: followingCount,
  };
};

const getFollowersCount = async (userId) => {
  const count = await Follow.countDocuments({ followed: toObjectId(userId) });
  return { count };
};

const getFollowingCount = async (userId) => {
  const count = await Follow.countDocuments({ user: toObjectId(userId) });
  return { count };
};

const checkFollow = async (followerId, followedId) => {
  const follow = await Follow.findOne({
    user: toObjectId(followerId),
    followed: toObjectId(followedId),
  });

  return {
    isFollowing: Boolean(follow),
    follow: follow || null,
  };
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getCounters,
  getFollowersCount,
  getFollowingCount,
  checkFollow,
};
