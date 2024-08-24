
(() => {
  let youtubeLeftControls, youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: "Bookmark at " + getTime(currentTime),
    };

    currentVideoBookmarks = await fetchBookmarks();

    const updatedBookmarks = [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time);
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(updatedBookmarks),
    });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists = document.querySelector(".bookmark-btn");

    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button bookmark-btn";
      bookmarkBtn.title = "Click to bookmark current timestamp";

      youtubeLeftControls = document.querySelector(".ytp-left-controls");
      youtubePlayer = document.querySelector('.video-stream');

      youtubeLeftControls.appendChild(bookmarkBtn);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  chrome.runtime.onMessage.addListener(async (message, sender, response) => {
    const { type, value, videoId } = message;

    if (type === "NEW") {
      currentVideo = videoId;
      await newVideoLoaded();
    } else if (type === "PLAY") {
      if (youtubePlayer) {
        youtubePlayer.currentTime = value;
      }
    } else if (type === "DELETE") {
      currentVideoBookmarks = currentVideoBookmarks.filter((bookmark) => bookmark.time !== value);
      await chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });

      response(currentVideoBookmarks);
    }
  });

  const getTime = (t) => {
    const date = new Date(0);
    date.setSeconds(t);
    return date.toISOString().substr(11, 8);
  };

  newVideoLoaded();
})();
