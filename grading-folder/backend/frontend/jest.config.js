export default {
    testEnvironment: "jsdom",
    transform: {
      "^.+\\.[tj]sx?$": "babel-jest",
    },
    moduleFileExtensions: ["js", "jsx"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
      "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    },
  };
  