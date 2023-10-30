const { User } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw AuthenticationError;
    },
  },

  Mutation: {
    login: async (parent, { email, password }) => {
      try {
        const user = await User.findOne({ email });
        if (!user || !(await user.isCorrectPassword(password))) {
          throw AuthenticationError;
        }
        const token = signToken(user);
        return { token, user };
      } catch (error) {
        console.error(error);
        throw new Error("Failed to login. Please try again.");
      }
    },

    addUser: async (parent, { username, email, password }) => {
      try {
        const user = await User.create({ username, email, password });
        const token = signToken(user);
        return { token, user };
      } catch (error) {
        console.error(error);
        throw new Error("Failed to create user. Please try again.");
      }
    },

    saveBook: async (
      parent,
      { authors, description, title, bookId, image, link },
      context
    ) => {
      if (context.user) {
        try {
          const user = await User.findOneAndUpdate(
            { _id: context.user._id },
            {
              $addToSet: {
                savedBooks: {
                  authors,
                  description,
                  title,
                  bookId,
                  image,
                  link,
                },
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );
          return user;
        } catch (error) {
          console.error(error);
          throw new Error("Failed to save book. Please try again.");
        }
      }
      throw AuthenticationError;
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { runValidators: true, new: true }
        );
        return user;
      }
    },
  },
};

module.exports = resolvers;
