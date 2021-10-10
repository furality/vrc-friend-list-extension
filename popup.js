(() => {
  const authErrorEl = document.getElementById('authError');
  const buttonEl = document.getElementById('idsButton');
  const buttonCountEl = document.getElementById('idsButtonCount');
  const textareaEl = document.getElementById('ids');
  const rateLimitTimeOut = 60;
  let countdownInterval;

  const lastErrorsKey = 'lastErrors';
  const lastPressedDateKey = 'lastPressedDate';
  const friendsIdsKey = 'pastFriendsIds';

  /**
   * Runtime logic, called at the bottom of the script.
   */
  async function init() {
    handleRateLimiting();

    data = await getData();

    // Populate with prior friend ID data.
    textareaEl.value = data[friendsIdsKey];

    // Show instructions based on prior state.
    if (data[lastErrorsKey] === 'authError') showAuthError();

    // Event listeners
    buttonEl.addEventListener('click', handleButtonEvent);
    // TODO on textarea change, save friend list to storage
  }

  /**
   * Display authentication error to user.
   * @param {boolean} show Whether to show or not.
   */
  function showAuthError(show) {
    if (show) {
      textareaEl.style.display = 'none';
      authErrorEl.style.display = 'block';
    } else {
      textareaEl.removeAttribute('style');
      authErrorEl.removeAttribute('style');
    }
  }

  /**
   * Disable button if rate limited.
   * This prevents unintentionally abusing VRChat's API resources.
   * @param {Date.getTime() / 1000} lastPressedDateInSeconds
   */
  async function handleRateLimiting(lastPressedDateInSeconds = null) {
    const currentTimeInSeconds = getCurrentTimeInSeconds();

    if (lastPressedDateInSeconds)
      saveDate(lastPressedDateInSeconds);
    else
      lastPressedDateInSeconds = await getSavedDate();

    const secondsSinceLastPressed = currentTimeInSeconds - lastPressedDateInSeconds;

    if (secondsSinceLastPressed < rateLimitTimeOut || !(currentTimeInSeconds <= 0))
      startCountdown(lastPressedDateInSeconds + rateLimitTimeOut);
  }

  /**
   * Button onClick event for added friend IDs to textarea.
   * @param {*} event
   */
  async function handleButtonEvent(event) {
    event.preventDefault();

    // Do nothing if disabled, disable if not already.
    if (buttonEl.disabled === true) return false;
    //else buttonEl.disabled = true;

    // Get the user's data object.
    const response = await fetch('https://vrchat.com/api/1/auth/user');

    if (!response.status === 200) {
      handleResponseSuccess(response);
      handleRateLimiting(getCurrentTimeInSeconds());
    } else {
      handleResponseFailure(response);

      // Go to VRChat.com to login or use auth cookie for later request.
      chrome.tabs.update({ url: 'https://vrchat.com/home/login' });
    }
  }

  /**
   * Handles the successful response.
   * @param {*} response
   */
  async function handleResponseSuccess(response) {
    const friendIds = JSON.stringify({ friends: (await response.json()).friends });
    saveData(friendsIdsKey, friendIds);
    textareaEl.value = friendIds;
  }

  /**
   * Handles an error response, possibly from authenitcation or API ban.
   * @param {*} response
   */
  function handleResponseFailure(response) {
    switch(response.status) {
      case 401:
        // Not logged in, show instruction and navigate to page.
        setTimeout(() => redirectToLogin(), 3000);
        break;
      default:
        // Default error, try again later.
        handleRateLimiting(getCurrentTimeInSeconds());
    }
  }

  /**
   * Redirect to VRChat.com's login page.
   */
  function redirectToLogin() {
    chrome.tabs.update({ url: 'https://vrchat.com/home/login' });
  }

  /**
   * Starts the disabled button countdown animation.
   * @param {*} futureDateInSeconds
   */
  function startCountdown(futureDateInSeconds) {
    handleButtonCountdown(futureDateInSeconds);
    countdownInterval = setInterval(() => {
      handleButtonCountdown(futureDateInSeconds);
    }, 1000);
  }

  /**
   * Handles the disable state of the button.
   * @param {*} countdown number of seconds to show in button.
   */
  function handleButtonCountdown(futureDateInSeconds = 0) {
    const countdown =
        Math.ceil(futureDateInSeconds - getCurrentTimeInSeconds());
    if (countdown > 0) {
      buttonEl.disabled = true;
      buttonCountEl.innerHTML = `(${countdown})`;
      buttonCountEl.style.display = 'inline-block';
    } else {
      buttonEl.disabled = false;
      buttonCountEl.style.display = 'none';
      clearInterval(countdownInterval);
    }
  }

  /**
   * Gets the last pressed date from Chrome storage.
   * @returns {Promise<int>} The date in seconds.
   */
  async function getSavedDate() {
    const dateInStorage = (await getData())[lastPressedDateKey];
    if (dateInStorage) return dateInStorage;
    const currentTime = getCurrentTimeInSeconds();
    saveDate(currentTime);
    return currentTime;
  }

  /**
   * Saves the last pressed date in Chrome storage.
   * @param {int} newDateInSeconds New date to add in seconds.
   */
  function saveDate(newDateInSeconds) {
    saveData(lastPressedDateKey, newDateInSeconds);
  }

  /**
   * Helper for accessing the Chrome sync storage.
   */
  async function getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (data) => {
        resolve(data);
      });
    });
  }

  /**
   * Helper for saving data into the Chrome sync storage.
   */
  function saveData(key, value) {
    chrome.storage.local.set({[key]: value});
  }

  /**
   * Gets the current Date() and converts to seconds.
   */
  function getCurrentTimeInSeconds() {
    return new Date().getTime() / 1000;
  }

  init();
})();