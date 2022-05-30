(() => {
  const authErrorEl = document.getElementById('authError');
  const buttonEl = document.getElementById('idsButton');
  const buttonCountEl = document.getElementById('idsButtonCount');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const loadingEl = document.getElementById('loading');
  const textareaEl = document.getElementById('idsTextarea');
  const rateLimitTimeOut = 60;
  let countdownInterval;

  const friendsIdsKey = 'pastFriendsIds';
  const friendsIdsDateKey = 'pastFriendsIdsDate';
  const lastErrorKey = 'lastError';
  const lastPressedDateKey = 'lastPressedDate';

  const errorValues = {
    auth: 'authError',
  };

  /**
   * Runtime logic, called at the bottom of the script.
   */
  async function init() {
    handleRateLimiting();

    let data = await getData();

    // Populate with prior friend IDs data.
    textareaEl.value = data[friendsIdsKey] ? data[friendsIdsKey] : '';
    changeLastUpdated(data[friendsIdsDateKey]);

    // Show instructions based on prior state.
    if (data[lastErrorKey] === errorValues.auth) showAuthError(true);

    // Event listeners.
    buttonEl.addEventListener('click', handleButtonEvent);
  }

  /*
   * Core Functions
   * ------------------------------------------------------------------------ */

  /**
   * Button onClick event for added friend IDs to textarea.
   * @param {*} event Button element event object.
   */
  async function handleButtonEvent(event) {
    event.preventDefault();

    // Do nothing if disabled, disable if not already.
    if (buttonEl.disabled === true) return false;

    showLoading(true);

    // Get the user's data object.
    const response = await fetch('https://vrchat.com/api/1/auth/user');

    removePriorRetrievedData();

    if (response.status === 200) {
      showAuthError(false);
      handleResponseSuccess(response);
      handleRateLimiting(getCurrentTimeInSeconds());
    } else {
      handleResponseFailure(response);
    }

    showLoading(false);
  }

  /**
   * Handles the successful response.
   * @param {*} response Response object from fetch()
   */
  async function handleResponseSuccess(response) {
    const friendIds = JSON.stringify({ friends: (await response.json()).friends });
    const lastUpdatedDate = getCurrentTimeInSeconds() * 1000;
    textareaEl.value = friendIds;
    saveData(friendsIdsKey, friendIds);
    changeLastUpdated(lastUpdatedDate);
    saveData(friendsIdsDateKey, lastUpdatedDate);
  }

  /**
   * Handles an error response, possibly from authenitcation or API ban.
   * @param {*} response Response object from fetch()
   */
  function handleResponseFailure(response) {
    switch(response.status) {
      case 401:
        // Not logged in, show instruction and navigate to page.
        showAuthError(true);
        redirectToLogin();
        break;
      default:
        // Default error, try again later.
        handleRateLimiting(getCurrentTimeInSeconds());
    }
  }

  /**
   * Disable button if rate limited.
   * This prevents unintentionally abusing VRChat's API resources.
   * @param {Date.getTime() / 1000} lastPressedDateInSeconds
   */
  async function handleRateLimiting(lastPressedDateInSeconds = null) {
    const currentTimeInSeconds = getCurrentTimeInSeconds();

    if (lastPressedDateInSeconds) {
      saveData(lastPressedDateKey, lastPressedDateInSeconds);
    } else {
      lastPressedDateInSeconds = await getSavedDate();
    }
    

    // If there's no saved data, that means the user is opening the extension for the first time ever.
    // In this case, don't rate limit this first request for friend IDs.
    if (lastPressedDateInSeconds === null) {
      return;
    }

    const secondsSinceLastPressed = currentTimeInSeconds - lastPressedDateInSeconds;

    if (secondsSinceLastPressed < rateLimitTimeOut || !(currentTimeInSeconds <= 0))
      startCountdown(lastPressedDateInSeconds + rateLimitTimeOut);
  }

  /**
   * Redirect to VRChat.com's login page.
   */
  function redirectToLogin() {
    chrome.tabs.update({ url: 'https://vrchat.com/home/login' });
  }

  /*
   * UX Functions
   * ------------------------------------------------------------------------ */

  /**
   * Display authentication error to user.
   * @param {boolean} show Whether to show or not.
   */
  function showAuthError(show) {
    if (show) {
      textareaEl.style.display = 'none';
      authErrorEl.style.display = 'block';
      saveData(lastErrorKey, errorValues.auth);
    } else {
      textareaEl.removeAttribute('style');
      authErrorEl.removeAttribute('style');
      saveData(lastErrorKey, null);
    }
  }

  /**
   * Handles displaying the "Last retrieved on" data.
   * @param {*} date
   */
  function changeLastUpdated(date) {
    const lastUpdatedDateEl = lastUpdatedEl.getElementsByTagName('span')[0];
    const dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    if (!date) {
      lastUpdatedEl.style.display = 'none';
    } else {
      lastUpdatedEl.style.display = 'block';
      lastUpdatedDateEl.textContent =
          new Date(date).toLocaleDateString(undefined, dateOptions);
    }
  }

  /**
   * Toggles display of loading element over textarea.
   * @param {boolean} show Whether or not to show the loading indicator.
   */
  function showLoading(show) {
    if (show) {
      textareaEl.value = '';
      loadingEl.style.display = 'block';
    } else {
      loadingEl.removeAttribute('style');
    }
  }

  /**
   * Creates the interval for the button countdown state.
   * @param {*} futureDateInSeconds
   */
  function startCountdown(futureDateInSeconds) {
    buttonCountdown(futureDateInSeconds);
    countdownInterval = setInterval(() => {
      buttonCountdown(futureDateInSeconds);
    }, 1000);
  }

  /**
   * Handles the disabled countdown display of the button.
   * @param {*} countdown number of seconds to show in button.
   */
  function buttonCountdown(futureDateInSeconds = 0) {
    const countdown =
        Math.ceil(futureDateInSeconds - getCurrentTimeInSeconds());
    if (countdown > 0) {
      buttonEl.disabled = true;
      buttonCountEl.textContent = `(${countdown})`;
      buttonCountEl.style.display = 'inline-block';
    } else {
      buttonEl.disabled = false;
      buttonCountEl.style.display = 'none';
      clearInterval(countdownInterval);
    }
  }

  /*
   * Helper Functions
   * ------------------------------------------------------------------------ */

  /**
   * Gets the last pressed date from Chrome storage.
   *
   * @returns {Promise<number | null>} 
   * Returns the date in seconds of the last time the friend IDs were fetched.
   * Returns null if no date saved in storage (ie.e the extension has not be used yet).
   */
  async function getSavedDate() {
    const dateInStorage = (await getData())[lastPressedDateKey];
    if (dateInStorage) return dateInStorage;

    return null;
  }

  /**
   * Retrieves all data from the Chrome local storage.
   */
  async function getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (data) => {
        resolve(data);
      });
    });
  }

  /**
   * Saves data into the Chrome local storage.
   * @param {string} key The data key to lookup/create.
   * @param {*} value The new data payload to store.
   */
  function saveData(key, value) {
    chrome.storage.local.set({[key]: value});
  }

  /**
   * Removes data retrieved from API (and related data) from storage.
   */
  function removePriorRetrievedData() {
    chrome.storage.local.remove(
        [ lastErrorKey, friendsIdsKey, friendsIdsDateKey ]);
  }

  /**
   * Gets the current Date() and converts to seconds.
   */
  function getCurrentTimeInSeconds() {
    return new Date().getTime() / 1000;
  }

  /*
   * Run the app.
   * ------------------------------------------------------------------------ */

  init();
})();