import Story from "../models/storyModel.js";
import User from "../models/userModel.js";
import { formatDistanceToNow } from "date-fns";

export const createStory = async (req, res) => {
  try {
    const { media_type } = req.body;
    const userId = req.user._id;

    console.log("req files : ", req.file);

    if (!media_type || !["image", "video"].includes(media_type)) {
      return res.status(400).json({
        status: false,
        message: "Invalid or missing media_type",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "Media file is required",
      });
    }

    // Generate media URL
    const mediaUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename
      }`;

    const story = await Story.create({
      user_id: userId,
      media_url: mediaUrl,
      media_type,
    });

    res.status(201).json({
      status: true,
      message: "Story uploaded successfully",
      data: {
        id: story._id,
        media_url: story.media_url,
        media_type: story.media_type,
        created_at: story.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const getAllStories = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get stories less than 24 hours old
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({
      createdAt: { $gte: oneDayAgo },
      status: "active",
    })
      .populate("user_id", "name profile_image")
      .sort("-createdAt")
      .lean();

    const formattedStories = await Promise.all(
      stories.map(async (story) => {
        // Check if current user has viewed this story
        const hasViewed = story.views.some(
          (view) => view.user_id.toString() === userId.toString()
        );

        // If not viewed, mark as viewed
        if (!hasViewed) {
          await Story.findByIdAndUpdate(story._id, {
            $push: {
              views: {
                user_id: userId,
                viewed_at: new Date(),
              },
            },
          });
        }

        return {
          id: story._id,
          user: {
            id: story.user_id._id,
            name: story.user_id.name,
            profile: story.user_id.profile_image,
          },
          media_url: story.media_url,
          media_type: story.media_type,
          created_at: formatDistanceToNow(new Date(story.createdAt), {
            addSuffix: true,
          }),
        };
      })
    );

    res.status(200).json({
      status: true,
      stories: formattedStories,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const userId = req.user._id;
    const storyId = req.params.id;

    const story = await Story.findOne({
      _id: storyId,
      user_id: userId,
    });

    if (!story) {
      return res.status(404).json({
        status: false,
        message: "Story not found or unauthorized",
      });
    }

    await story.deleteOne();

    res.status(200).json({
      status: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
