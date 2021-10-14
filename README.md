# VRChat Friends ID Extension
A simple Google Chrome extension that makes a call to VRChat.com's public API using the user's already authenticated session and displays a JSON object of the user's VRChat friend list IDs; As provided by the API's response. If the user isn't already authenticated with VRChat.com, the extension will redirect them to the login page where they can then make another "Get IDs" request after successfully logging in.

<p align="center">
  <img src="https://raw.githubusercontent.com/furality/vrc-friend-list-extension/master/screenshot.png" alt="Screenshot of the extension" width="">
</p>

# Privacy is important!

* Data is only saved locally to the user's browser for UX purposes and to prevent API abuse due to user error.
* The extension makes a whitehat API call to https://vrchat.com/api/1/auth/user, which depends on an already authenticated session with VRChat.com
* No data is ever sent to any 3rd-party servers. You must manually copy/paste the generated friend IDs list, if you so choose to.
* The entire source code is available in this Github repo: https://github.com/furality/vrc-friend-list-extension

## Data saved locally

Since the extension state is reloaded on every opening, storing certain data helps improve UX. As a reminder, all data is saved locally and never sent/shared with any 3rd party.

* **pastFriendsIds** - An array of VRChat friend IDs as retrieved from API, formatted to a JSON object. To prevent a blank textarea on the reopenning of the extension especially if the user closes it on error or tab navigation does.
* **pastFriendsIdsDate** - Date timestamp since the last successful API response, to display to the user via "Last retrieved on" text in the footer. Helps the user know how old the data is.
* **lastError** - A string identifier for the last error received from a failed response. For example, used for toggling the authentication error visual.
* **lastPressedDate** - Date timestamp since the last time the "Get IDs" button was pressed. This is to rate limit requests to prevent API abuse from user error. Used on the UI to calculate and show the animated button countdown.

# Development

Getting the extension to run for use and development is thankfully pretty easy.

1. Clone the repository
2. Go to chrome://extensions
3. Enable Developer Mode via the switch control on the right side of the blue header.
4. Click "Load unpacked" and choose the root folder of the cloned repository.

And done! It should now show up in your extensions. Edits made to the files will be reflected on every extension popup load (button click).