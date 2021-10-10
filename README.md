# VRChat Friends ID Extension

**Extension is still in development. Some features/UX may not work properly yet.**

A Chrome extension that makes a call to the VRChat.com API on the user's behalf, populating the textarea with an array IDs of the user's VRChat friends provided by the API's response.

* Data is only saved locally to the user's browser for UX purposes and to prevent API abuse due to user error.
* The API call is made through a whitehat method via https://vrchat.com/api/1/auth/user using an authenticated session.
* No data is sent to any 3rd party servers. You must manually provide the friend IDs list.

# Development

Getting the extension to run for use and development is thankfully pretty easy.

1. Clone the repository
2. Go to chrome://extensions
3. Enable Developer Mode via the switch control on the right side of the blue header.
4. Click "Load unpacked" and choose the root folder of the cloned repository.

And done. It should now show up in your extensions. Edits made to the files will be reflected on every extension popup load (button click).